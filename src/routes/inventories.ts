import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { inventories } from "../db/schema";
import type { Env } from "../index";

export const inventoriesRoute = new Hono<Env>();

inventoriesRoute.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const locationId = c.req.query("locationId");
  const itemId = c.req.query("itemId");

  let query = db.select().from(inventories);

  if (locationId && itemId) {
    query = query.where(
      and(
        eq(inventories.locationId, locationId),
        eq(inventories.itemId, itemId)
      )
    ) as typeof query;
  } else if (locationId) {
    query = query.where(eq(inventories.locationId, locationId)) as typeof query;
  } else if (itemId) {
    query = query.where(eq(inventories.itemId, itemId)) as typeof query;
  }

  const results = await query;
  return c.json(results);
});

inventoriesRoute.get("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db
    .select()
    .from(inventories)
    .where(eq(inventories.id, c.req.param("id")));
  if (result.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json(result[0]);
});

inventoriesRoute.put("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();

  await db
    .update(inventories)
    .set({
      quantity: body.quantity,
      safetyStock: body.safetyStock,
      updatedAt: now,
    })
    .where(eq(inventories.id, c.req.param("id")));

  return c.json({ success: true });
});
