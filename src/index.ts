import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { authMiddleware } from "./middleware/auth";
import { itemCategoriesRoute } from "./routes/item-categories";
import { itemsRoute } from "./routes/items";
import { locationsRoute } from "./routes/locations";
import { inventoriesRoute } from "./routes/inventories";
import { transactionsRoute } from "./routes/transactions";
import { snapshotsRoute } from "./routes/snapshots";
import { openApiSpec } from "./openapi";

export type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const app = new Hono<Env>();

// Swagger UI（認証不要）
app.get("/docs", swaggerUI({ url: "/openapi.json" }));
app.get("/openapi.json", (c) => c.json(openApiSpec));

app.use("/api/*", authMiddleware);

app.route("/api/item-categories", itemCategoriesRoute);
app.route("/api/items", itemsRoute);
app.route("/api/locations", locationsRoute);
app.route("/api/inventories", inventoriesRoute);
app.route("/api/transactions", transactionsRoute);
app.route("/api/snapshots", snapshotsRoute);

app.get("/", (c) => c.json({ message: "Inventory Management API" }));

export default app;
