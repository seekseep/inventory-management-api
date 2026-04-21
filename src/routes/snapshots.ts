import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { inventorySnapshots, inventorySnapshotItems } from "../db/schema";
import type { Env } from "../index";

export const snapshotsRoute = new Hono<Env>();

snapshotsRoute.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const results = await db.select().from(inventorySnapshots);
  return c.json(results);
});

snapshotsRoute.get("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");

  const snapshot = await db
    .select()
    .from(inventorySnapshots)
    .where(eq(inventorySnapshots.id, id));

  if (snapshot.length === 0) return c.json({ error: "Not found" }, 404);

  const items = await db
    .select()
    .from(inventorySnapshotItems)
    .where(eq(inventorySnapshotItems.snapshotId, id));

  return c.json({ ...snapshot[0], items });
});

snapshotsRoute.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(inventorySnapshots).values({
    id,
    locationId: body.locationId,
    note: body.note ?? null,
    createdAt: now,
  });

  for (const item of body.items) {
    await db.insert(inventorySnapshotItems).values({
      id: crypto.randomUUID(),
      snapshotId: id,
      itemId: item.itemId,
      quantity: item.quantity,
      expectedQuantity: item.expectedQuantity,
    });
  }

  return c.json({ id }, 201);
});
