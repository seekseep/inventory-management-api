import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const itemCategories = sqliteTable("item_categories", {
  id: text("id").primaryKey(),
  parentId: text("parent_id").references((): any => itemCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  color: text("color"),
  size: text("size"),
  type: text("type", { enum: ["staple", "seasonal", "limited"] }).notNull(),
  status: text("status", {
    enum: ["draft", "active", "on_sale", "discontinued"],
  }).notNull(),
  season: text("season"),
  price: integer("price").notNull(),
  itemCategoryId: text("item_category_id")
    .notNull()
    .references(() => itemCategories.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["store", "warehouse"] }).notNull(),
  address: text("address"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const inventories = sqliteTable("inventories", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  locationId: text("location_id")
    .notNull()
    .references(() => locations.id),
  quantity: integer("quantity").notNull().default(0),
  safetyStock: integer("safety_stock").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const inventoryTransactions = sqliteTable("inventory_transactions", {
  id: text("id").primaryKey(),
  fromLocationId: text("from_location_id").references(() => locations.id),
  toLocationId: text("to_location_id").references(() => locations.id),
  type: text("type", {
    enum: ["purchase", "transfer", "sale", "disposal"],
  }).notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const inventoryTransactionItems = sqliteTable(
  "inventory_transaction_items",
  {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => inventoryTransactions.id),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id),
    quantity: integer("quantity").notNull(),
  }
);

export const inventorySnapshots = sqliteTable("inventory_snapshots", {
  id: text("id").primaryKey(),
  locationId: text("location_id")
    .notNull()
    .references(() => locations.id),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const inventorySnapshotItems = sqliteTable("inventory_snapshot_items", {
  id: text("id").primaryKey(),
  snapshotId: text("snapshot_id")
    .notNull()
    .references(() => inventorySnapshots.id),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  quantity: integer("quantity").notNull(),
  expectedQuantity: integer("expected_quantity").notNull(),
});
