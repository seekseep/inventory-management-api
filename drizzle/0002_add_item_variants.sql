-- items テーブルから sku, color, size を分離し、item_variants テーブルを新設
-- 在庫管理の参照先を items → item_variants に変更

-- 1. item_variants テーブルを作成
CREATE TABLE `item_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`sku` text NOT NULL,
	`color` text,
	`size` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `item_variants_sku_unique` ON `item_variants` (`sku`);
--> statement-breakpoint

-- 2. 既存の items データから item_variants にデータを移行
INSERT INTO `item_variants` (`id`, `item_id`, `sku`, `color`, `size`, `created_at`, `updated_at`)
SELECT 'iv-' || `id`, `id`, `sku`, `color`, `size`, `created_at`, `updated_at` FROM `items`;
--> statement-breakpoint

-- 3. inventories テーブルを再作成（item_id → item_variant_id）
CREATE TABLE `inventories_new` (
	`id` text PRIMARY KEY NOT NULL,
	`item_variant_id` text NOT NULL,
	`location_id` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`safety_stock` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`item_variant_id`) REFERENCES `item_variants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `inventories_new` (`id`, `item_variant_id`, `location_id`, `quantity`, `safety_stock`, `updated_at`)
SELECT `id`, 'iv-' || `item_id`, `location_id`, `quantity`, `safety_stock`, `updated_at` FROM `inventories`;
--> statement-breakpoint
DROP TABLE `inventories`;
--> statement-breakpoint
ALTER TABLE `inventories_new` RENAME TO `inventories`;
--> statement-breakpoint

-- 4. inventory_transaction_items テーブルを再作成（item_id → item_variant_id）
CREATE TABLE `inventory_transaction_items_new` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`item_variant_id` text NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `inventory_transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_variant_id`) REFERENCES `item_variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `inventory_transaction_items_new` (`id`, `transaction_id`, `item_variant_id`, `quantity`)
SELECT `id`, `transaction_id`, 'iv-' || `item_id`, `quantity` FROM `inventory_transaction_items`;
--> statement-breakpoint
DROP TABLE `inventory_transaction_items`;
--> statement-breakpoint
ALTER TABLE `inventory_transaction_items_new` RENAME TO `inventory_transaction_items`;
--> statement-breakpoint

-- 5. inventory_snapshot_items テーブルを再作成（item_id → item_variant_id）
CREATE TABLE `inventory_snapshot_items_new` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_id` text NOT NULL,
	`item_variant_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`expected_quantity` integer NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `inventory_snapshots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_variant_id`) REFERENCES `item_variants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `inventory_snapshot_items_new` (`id`, `snapshot_id`, `item_variant_id`, `quantity`, `expected_quantity`)
SELECT `id`, `snapshot_id`, 'iv-' || `item_id`, `quantity`, `expected_quantity` FROM `inventory_snapshot_items`;
--> statement-breakpoint
DROP TABLE `inventory_snapshot_items`;
--> statement-breakpoint
ALTER TABLE `inventory_snapshot_items_new` RENAME TO `inventory_snapshot_items`;
--> statement-breakpoint

-- 6. 古い unique index を削除（DROP COLUMN の前に実行する必要がある）
DROP INDEX IF EXISTS `items_sku_unique`;
--> statement-breakpoint

-- 7. items テーブルから sku, color, size カラムを削除（SQLite は DROP COLUMN 対応）
ALTER TABLE `items` DROP COLUMN `sku`;
--> statement-breakpoint
ALTER TABLE `items` DROP COLUMN `color`;
--> statement-breakpoint
ALTER TABLE `items` DROP COLUMN `size`;
