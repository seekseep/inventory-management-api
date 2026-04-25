import { writeFileSync } from "fs";
import {
  locations,
  categories,
  stapleStyles,
  seasonalStyles,
  limitedStyles,
  type LocationDef,
  type StyleDef,
} from "./seed-data";

// ============================================
// ユーティリティ
// ============================================

let idCounter = 0;
function genId(prefix: string): string {
  idCounter++;
  return `${prefix}-${String(idCounter).padStart(6, "0")}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 19) + "Z";
}

function escSQL(s: string | null): string {
  if (s === null) return "NULL";
  return `'${s.replace(/'/g, "''")}'`;
}

// ============================================
// Item & Variant 生成
// ============================================

type ItemDef = {
  id: string;
  name: string;
  type: "staple" | "seasonal" | "limited";
  status: "draft" | "active" | "on_sale" | "discontinued";
  season: string | null;
  price: number;
  categoryId: string;
  activeFrom: string;
  onSaleFrom?: string;
  discontinuedFrom?: string;
  safetyStock: number;
};

type VariantDef = {
  id: string;
  itemId: string;
  sku: string;
  color: string;
  size: string;
};

function generateItemsAndVariants(styles: StyleDef[]): { items: ItemDef[]; variants: VariantDef[] } {
  const items: ItemDef[] = [];
  const variants: VariantDef[] = [];

  for (const style of styles) {
    const itemId = genId("item");
    items.push({
      id: itemId,
      name: style.name,
      type: style.type,
      status: "draft",
      season: style.season ?? null,
      price: style.price,
      categoryId: style.categoryId,
      activeFrom: style.activeFrom,
      onSaleFrom: style.onSaleFrom,
      discontinuedFrom: style.discontinuedFrom,
      safetyStock: style.safetyStock,
    });

    for (const color of style.colors) {
      for (const size of style.sizes) {
        const skuCode = `${style.name.slice(0, 8)}-${color.slice(0, 3)}-${size}`.replace(/\s/g, "");
        const variantId = genId("iv");
        variants.push({
          id: variantId,
          itemId,
          sku: skuCode + "-" + String(idCounter),
          color,
          size,
        });
      }
    }
  }

  return { items, variants };
}

// ============================================
// 取引生成
// ============================================

type Transaction = {
  id: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  type: "purchase" | "transfer" | "sale" | "disposal";
  note: string | null;
  createdAt: string;
  items: { itemVariantId: string; quantity: number }[];
};

type Inventory = Map<string, number>; // key: `${variantId}:${locationId}` → quantity

function getActiveLocations(date: Date): LocationDef[] {
  return locations.filter((loc) => {
    const open = new Date(loc.openDate);
    const close = loc.closeDate ? new Date(loc.closeDate) : null;
    return date >= open && (!close || date <= close);
  });
}

function getActiveStores(date: Date): LocationDef[] {
  return getActiveLocations(date).filter((l) => l.type === "store");
}

function getActiveWarehouses(date: Date): LocationDef[] {
  return getActiveLocations(date).filter((l) => l.type === "warehouse");
}

type VariantWithItem = VariantDef & {
  item: ItemDef;
};

function getActiveVariants(date: Date, allVariantsWithItems: VariantWithItem[]): VariantWithItem[] {
  return allVariantsWithItems.filter((v) => {
    const active = new Date(v.item.activeFrom);
    const disc = v.item.discontinuedFrom ? new Date(v.item.discontinuedFrom) : null;
    return date >= active && (!disc || date <= disc);
  });
}

function getItemStatus(item: ItemDef, date: Date): ItemDef["status"] {
  if (item.discontinuedFrom && date >= new Date(item.discontinuedFrom)) return "discontinued";
  if (item.onSaleFrom && date >= new Date(item.onSaleFrom)) return "on_sale";
  if (date >= new Date(item.activeFrom)) return "active";
  return "draft";
}

// Phase config
type PhaseConfig = {
  name: string;
  startDate: string;
  endDate: string;
  purchaseFreqPerMonth: number;
  purchaseQtyPerSKU: [number, number];
  transferFreqPerWeek: number;
  transferQtyPerSKU: [number, number];
  salesPerDay: [number, number];
  disposalPerMonth: number;
  snapshotMonthly: boolean;
};

const phases: PhaseConfig[] = [
  {
    name: "停滞期",
    startDate: "2020-04-01",
    endDate: "2020-09-30",
    purchaseFreqPerMonth: 2,
    purchaseQtyPerSKU: [2, 4],
    transferFreqPerWeek: 1,
    transferQtyPerSKU: [1, 3],
    salesPerDay: [3, 5],
    disposalPerMonth: 0,
    snapshotMonthly: true,
  },
  {
    name: "最初の成長",
    startDate: "2020-10-01",
    endDate: "2021-09-30",
    purchaseFreqPerMonth: 4,
    purchaseQtyPerSKU: [3, 6],
    transferFreqPerWeek: 3,
    transferQtyPerSKU: [2, 5],
    salesPerDay: [15, 25],
    disposalPerMonth: 0,
    snapshotMonthly: true,
  },
  {
    name: "1度目の衰退",
    startDate: "2021-10-01",
    endDate: "2022-09-30",
    purchaseFreqPerMonth: 1,
    purchaseQtyPerSKU: [1, 3],
    transferFreqPerWeek: 1,
    transferQtyPerSKU: [1, 2],
    salesPerDay: [5, 8],
    disposalPerMonth: 5,
    snapshotMonthly: true,
  },
  {
    name: "回復",
    startDate: "2022-10-01",
    endDate: "2023-09-30",
    purchaseFreqPerMonth: 3,
    purchaseQtyPerSKU: [2, 5],
    transferFreqPerWeek: 2,
    transferQtyPerSKU: [2, 4],
    salesPerDay: [18, 32],
    disposalPerMonth: 2,
    snapshotMonthly: true,
  },
  {
    name: "安定",
    startDate: "2023-10-01",
    endDate: "2024-03-31",
    purchaseFreqPerMonth: 2,
    purchaseQtyPerSKU: [3, 5],
    transferFreqPerWeek: 2,
    transferQtyPerSKU: [2, 4],
    salesPerDay: [25, 35],
    disposalPerMonth: 1,
    snapshotMonthly: true,
  },
  {
    name: "次の成長",
    startDate: "2024-04-01",
    endDate: "2025-03-31",
    purchaseFreqPerMonth: 5,
    purchaseQtyPerSKU: [4, 8],
    transferFreqPerWeek: 4,
    transferQtyPerSKU: [3, 6],
    salesPerDay: [40, 60],
    disposalPerMonth: 2,
    snapshotMonthly: true,
  },
];

// ============================================
// メイン生成ロジック
// ============================================

function generate() {
  const staple = generateItemsAndVariants(stapleStyles);
  const seasonal = generateItemsAndVariants(seasonalStyles);
  const limited = generateItemsAndVariants(limitedStyles);

  const allItems = [...staple.items, ...seasonal.items, ...limited.items];
  const allVariants = [...staple.variants, ...seasonal.variants, ...limited.variants];

  // Variant に親 Item の情報を付与
  const allVariantsWithItems: VariantWithItem[] = allVariants.map((v) => ({
    ...v,
    item: allItems.find((i) => i.id === v.itemId)!,
  }));

  const transactions: Transaction[] = [];
  const inventory: Inventory = new Map();
  const snapshots: { id: string; locationId: string; note: string; createdAt: string; items: { itemVariantId: string; quantity: number; expectedQuantity: number }[] }[] = [];

  function getInv(variantId: string, locationId: string): number {
    return inventory.get(`${variantId}:${locationId}`) ?? 0;
  }

  function setInv(variantId: string, locationId: string, qty: number) {
    inventory.set(`${variantId}:${locationId}`, Math.max(0, qty));
  }

  for (const phase of phases) {
    const start = new Date(phase.startDate);
    const end = new Date(phase.endDate);
    let current = new Date(start);

    let dayInMonth = 0;
    let currentMonth = current.getMonth();
    let purchasesThisMonth = 0;
    let disposalsThisMonth = 0;
    let dayInWeek = 0;
    let transfersThisWeek = 0;

    while (current <= end) {
      // Month reset
      if (current.getMonth() !== currentMonth) {
        currentMonth = current.getMonth();
        purchasesThisMonth = 0;
        disposalsThisMonth = 0;
        dayInMonth = 0;

        // Monthly snapshot
        if (phase.snapshotMonthly) {
          const activeLocations = getActiveLocations(current);
          for (const loc of activeLocations) {
            const snapshotItems: { itemVariantId: string; quantity: number; expectedQuantity: number }[] = [];
            for (const variant of getActiveVariants(current, allVariantsWithItems)) {
              const qty = getInv(variant.id, loc.id);
              if (qty > 0 || variant.item.safetyStock > 0) {
                const variance = Math.random() < 0.05 ? randomInt(-2, -1) : 0;
                snapshotItems.push({
                  itemVariantId: variant.id,
                  quantity: Math.max(0, qty + variance),
                  expectedQuantity: qty,
                });
              }
            }
            if (snapshotItems.length > 0) {
              snapshots.push({
                id: genId("snap"),
                locationId: loc.id,
                note: `${current.getFullYear()}年${current.getMonth() + 1}月 定期棚卸し`,
                createdAt: toISO(current),
                items: snapshotItems,
              });
            }
          }
        }
      }

      // Week reset
      if (current.getDay() === 1) {
        dayInWeek = 0;
        transfersThisWeek = 0;
      }

      const activeVariants = getActiveVariants(current, allVariantsWithItems);
      const activeStores = getActiveStores(current);
      const activeWarehouses = getActiveWarehouses(current);

      if (activeVariants.length === 0 || activeStores.length === 0) {
        current = addDays(current, 1);
        dayInMonth++;
        dayInWeek++;
        continue;
      }

      // --- Purchase (仕入れ) ---
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      const purchaseInterval = Math.floor(daysInMonth / Math.max(1, phase.purchaseFreqPerMonth));
      if (dayInMonth % purchaseInterval === 0 && purchasesThisMonth < phase.purchaseFreqPerMonth) {
        const warehouse = randomPick(activeWarehouses);
        const variantsToOrder = activeVariants
          .filter((v) => getItemStatus(v.item, current) === "active")
          .filter(() => Math.random() < 0.3)
          .slice(0, randomInt(10, 40));

        if (variantsToOrder.length > 0) {
          const txItems = variantsToOrder.map((variant) => {
            const qty = randomInt(...phase.purchaseQtyPerSKU);
            setInv(variant.id, warehouse.id, getInv(variant.id, warehouse.id) + qty);
            return { itemVariantId: variant.id, quantity: qty };
          });

          transactions.push({
            id: genId("tx"),
            fromLocationId: null,
            toLocationId: warehouse.id,
            type: "purchase",
            note: `${phase.name} 定期仕入れ`,
            createdAt: toISO(current),
            items: txItems,
          });
          purchasesThisMonth++;
        }
      }

      // --- Transfer (移動) ---
      if (transfersThisWeek < phase.transferFreqPerWeek && dayInWeek % 2 === 0) {
        const warehouse = randomPick(activeWarehouses);
        const store = randomPick(activeStores);
        const variantsToTransfer = activeVariants
          .filter((v) => getInv(v.id, warehouse.id) > 0)
          .filter(() => Math.random() < 0.3)
          .slice(0, randomInt(5, 20));

        if (variantsToTransfer.length > 0) {
          const txItems = variantsToTransfer.map((variant) => {
            const available = getInv(variant.id, warehouse.id);
            const qty = Math.min(available, randomInt(...phase.transferQtyPerSKU));
            setInv(variant.id, warehouse.id, getInv(variant.id, warehouse.id) - qty);
            setInv(variant.id, store.id, getInv(variant.id, store.id) + qty);
            return { itemVariantId: variant.id, quantity: qty };
          });

          transactions.push({
            id: genId("tx"),
            fromLocationId: warehouse.id,
            toLocationId: store.id,
            type: "transfer",
            note: `${warehouse.name}→${store.name} 定期補充`,
            createdAt: toISO(current),
            items: txItems.filter((i) => i.quantity > 0),
          });
          transfersThisWeek++;
        }
      }

      // --- Sale (販売) ---
      const salesToday = randomInt(...phase.salesPerDay);
      const saleableInStores = activeVariants.filter((variant) =>
        activeStores.some((store) => getInv(variant.id, store.id) > 0)
      );

      if (saleableInStores.length > 0) {
        for (const store of activeStores) {
          const storeShare = Math.ceil(salesToday / activeStores.length);
          const storeVariants = saleableInStores.filter(
            (variant) => getInv(variant.id, store.id) > 0
          );
          if (storeVariants.length === 0) continue;

          const txItems: { itemVariantId: string; quantity: number }[] = [];
          for (let i = 0; i < storeShare && storeVariants.length > 0; i++) {
            const variant = randomPick(storeVariants);
            const available = getInv(variant.id, store.id);
            if (available <= 0) continue;
            const qty = 1;
            setInv(variant.id, store.id, available - qty);
            txItems.push({ itemVariantId: variant.id, quantity: qty });
          }

          if (txItems.length > 0) {
            transactions.push({
              id: genId("tx"),
              fromLocationId: store.id,
              toLocationId: null,
              type: "sale",
              note: null,
              createdAt: toISO(current),
              items: txItems,
            });
          }
        }
      }

      // --- Disposal (廃棄) ---
      if (phase.disposalPerMonth > 0 && disposalsThisMonth < phase.disposalPerMonth && dayInMonth === 15) {
        const warehouse = randomPick(activeWarehouses);
        const disposalCandidates = allVariantsWithItems.filter(
          (v) =>
            getItemStatus(v.item, current) === "on_sale" ||
            getItemStatus(v.item, current) === "discontinued"
        ).filter((v) => getInv(v.id, warehouse.id) > 0);

        if (disposalCandidates.length > 0) {
          const toDispose = disposalCandidates.slice(0, randomInt(3, 10));
          const txItems = toDispose.map((variant) => {
            const qty = Math.min(getInv(variant.id, warehouse.id), randomInt(1, 3));
            setInv(variant.id, warehouse.id, getInv(variant.id, warehouse.id) - qty);
            return { itemVariantId: variant.id, quantity: qty };
          });

          transactions.push({
            id: genId("tx"),
            fromLocationId: warehouse.id,
            toLocationId: null,
            type: "disposal",
            note: "シーズン終了品/不良品 廃棄",
            createdAt: toISO(current),
            items: txItems.filter((i) => i.quantity > 0),
          });
          disposalsThisMonth++;
        }
      }

      current = addDays(current, 1);
      dayInMonth++;
      dayInWeek++;
    }
  }

  // Update Item statuses to final state
  const finalDate = new Date("2025-03-31");
  for (const item of allItems) {
    item.status = getItemStatus(item, finalDate);
  }

  return { allItems, allVariants, transactions, inventory, snapshots };
}

// ============================================
// SQL 出力
// ============================================

function toSQL(data: ReturnType<typeof generate>): string {
  const lines: string[] = [];
  const now = toISO(new Date("2025-03-31"));

  lines.push("-- Generated seed data for OUTLINE inventory management");
  lines.push("-- 5 years: 2020-04 to 2025-03");
  lines.push("");

  // API Keys
  lines.push("-- API Keys");
  lines.push(
    `INSERT INTO api_keys (id, name, key, active, created_at, updated_at) VALUES ('apikey-001', 'dev', 'dev-api-key-change-me', 1, '2025-03-31T00:00:00Z', '2025-03-31T00:00:00Z');`
  );
  lines.push("");

  // Categories
  lines.push("-- Categories");
  for (const cat of categories) {
    lines.push(
      `INSERT INTO item_categories (id, parent_id, name, description, created_at, updated_at) VALUES (${escSQL(cat.id)}, ${escSQL(cat.parentId)}, ${escSQL(cat.name)}, ${escSQL(cat.description)}, ${escSQL("2020-04-01T00:00:00Z")}, ${escSQL("2020-04-01T00:00:00Z")});`
    );
  }
  lines.push("");

  // Locations
  lines.push("-- Locations");
  for (const loc of locations) {
    lines.push(
      `INSERT INTO locations (id, name, type, address, created_at, updated_at) VALUES (${escSQL(loc.id)}, ${escSQL(loc.name)}, ${escSQL(loc.type)}, ${escSQL(loc.address)}, ${escSQL(loc.openDate + "T00:00:00Z")}, ${escSQL(loc.openDate + "T00:00:00Z")});`
    );
  }
  lines.push("");

  // Items (商品)
  lines.push("-- Items");
  for (const item of data.allItems) {
    lines.push(
      `INSERT INTO items (id, name, description, type, status, season, price, item_category_id, created_at, updated_at) VALUES (${escSQL(item.id)}, ${escSQL(item.name)}, NULL, ${escSQL(item.type)}, ${escSQL(item.status)}, ${escSQL(item.season)}, ${item.price}, ${escSQL(item.categoryId)}, ${escSQL(item.activeFrom + "T00:00:00Z")}, ${escSQL(now)});`
    );
  }
  lines.push("");

  // Item Variants (バリアント)
  lines.push("-- Item Variants");
  for (const variant of data.allVariants) {
    lines.push(
      `INSERT INTO item_variants (id, item_id, sku, color, size, created_at, updated_at) VALUES (${escSQL(variant.id)}, ${escSQL(variant.itemId)}, ${escSQL(variant.sku)}, ${escSQL(variant.color)}, ${escSQL(variant.size)}, ${escSQL(now)}, ${escSQL(now)});`
    );
  }
  lines.push("");

  // Inventories (final state)
  lines.push("-- Inventories (final state)");
  for (const [key, qty] of data.inventory) {
    if (qty <= 0) continue;
    const [variantId, locationId] = key.split(":");
    const variant = data.allVariants.find((v) => v.id === variantId);
    const item = variant ? data.allItems.find((i) => i.id === variant.itemId) : null;
    const safetyStock = item?.safetyStock ?? 0;
    lines.push(
      `INSERT INTO inventories (id, item_variant_id, location_id, quantity, safety_stock, updated_at) VALUES (${escSQL(genId("inv"))}, ${escSQL(variantId)}, ${escSQL(locationId)}, ${qty}, ${safetyStock}, ${escSQL(now)});`
    );
  }
  lines.push("");

  // Transactions
  lines.push("-- Transactions");
  for (const tx of data.transactions) {
    lines.push(
      `INSERT INTO inventory_transactions (id, from_location_id, to_location_id, type, note, created_at) VALUES (${escSQL(tx.id)}, ${escSQL(tx.fromLocationId)}, ${escSQL(tx.toLocationId)}, ${escSQL(tx.type)}, ${escSQL(tx.note)}, ${escSQL(tx.createdAt)});`
    );
    for (const item of tx.items) {
      lines.push(
        `INSERT INTO inventory_transaction_items (id, transaction_id, item_variant_id, quantity) VALUES (${escSQL(genId("txi"))}, ${escSQL(tx.id)}, ${escSQL(item.itemVariantId)}, ${item.quantity});`
      );
    }
  }
  lines.push("");

  // Snapshots
  lines.push("-- Snapshots");
  for (const snap of data.snapshots) {
    lines.push(
      `INSERT INTO inventory_snapshots (id, location_id, note, created_at) VALUES (${escSQL(snap.id)}, ${escSQL(snap.locationId)}, ${escSQL(snap.note)}, ${escSQL(snap.createdAt)});`
    );
    for (const item of snap.items) {
      lines.push(
        `INSERT INTO inventory_snapshot_items (id, snapshot_id, item_variant_id, quantity, expected_quantity) VALUES (${escSQL(genId("snpi"))}, ${escSQL(snap.id)}, ${escSQL(item.itemVariantId)}, ${item.quantity}, ${item.expectedQuantity});`
      );
    }
  }

  return lines.join("\n");
}

// ============================================
// 実行
// ============================================

console.log("Generating seed data...");
const data = generate();
console.log(`  Items: ${data.allItems.length}`);
console.log(`  Variants: ${data.allVariants.length}`);
console.log(`  Transactions: ${data.transactions.length}`);
console.log(`  Transaction items: ${data.transactions.reduce((sum, tx) => sum + tx.items.length, 0)}`);
console.log(`  Snapshots: ${data.snapshots.length}`);
console.log(`  Inventory entries: ${[...data.inventory.values()].filter((v) => v > 0).length}`);

const sql = toSQL(data);
const outputPath = new URL("../seeds/seed.sql", import.meta.url).pathname;
writeFileSync(outputPath, sql, "utf-8");
console.log(`\nSQL written to: ${outputPath}`);
console.log(`  File size: ${(Buffer.byteLength(sql) / 1024 / 1024).toFixed(2)} MB`);
