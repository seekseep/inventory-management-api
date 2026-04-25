import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { items } from "../db/schema";
import type { Env } from "../index";

export const itemsRoute = new Hono<Env>();

itemsRoute.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const results = await db.select().from(items);
  return c.json(results);
});

itemsRoute.get("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db
    .select()
    .from(items)
    .where(eq(items.id, c.req.param("id")));
  if (result.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json(result[0]);
});

itemsRoute.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(items).values({
    id,
    name: body.name,
    description: body.description ?? null,
    type: body.type,
    status: body.status,
    season: body.season ?? null,
    price: body.price,
    itemCategoryId: body.itemCategoryId,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ id }, 201);
});

itemsRoute.put("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();

  await db
    .update(items)
    .set({
      name: body.name,
      description: body.description,
      type: body.type,
      status: body.status,
      season: body.season,
      price: body.price,
      itemCategoryId: body.itemCategoryId,
      updatedAt: now,
    })
    .where(eq(items.id, c.req.param("id")));

  return c.json({ success: true });
});

itemsRoute.delete("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  await db.delete(items).where(eq(items.id, c.req.param("id")));
  return c.json({ success: true });
});
