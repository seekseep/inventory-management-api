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
// SKU 生成
// ============================================

type SKU = {
  id: string;
  name: string;
  sku: string;
  color: string;
  size: string;
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

function generateSKUs(styles: StyleDef[]): SKU[] {
  const skus: SKU[] = [];
  for (const style of styles) {
    for (const color of style.colors) {
      for (const size of style.sizes) {
        const skuCode = `${style.name.slice(0, 8)}-${color.slice(0, 3)}-${size}`.replace(/\s/g, "");
        skus.push({
          id: genId("item"),
          name: style.name,
          sku: skuCode + "-" + String(idCounter),
          color,
          size,
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
      }
    }
  }
  return skus;
}

// ============================================
// トランザクション生成
// ============================================

type Transaction = {
  id: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  type: "purchase" | "transfer" | "sale" | "disposal";
  note: string | null;
  createdAt: string;
  items: { itemId: string; quantity: number }[];
};

type Inventory = Map<string, number>; // key: `${itemId}:${locationId}` → quantity

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

function getActiveSKUs(date: Date, allSKUs: SKU[]): SKU[] {
  return allSKUs.filter((sku) => {
    const active = new Date(sku.activeFrom);
    const disc = sku.discontinuedFrom ? new Date(sku.discontinuedFrom) : null;
    return date >= active && (!disc || date <= disc);
  });
}

function getSKUStatus(sku: SKU, date: Date): SKU["status"] {
  if (sku.discontinuedFrom && date >= new Date(sku.discontinuedFrom)) return "discontinued";
  if (sku.onSaleFrom && date >= new Date(sku.onSaleFrom)) return "on_sale";
  if (date >= new Date(sku.activeFrom)) return "active";
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
  const allSKUs = [
    ...generateSKUs(stapleStyles),
    ...generateSKUs(seasonalStyles),
    ...generateSKUs(limitedStyles),
  ];

  const transactions: Transaction[] = [];
  const inventory: Inventory = new Map();
  const snapshots: { id: string; locationId: string; note: string; createdAt: string; items: { itemId: string; quantity: number; expectedQuantity: number }[] }[] = [];

  function getInv(itemId: string, locationId: string): number {
    return inventory.get(`${itemId}:${locationId}`) ?? 0;
  }

  function setInv(itemId: string, locationId: string, qty: number) {
    inventory.set(`${itemId}:${locationId}`, Math.max(0, qty));
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
            const snapshotItems: { itemId: string; quantity: number; expectedQuantity: number }[] = [];
            for (const sku of getActiveSKUs(current, allSKUs)) {
              const qty = getInv(sku.id, loc.id);
              if (qty > 0 || sku.safetyStock > 0) {
                // Small random variance for realism
                const variance = Math.random() < 0.05 ? randomInt(-2, -1) : 0;
                snapshotItems.push({
                  itemId: sku.id,
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

      const activeSKUs = getActiveSKUs(current, allSKUs);
      const activeStores = getActiveStores(current);
      const activeWarehouses = getActiveWarehouses(current);

      if (activeSKUs.length === 0 || activeStores.length === 0) {
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
        const skusToOrder = activeSKUs
          .filter((s) => getSKUStatus(s, current) === "active")
          .filter(() => Math.random() < 0.3)
          .slice(0, randomInt(10, 40));

        if (skusToOrder.length > 0) {
          const txItems = skusToOrder.map((sku) => {
            const qty = randomInt(...phase.purchaseQtyPerSKU);
            setInv(sku.id, warehouse.id, getInv(sku.id, warehouse.id) + qty);
            return { itemId: sku.id, quantity: qty };
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
        const skusToTransfer = activeSKUs
          .filter((s) => getInv(s.id, warehouse.id) > 0)
          .filter(() => Math.random() < 0.3)
          .slice(0, randomInt(5, 20));

        if (skusToTransfer.length > 0) {
          const txItems = skusToTransfer.map((sku) => {
            const available = getInv(sku.id, warehouse.id);
            const qty = Math.min(available, randomInt(...phase.transferQtyPerSKU));
            setInv(sku.id, warehouse.id, getInv(sku.id, warehouse.id) - qty);
            setInv(sku.id, store.id, getInv(sku.id, store.id) + qty);
            return { itemId: sku.id, quantity: qty };
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
      const saleableInStores = activeSKUs.filter((sku) =>
        activeStores.some((store) => getInv(sku.id, store.id) > 0)
      );

      if (saleableInStores.length > 0) {
        // Group sales by store
        for (const store of activeStores) {
          const storeShare = Math.ceil(salesToday / activeStores.length);
          const storeSKUs = saleableInStores.filter(
            (sku) => getInv(sku.id, store.id) > 0
          );
          if (storeSKUs.length === 0) continue;

          const txItems: { itemId: string; quantity: number }[] = [];
          for (let i = 0; i < storeShare && storeSKUs.length > 0; i++) {
            const sku = randomPick(storeSKUs);
            const available = getInv(sku.id, store.id);
            if (available <= 0) continue;
            const qty = 1;
            setInv(sku.id, store.id, available - qty);
            txItems.push({ itemId: sku.id, quantity: qty });
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
        const disposalCandidates = allSKUs.filter(
          (sku) =>
            getSKUStatus(sku, current) === "on_sale" ||
            getSKUStatus(sku, current) === "discontinued"
        ).filter((sku) => getInv(sku.id, warehouse.id) > 0);

        if (disposalCandidates.length > 0) {
          const toDispose = disposalCandidates.slice(0, randomInt(3, 10));
          const txItems = toDispose.map((sku) => {
            const qty = Math.min(getInv(sku.id, warehouse.id), randomInt(1, 3));
            setInv(sku.id, warehouse.id, getInv(sku.id, warehouse.id) - qty);
            return { itemId: sku.id, quantity: qty };
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

  // Update SKU statuses to final state
  const finalDate = new Date("2025-03-31");
  for (const sku of allSKUs) {
    sku.status = getSKUStatus(sku, finalDate);
  }

  return { allSKUs, transactions, inventory, snapshots };
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

  // Items (SKUs)
  lines.push("-- Items");
  for (const sku of data.allSKUs) {
    lines.push(
      `INSERT INTO items (id, name, sku, description, color, size, type, status, season, price, item_category_id, created_at, updated_at) VALUES (${escSQL(sku.id)}, ${escSQL(sku.name)}, ${escSQL(sku.sku)}, NULL, ${escSQL(sku.color)}, ${escSQL(sku.size)}, ${escSQL(sku.type)}, ${escSQL(sku.status)}, ${escSQL(sku.season)}, ${sku.price}, ${escSQL(sku.categoryId)}, ${escSQL(sku.activeFrom + "T00:00:00Z")}, ${escSQL(now)});`
    );
  }
  lines.push("");

  // Inventories (final state)
  lines.push("-- Inventories (final state)");
  for (const [key, qty] of data.inventory) {
    if (qty <= 0) continue;
    const [itemId, locationId] = key.split(":");
    const sku = data.allSKUs.find((s) => s.id === itemId);
    const safetyStock = sku?.safetyStock ?? 0;
    lines.push(
      `INSERT INTO inventories (id, item_id, location_id, quantity, safety_stock, updated_at) VALUES (${escSQL(genId("inv"))}, ${escSQL(itemId)}, ${escSQL(locationId)}, ${qty}, ${safetyStock}, ${escSQL(now)});`
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
        `INSERT INTO inventory_transaction_items (id, transaction_id, item_id, quantity) VALUES (${escSQL(genId("txi"))}, ${escSQL(tx.id)}, ${escSQL(item.itemId)}, ${item.quantity});`
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
        `INSERT INTO inventory_snapshot_items (id, snapshot_id, item_id, quantity, expected_quantity) VALUES (${escSQL(genId("snpi"))}, ${escSQL(snap.id)}, ${escSQL(item.itemId)}, ${item.quantity}, ${item.expectedQuantity});`
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
console.log(`  SKUs: ${data.allSKUs.length}`);
console.log(`  Transactions: ${data.transactions.length}`);
console.log(`  Transaction items: ${data.transactions.reduce((sum, tx) => sum + tx.items.length, 0)}`);
console.log(`  Snapshots: ${data.snapshots.length}`);
console.log(`  Inventory entries: ${[...data.inventory.values()].filter((v) => v > 0).length}`);

const sql = toSQL(data);
const outputPath = new URL("../seeds/seed.sql", import.meta.url).pathname;
writeFileSync(outputPath, sql, "utf-8");
console.log(`\nSQL written to: ${outputPath}`);
console.log(`  File size: ${(Buffer.byteLength(sql) / 1024 / 1024).toFixed(2)} MB`);
