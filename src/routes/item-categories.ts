import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { itemCategories } from "../db/schema";
import type { Env } from "../index";

export const itemCategoriesRoute = new Hono<Env>();

itemCategoriesRoute.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const results = await db.select().from(itemCategories);
  return c.json(results);
});

itemCategoriesRoute.get("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db
    .select()
    .from(itemCategories)
    .where(eq(itemCategories.id, c.req.param("id")));
  if (result.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json(result[0]);
});

itemCategoriesRoute.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(itemCategories).values({
    id,
    parentId: body.parentId ?? null,
    name: body.name,
    description: body.description ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ id }, 201);
});

itemCategoriesRoute.put("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();

  await db
    .update(itemCategories)
    .set({
      parentId: body.parentId,
      name: body.name,
      description: body.description,
      updatedAt: now,
    })
    .where(eq(itemCategories.id, c.req.param("id")));

  return c.json({ success: true });
});

itemCategoriesRoute.delete("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  await db
    .delete(itemCategories)
    .where(eq(itemCategories.id, c.req.param("id")));
  return c.json({ success: true });
});
