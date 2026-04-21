import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth";
import { itemCategoriesRoute } from "./routes/item-categories";
import { itemsRoute } from "./routes/items";
import { locationsRoute } from "./routes/locations";
import { inventoriesRoute } from "./routes/inventories";
import { transactionsRoute } from "./routes/transactions";
import { snapshotsRoute } from "./routes/snapshots";

export type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const app = new Hono<Env>();

app.use("/api/*", authMiddleware);

app.route("/api/item-categories", itemCategoriesRoute);
app.route("/api/items", itemsRoute);
app.route("/api/locations", locationsRoute);
app.route("/api/inventories", inventoriesRoute);
app.route("/api/transactions", transactionsRoute);
app.route("/api/snapshots", snapshotsRoute);

app.get("/", (c) => c.json({ message: "Inventory Management API" }));

export default app;
