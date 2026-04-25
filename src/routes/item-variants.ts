import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { itemVariants } from "../db/schema";
import type { Env } from "../index";

export const itemVariantsRoute = new Hono<Env>();

itemVariantsRoute.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const itemId = c.req.query("itemId");

  if (itemId) {
    const results = await db
      .select()
      .from(itemVariants)
      .where(eq(itemVariants.itemId, itemId));
    return c.json(results);
  }

  const results = await db.select().from(itemVariants);
  return c.json(results);
});

itemVariantsRoute.get("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db
    .select()
    .from(itemVariants)
    .where(eq(itemVariants.id, c.req.param("id")));
  if (result.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json(result[0]);
});

itemVariantsRoute.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(itemVariants).values({
    id,
    itemId: body.itemId,
    sku: body.sku,
    color: body.color ?? null,
    size: body.size ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ id }, 201);
});

itemVariantsRoute.put("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();

  await db
    .update(itemVariants)
    .set({
      itemId: body.itemId,
      sku: body.sku,
      color: body.color,
      size: body.size,
      updatedAt: now,
    })
    .where(eq(itemVariants.id, c.req.param("id")));

  return c.json({ success: true });
});

itemVariantsRoute.delete("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  await db.delete(itemVariants).where(eq(itemVariants.id, c.req.param("id")));
  return c.json({ success: true });
});
