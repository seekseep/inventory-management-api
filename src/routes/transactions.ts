import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { inventoryTransactions, inventoryTransactionItems, inventories } from "../db/schema";
import type { Env } from "../index";

export const transactionsRoute = new Hono<Env>();

transactionsRoute.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const transactions = await db.select().from(inventoryTransactions);
  const allItems = await db.select().from(inventoryTransactionItems);

  const itemsByTxId = new Map<string, (typeof allItems)[number][]>();
  for (const item of allItems) {
    const list = itemsByTxId.get(item.transactionId);
    if (list) {
      list.push(item);
    } else {
      itemsByTxId.set(item.transactionId, [item]);
    }
  }

  const results = transactions.map((tx) => ({
    ...tx,
    items: itemsByTxId.get(tx.id) ?? [],
  }));

  return c.json(results);
});

transactionsRoute.get("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");

  const transaction = await db
    .select()
    .from(inventoryTransactions)
    .where(eq(inventoryTransactions.id, id));

  if (transaction.length === 0) return c.json({ error: "Not found" }, 404);

  const items = await db
    .select()
    .from(inventoryTransactionItems)
    .where(eq(inventoryTransactionItems.transactionId, id));

  return c.json({ ...transaction[0], items });
});

transactionsRoute.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(inventoryTransactions).values({
    id,
    fromLocationId: body.fromLocationId ?? null,
    toLocationId: body.toLocationId ?? null,
    type: body.type,
    note: body.note ?? null,
    createdAt: now,
  });

  for (const item of body.items) {
    await db.insert(inventoryTransactionItems).values({
      id: crypto.randomUUID(),
      transactionId: id,
      itemVariantId: item.itemVariantId,
      quantity: item.quantity,
    });

    // Update inventory quantities
    if (body.fromLocationId) {
      // Decrement from source
      const existing = await db
        .select()
        .from(inventories)
        .where(eq(inventories.itemVariantId, item.itemVariantId));
      const fromInv = existing.find((inv) => inv.locationId === body.fromLocationId);
      if (fromInv) {
        await db
          .update(inventories)
          .set({ quantity: fromInv.quantity - item.quantity, updatedAt: now })
          .where(eq(inventories.id, fromInv.id));
      }
    }

    if (body.toLocationId) {
      // Increment at destination
      const existing = await db
        .select()
        .from(inventories)
        .where(eq(inventories.itemVariantId, item.itemVariantId));
      const toInv = existing.find((inv) => inv.locationId === body.toLocationId);
      if (toInv) {
        await db
          .update(inventories)
          .set({ quantity: toInv.quantity + item.quantity, updatedAt: now })
          .where(eq(inventories.id, toInv.id));
      } else {
        await db.insert(inventories).values({
          id: crypto.randomUUID(),
          itemVariantId: item.itemVariantId,
          locationId: body.toLocationId,
          quantity: item.quantity,
          safetyStock: 0,
          updatedAt: now,
        });
      }
    }
  }

  return c.json({ id }, 201);
});
