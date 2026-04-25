import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

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
  description: text("description"),
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

export const itemVariants = sqliteTable("item_variants", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id),
  sku: text("sku").notNull().unique(),
  color: text("color"),
  size: text("size"),
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
  itemVariantId: text("item_variant_id")
    .notNull()
    .references(() => itemVariants.id),
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
    itemVariantId: text("item_variant_id")
      .notNull()
      .references(() => itemVariants.id),
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
  itemVariantId: text("item_variant_id")
    .notNull()
    .references(() => itemVariants.id),
  quantity: integer("quantity").notNull(),
  expectedQuantity: integer("expected_quantity").notNull(),
});
