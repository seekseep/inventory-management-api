# API 設計ドキュメント

## 概要

本 API は RESTful な設計に従い、6 つのリソースを管理する。
すべてのエンドポイントは `/api` プレフィックスの下に配置され、API キー認証が必要である。

対話的な API ドキュメントは Swagger UI (`/docs`) でも確認できる。

## 認証

すべての `/api/*` エンドポイントは `X-API-Key` ヘッダーによる認証が必要。

```http
GET /api/items HTTP/1.1
X-API-Key: your-api-key-here
```

| ステータス | 説明 |
|---|---|
| `401 Unauthorized` | API キーが未指定、または無効 |

## エンドポイント一覧

### 商品カテゴリ (`/api/item-categories`)

階層構造を持つ商品カテゴリの管理。`parentId` を指定することで親子関係を構築できる。

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/item-categories` | 一覧取得 |
| `GET` | `/api/item-categories/:id` | 詳細取得 |
| `POST` | `/api/item-categories` | 作成 |
| `PUT` | `/api/item-categories/:id` | 更新 |
| `DELETE` | `/api/item-categories/:id` | 削除 |

#### リクエストボディ（POST / PUT）

```json
{
  "name": "トップス",
  "parentId": null,
  "description": "上半身に着用するアイテム"
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `name` | string | Yes | カテゴリ名 |
| `parentId` | string \| null | No | 親カテゴリ ID |
| `description` | string \| null | No | 説明 |

---

### 商品 SKU (`/api/items`)

SKU 単位での商品マスタ管理。タイプ・ステータスによるライフサイクル管理を行う。

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/items` | 一覧取得 |
| `GET` | `/api/items/:id` | 詳細取得 |
| `POST` | `/api/items` | 作成 |
| `PUT` | `/api/items/:id` | 更新 |
| `DELETE` | `/api/items/:id` | 削除 |

#### リクエストボディ（POST / PUT）

```json
{
  "name": "スリムデニム ブラック M",
  "sku": "SLIM-DENIM-BLK-M",
  "type": "staple",
  "status": "active",
  "price": 12800,
  "itemCategoryId": "category-uuid",
  "color": "ブラック",
  "size": "M",
  "season": null,
  "description": "定番のスリムフィットデニム"
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `name` | string | Yes | 商品名 |
| `sku` | string | Yes | SKU コード（ユニーク） |
| `type` | enum | Yes | `staple` / `seasonal` / `limited` |
| `status` | enum | Yes | `draft` / `active` / `on_sale` / `discontinued` |
| `price` | integer | Yes | 販売価格 |
| `itemCategoryId` | string | Yes | カテゴリ ID |
| `color` | string | No | カラー |
| `size` | string | No | サイズ（S / M / L / XL / FREE 等） |
| `season` | string | No | シーズン（SS2024, AW2024 等） |
| `description` | string | No | 説明 |

---

### 拠点 (`/api/locations`)

在庫を保管する物理的な拠点（店舗・倉庫）の管理。

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/locations` | 一覧取得 |
| `GET` | `/api/locations/:id` | 詳細取得 |
| `POST` | `/api/locations` | 作成 |
| `PUT` | `/api/locations/:id` | 更新 |
| `DELETE` | `/api/locations/:id` | 削除 |

#### リクエストボディ（POST / PUT）

```json
{
  "name": "渋谷店",
  "type": "store",
  "address": "東京都渋谷区..."
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `name` | string | Yes | 拠点名 |
| `type` | enum | Yes | `store` / `warehouse` |
| `address` | string | No | 住所 |

---

### 在庫 (`/api/inventories`)

商品×拠点の組み合わせごとの在庫数量。在庫レコードはトランザクション経由で自動生成される。

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/inventories` | 一覧取得（フィルタ可） |
| `GET` | `/api/inventories/:id` | 詳細取得 |
| `PUT` | `/api/inventories/:id` | 数量・安全在庫の更新 |

#### クエリパラメータ（GET 一覧）

| パラメータ | 型 | 説明 |
|---|---|---|
| `locationId` | string | 拠点 ID でフィルタ |
| `itemId` | string | 商品 ID でフィルタ |

両方を指定した場合は AND 条件で絞り込む。

#### リクエストボディ（PUT）

```json
{
  "quantity": 50,
  "safetyStock": 10
}
```

---

### 在庫トランザクション (`/api/transactions`)

在庫の変動（仕入れ・移動・販売・廃棄）を記録する。
トランザクション作成時に、関連する在庫レコードが自動的に更新される。

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/transactions` | 一覧取得 |
| `GET` | `/api/transactions/:id` | 詳細取得（明細付き） |
| `POST` | `/api/transactions` | 作成（在庫自動更新） |

#### リクエストボディ（POST）

```json
{
  "type": "transfer",
  "fromLocationId": "warehouse-uuid",
  "toLocationId": "store-uuid",
  "note": "渋谷店への定期補充",
  "items": [
    { "itemId": "item-uuid-1", "quantity": 10 },
    { "itemId": "item-uuid-2", "quantity": 5 }
  ]
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `type` | enum | Yes | `purchase` / `transfer` / `sale` / `disposal` |
| `fromLocationId` | string \| null | No | 出元拠点 ID |
| `toLocationId` | string \| null | No | 先拠点 ID |
| `note` | string | No | 備考 |
| `items` | array | Yes | 明細アイテム |
| `items[].itemId` | string | Yes | 商品 ID |
| `items[].quantity` | integer | Yes | 数量 |

#### トランザクションタイプと拠点の関係

| タイプ | fromLocationId | toLocationId | 在庫への影響 |
|---|---|---|---|
| `purchase` | null | 入庫先 | 入庫先の在庫を加算 |
| `transfer` | 出元 | 移動先 | 出元を減算、移動先を加算 |
| `sale` | 販売拠点 | null | 販売拠点の在庫を減算 |
| `disposal` | 廃棄拠点 | null | 廃棄拠点の在庫を減算 |

---

### 棚卸しスナップショット (`/api/snapshots`)

物理的な棚卸しの結果を記録する。理論値（システム上の在庫数）と実数の差異を記録し、在庫精度の分析に利用する。

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/snapshots` | 一覧取得 |
| `GET` | `/api/snapshots/:id` | 詳細取得（明細付き） |
| `POST` | `/api/snapshots` | 作成 |

#### リクエストボディ（POST）

```json
{
  "locationId": "store-uuid",
  "note": "2024年3月度 月次棚卸し",
  "items": [
    {
      "itemId": "item-uuid-1",
      "quantity": 48,
      "expectedQuantity": 50
    }
  ]
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `locationId` | string | Yes | 棚卸し実施拠点 |
| `note` | string | No | 備考 |
| `items` | array | Yes | 棚卸し明細 |
| `items[].itemId` | string | Yes | 商品 ID |
| `items[].quantity` | integer | Yes | 実数（実際に数えた数量） |
| `items[].expectedQuantity` | integer | Yes | 理論値（システム上の数量） |

## エラーレスポンス

| ステータス | 説明 |
|---|---|
| `401 Unauthorized` | API キーが無効または未指定 |
| `404 Not Found` | 指定された ID のリソースが存在しない |

```json
{
  "error": "Not found"
}
```
