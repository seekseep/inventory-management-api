export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "OUTLINE 在庫管理API",
    description: "メンズアパレルセレクトショップ「OUTLINE」の在庫管理API",
    version: "2.0.0",
  },
  servers: [
    { url: "https://inventory-management-api.seekseep.workers.dev", description: "Production" },
    { url: "http://localhost:8787", description: "Local" },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey" as const,
        in: "header" as const,
        name: "X-API-Key",
      },
    },
    schemas: {
      ItemCategory: {
        type: "object",
        properties: {
          id: { type: "string" },
          parentId: { type: "string", nullable: true },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Item: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          type: { type: "string", enum: ["staple", "seasonal", "limited"] },
          status: { type: "string", enum: ["draft", "active", "on_sale", "discontinued"] },
          season: { type: "string", nullable: true },
          price: { type: "integer" },
          itemCategoryId: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ItemVariant: {
        type: "object",
        properties: {
          id: { type: "string" },
          itemId: { type: "string" },
          sku: { type: "string" },
          color: { type: "string", nullable: true },
          size: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Location: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: { type: "string", enum: ["store", "warehouse"] },
          address: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Inventory: {
        type: "object",
        properties: {
          id: { type: "string" },
          itemVariantId: { type: "string" },
          locationId: { type: "string" },
          quantity: { type: "integer" },
          safetyStock: { type: "integer" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          fromLocationId: { type: "string", nullable: true },
          toLocationId: { type: "string", nullable: true },
          type: { type: "string", enum: ["purchase", "transfer", "sale", "disposal"] },
          note: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          items: { type: "array", items: { $ref: "#/components/schemas/TransactionItem" } },
        },
      },
      TransactionItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          transactionId: { type: "string" },
          itemVariantId: { type: "string" },
          quantity: { type: "integer" },
        },
      },
      Snapshot: {
        type: "object",
        properties: {
          id: { type: "string" },
          locationId: { type: "string" },
          note: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      SnapshotItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          snapshotId: { type: "string" },
          itemVariantId: { type: "string" },
          quantity: { type: "integer", description: "実数" },
          expectedQuantity: { type: "integer", description: "理論値" },
        },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/api/item-categories": {
      get: {
        tags: ["カテゴリ"],
        summary: "カテゴリ一覧",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/ItemCategory" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["カテゴリ"],
        summary: "カテゴリ作成",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  parentId: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { type: "object", properties: { id: { type: "string" } } },
              },
            },
          },
        },
      },
    },
    "/api/item-categories/{id}": {
      get: {
        tags: ["カテゴリ"],
        summary: "カテゴリ取得",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ItemCategory" } },
            },
          },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["カテゴリ"],
        summary: "カテゴリ更新",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  parentId: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
      delete: {
        tags: ["カテゴリ"],
        summary: "カテゴリ削除",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/items": {
      get: {
        tags: ["商品"],
        summary: "商品一覧",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Item" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["商品"],
        summary: "商品作成",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "type", "status", "price", "itemCategoryId"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string", enum: ["staple", "seasonal", "limited"] },
                  status: { type: "string", enum: ["draft", "active", "on_sale", "discontinued"] },
                  season: { type: "string" },
                  price: { type: "integer" },
                  itemCategoryId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { type: "object", properties: { id: { type: "string" } } },
              },
            },
          },
        },
      },
    },
    "/api/items/{id}": {
      get: {
        tags: ["商品"],
        summary: "商品取得",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Item" } } },
          },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["商品"],
        summary: "商品更新",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  status: { type: "string" },
                  season: { type: "string" },
                  price: { type: "integer" },
                  itemCategoryId: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
      delete: {
        tags: ["商品"],
        summary: "商品削除",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/item-variants": {
      get: {
        tags: ["商品バリアント"],
        summary: "バリアント一覧",
        parameters: [
          {
            name: "itemId",
            in: "query",
            schema: { type: "string" },
            description: "商品IDで絞り込み",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/ItemVariant" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["商品バリアント"],
        summary: "バリアント作成",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["itemId", "sku"],
                properties: {
                  itemId: { type: "string" },
                  sku: { type: "string" },
                  color: { type: "string" },
                  size: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { type: "object", properties: { id: { type: "string" } } },
              },
            },
          },
        },
      },
    },
    "/api/item-variants/{id}": {
      get: {
        tags: ["商品バリアント"],
        summary: "バリアント取得",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ItemVariant" } },
            },
          },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["商品バリアント"],
        summary: "バリアント更新",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  itemId: { type: "string" },
                  sku: { type: "string" },
                  color: { type: "string" },
                  size: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
      delete: {
        tags: ["商品バリアント"],
        summary: "バリアント削除",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/locations": {
      get: {
        tags: ["拠点"],
        summary: "拠点一覧",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Location" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["拠点"],
        summary: "拠点作成",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "type"],
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: ["store", "warehouse"] },
                  address: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/locations/{id}": {
      get: {
        tags: ["拠点"],
        summary: "拠点取得",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Location" } } },
          },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["拠点"],
        summary: "拠点更新",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  address: { type: "string" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
      delete: {
        tags: ["拠点"],
        summary: "拠点削除",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/inventories": {
      get: {
        tags: ["在庫"],
        summary: "在庫一覧",
        parameters: [
          {
            name: "locationId",
            in: "query",
            schema: { type: "string" },
            description: "拠点IDで絞り込み",
          },
          {
            name: "itemVariantId",
            in: "query",
            schema: { type: "string" },
            description: "バリアントIDで絞り込み",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Inventory" } },
              },
            },
          },
        },
      },
    },
    "/api/inventories/{id}": {
      get: {
        tags: ["在庫"],
        summary: "在庫取得",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Inventory" } } },
          },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["在庫"],
        summary: "在庫更新",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { quantity: { type: "integer" }, safetyStock: { type: "integer" } },
              },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/transactions": {
      get: {
        tags: ["取引"],
        summary: "取引一覧",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Transaction" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["取引"],
        summary: "取引作成",
        description:
          "仕入れ(purchase): toLocationIdのみ指定\n移動(transfer): from/to両方指定\n販売(sale): fromLocationIdのみ指定\n廃棄(disposal): fromLocationIdのみ指定",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "items"],
                properties: {
                  fromLocationId: { type: "string", description: "出元拠点ID" },
                  toLocationId: { type: "string", description: "先拠点ID" },
                  type: { type: "string", enum: ["purchase", "transfer", "sale", "disposal"] },
                  note: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["itemVariantId", "quantity"],
                      properties: {
                        itemVariantId: { type: "string" },
                        quantity: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { type: "object", properties: { id: { type: "string" } } },
              },
            },
          },
        },
      },
    },
    "/api/transactions/{id}": {
      get: {
        tags: ["取引"],
        summary: "取引取得（明細付き）",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Transaction" } },
            },
          },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/snapshots": {
      get: {
        tags: ["棚卸し"],
        summary: "棚卸し一覧",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Snapshot" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["棚卸し"],
        summary: "棚卸し作成",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["locationId", "items"],
                properties: {
                  locationId: { type: "string" },
                  note: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["itemVariantId", "quantity", "expectedQuantity"],
                      properties: {
                        itemVariantId: { type: "string" },
                        quantity: { type: "integer", description: "実数" },
                        expectedQuantity: { type: "integer", description: "理論値" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/snapshots/{id}": {
      get: {
        tags: ["棚卸し"],
        summary: "棚卸し取得（明細付き）",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
    },
  },
};
