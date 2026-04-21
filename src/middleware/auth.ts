import { createMiddleware } from "hono/factory";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { apiKeys } from "../db/schema";
import type { Env } from "../index";

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB);
  const result = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.key, apiKey), eq(apiKeys.active, true)));

  if (result.length === 0) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
