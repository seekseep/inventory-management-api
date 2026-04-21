import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { locations } from "../db/schema";
import type { Env } from "../index";

export const locationsRoute = new Hono<Env>();

locationsRoute.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const results = await db.select().from(locations);
  return c.json(results);
});

locationsRoute.get("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db
    .select()
    .from(locations)
    .where(eq(locations.id, c.req.param("id")));
  if (result.length === 0) return c.json({ error: "Not found" }, 404);
  return c.json(result[0]);
});

locationsRoute.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(locations).values({
    id,
    name: body.name,
    type: body.type,
    address: body.address ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ id }, 201);
});

locationsRoute.put("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const now = new Date().toISOString();

  await db
    .update(locations)
    .set({
      name: body.name,
      type: body.type,
      address: body.address,
      updatedAt: now,
    })
    .where(eq(locations.id, c.req.param("id")));

  return c.json({ success: true });
});

locationsRoute.delete("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  await db.delete(locations).where(eq(locations.id, c.req.param("id")));
  return c.json({ success: true });
});
