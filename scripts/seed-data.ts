// ============================================
// マスターデータ定義
// ============================================

export type LocationDef = {
  id: string;
  name: string;
  type: "store" | "warehouse";
  address: string;
  openDate: string; // YYYY-MM-DD
  closeDate?: string;
};

export type CategoryDef = {
  id: string;
  parentId: string | null;
  name: string;
  description: string;
};

export type StyleDef = {
  name: string;
  categoryId: string;
  type: "staple" | "seasonal" | "limited";
  season?: string;
  colors: string[];
  sizes: string[];
  price: number;
  activeFrom: string; // YYYY-MM-DD
  onSaleFrom?: string;
  discontinuedFrom?: string;
  safetyStock: number;
};

// --- 拠点 ---
export const locations: LocationDef[] = [
  {
    id: "loc-warehouse-main",
    name: "本店倉庫",
    type: "warehouse",
    address: "東京都目黒区中目黒1-1-1",
    openDate: "2020-04-01",
  },
  {
    id: "loc-store-shibuya",
    name: "渋谷店",
    type: "store",
    address: "東京都渋谷区神南1-2-3",
    openDate: "2020-04-01",
  },
  {
    id: "loc-store-shinjuku",
    name: "新宿店",
    type: "store",
    address: "東京都新宿区新宿3-4-5",
    openDate: "2021-04-01",
    closeDate: "2022-03-31",
  },
  {
    id: "loc-store-ec",
    name: "ECストア",
    type: "store",
    address: "オンライン",
    openDate: "2022-10-01",
  },
  {
    id: "loc-warehouse-logistics",
    name: "物流センター",
    type: "warehouse",
    address: "埼玉県川口市並木2-5-10",
    openDate: "2024-04-01",
  },
  {
    id: "loc-store-yokohama",
    name: "横浜店",
    type: "store",
    address: "神奈川県横浜市中区元町1-8-2",
    openDate: "2024-07-01",
  },
];

// --- カテゴリ ---
export const categories: CategoryDef[] = [
  { id: "cat-tops", parentId: null, name: "トップス", description: "Tシ���ツ、シャツ、ニット、パーカーなど" },
  { id: "cat-bottoms", parentId: null, name: "ボトムス", description: "デニム、チノ、スラックス、ショーツなど" },
  { id: "cat-outerwear", parentId: null, name: "アウター", description: "ジャケット、コート、ブルゾンなど" },
  { id: "cat-accessories", parentId: null, name: "アクセサリー", description: "キャップ、バッグ、ベルト、ソックスなど" },
  // サブカテゴリ
  { id: "cat-tshirt", parentId: "cat-tops", name: "Tシャツ", description: "" },
  { id: "cat-shirt", parentId: "cat-tops", name: "シャツ", description: "" },
  { id: "cat-knit", parentId: "cat-tops", name: "ニット/スウェット", description: "" },
  { id: "cat-pants", parentId: "cat-bottoms", name: "パンツ", description: "" },
  { id: "cat-shorts", parentId: "cat-bottoms", name: "ショーツ", description: "" },
  { id: "cat-jacket", parentId: "cat-outerwear", name: "ジャケット", description: "" },
  { id: "cat-coat", parentId: "cat-outerwear", name: "コート", description: "" },
  { id: "cat-bag", parentId: "cat-accessories", name: "バッグ", description: "" },
  { id: "cat-hat", parentId: "cat-accessories", name: "帽子", description: "" },
  { id: "cat-other-acc", parentId: "cat-accessories", name: "その他小物", description: "" },
];

// --- 定番商品 ---
export const stapleStyles: StyleDef[] = [
  {
    name: "ベーシックTシャツ",
    categoryId: "cat-tshirt",
    type: "staple",
    colors: ["ホワイト", "ブラック", "グレー", "ネイビー"],
    sizes: ["S", "M", "L", "XL"],
    price: 4000,
    activeFrom: "2020-04-01",
    safetyStock: 3,
  },
  {
    name: "ポケットTシャツ",
    categoryId: "cat-tshirt",
    type: "staple",
    colors: ["ホワイト", "ブラック", "カーキ"],
    sizes: ["S", "M", "L", "XL"],
    price: 5000,
    activeFrom: "2020-04-01",
    safetyStock: 3,
  },
  {
    name: "オックスフォードBDシャツ",
    categoryId: "cat-shirt",
    type: "staple",
    colors: ["ホワイト", "サックス", "ネイビー"],
    sizes: ["S", "M", "L", "XL"],
    price: 9000,
    activeFrom: "2020-04-01",
    safetyStock: 3,
  },
  {
    name: "スリムデニム",
    categoryId: "cat-pants",
    type: "staple",
    colors: ["インディゴ", "ブラック", "ワンウォッシュ"],
    sizes: ["S", "M", "L", "XL"],
    price: 12000,
    activeFrom: "2020-04-01",
    safetyStock: 3,
  },
  {
    name: "テーパードチノ",
    categoryId: "cat-pants",
    type: "staple",
    colors: ["ベージュ", "ネイビー", "オリーブ"],
    sizes: ["S", "M", "L", "XL"],
    price: 9000,
    activeFrom: "2020-04-01",
    safetyStock: 3,
  },
  {
    name: "ロゴキャップ",
    categoryId: "cat-hat",
    type: "staple",
    colors: ["ブラック", "ホワイト", "ネイビー"],
    sizes: ["FREE"],
    price: 4500,
    activeFrom: "2020-04-01",
    safetyStock: 3,
  },
  {
    name: "クルーネックスウェット",
    categoryId: "cat-knit",
    type: "staple",
    colors: ["グレー", "ブラック", "ネイビー"],
    sizes: ["S", "M", "L", "XL"],
    price: 8000,
    activeFrom: "2020-10-01",
    safetyStock: 3,
  },
  {
    name: "コーチジャケット",
    categoryId: "cat-jacket",
    type: "staple",
    colors: ["ブラック", "ネイビー"],
    sizes: ["S", "M", "L", "XL"],
    price: 15000,
    activeFrom: "2021-04-01",
    safetyStock: 2,
  },
  {
    name: "テーパードスラックス",
    categoryId: "cat-pants",
    type: "staple",
    colors: ["ブラック", "チャコール", "ネイビー"],
    sizes: ["S", "M", "L", "XL"],
    price: 11000,
    activeFrom: "2022-10-01",
    safetyStock: 3,
  },
  {
    name: "キャンバストート",
    categoryId: "cat-bag",
    type: "staple",
    colors: ["ナチュラル", "ブラック"],
    sizes: ["FREE"],
    price: 6000,
    activeFrom: "2023-10-01",
    safetyStock: 3,
  },
];

// --- シーズン商品 ---
export const seasonalStyles: StyleDef[] = [
  // SS2020
  { name: "リネンシャツ", categoryId: "cat-shirt", type: "seasonal", season: "SS2020", colors: ["ホワイト", "ベージュ", "サックス"], sizes: ["S", "M", "L", "XL"], price: 8500, activeFrom: "2020-04-01", onSaleFrom: "2020-09-01", discontinuedFrom: "2020-10-31", safetyStock: 1 },
  { name: "イージーショーツ", categoryId: "cat-shorts", type: "seasonal", season: "SS2020", colors: ["ネイビー", "カーキ", "ブラック"], sizes: ["S", "M", "L", "XL"], price: 7000, activeFrom: "2020-04-01", onSaleFrom: "2020-09-01", discontinuedFrom: "2020-10-31", safetyStock: 1 },
  { name: "サマーニット", categoryId: "cat-knit", type: "seasonal", season: "SS2020", colors: ["ホワイト", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 7500, activeFrom: "2020-04-01", onSaleFrom: "2020-09-01", discontinuedFrom: "2020-10-31", safetyStock: 1 },

  // AW2020
  { name: "���ウェットパーカー", categoryId: "cat-knit", type: "seasonal", season: "AW2020", colors: ["グレー", "ブラック", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 9500, activeFrom: "2020-09-01", onSaleFrom: "2021-03-01", discontinuedFrom: "2021-04-30", safetyStock: 1 },
  { name: "ウールジャケット", categoryId: "cat-jacket", type: "seasonal", season: "AW2020", colors: ["チャコール", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 25000, activeFrom: "2020-09-01", onSaleFrom: "2021-03-01", discontinuedFrom: "2021-04-30", safetyStock: 1 },
  { name: "コーデュロイパンツ", categoryId: "cat-pants", type: "seasonal", season: "AW2020", colors: ["ブラウン", "ベージュ", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 10000, activeFrom: "2020-09-01", onSaleFrom: "2021-03-01", discontinuedFrom: "2021-04-30", safetyStock: 1 },
  { name: "ニットキャップ", categoryId: "cat-hat", type: "seasonal", season: "AW2020", colors: ["グレー", "ブラック", "ボルドー", "ネイビー"], sizes: ["FREE"], price: 3500, activeFrom: "2020-09-01", onSaleFrom: "2021-03-01", discontinuedFrom: "2021-04-30", safetyStock: 1 },

  // SS2021
  { name: "ボーダーTシャツ", categoryId: "cat-tshirt", type: "seasonal", season: "SS2021", colors: ["ホワイト×ネイビー", "ホワイト×ブラック", "ホワイト×グリーン", "ホワイト×レッド"], sizes: ["S", "M", "L", "XL"], price: 5500, activeFrom: "2021-03-01", onSaleFrom: "2021-09-01", discontinuedFrom: "2021-10-31", safetyStock: 2 },
  { name: "ナイロンショーツ", categoryId: "cat-shorts", type: "seasonal", season: "SS2021", colors: ["ブラック", "ネイビー", "オリーブ"], sizes: ["S", "M", "L", "XL"], price: 6500, activeFrom: "2021-03-01", onSaleFrom: "2021-09-01", discontinuedFrom: "2021-10-31", safetyStock: 2 },
  { name: "オープンカラーシャツ", categoryId: "cat-shirt", type: "seasonal", season: "SS2021", colors: ["ホワイト", "ブラック", "ブルー"], sizes: ["S", "M", "L", "XL"], price: 8000, activeFrom: "2021-03-01", onSaleFrom: "2021-09-01", discontinuedFrom: "2021-10-31", safetyStock: 2 },
  { name: "レザーサンダル", categoryId: "cat-other-acc", type: "seasonal", season: "SS2021", colors: ["ブラック", "ブラウン"], sizes: ["S", "M", "L", "XL"], price: 12000, activeFrom: "2021-03-01", onSaleFrom: "2021-09-01", discontinuedFrom: "2021-10-31", safetyStock: 1 },
  { name: "リネンイージーパンツ", categoryId: "cat-pants", type: "seasonal", season: "SS2021", colors: ["ベージュ", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 8500, activeFrom: "2021-03-01", onSaleFrom: "2021-09-01", discontinuedFrom: "2021-10-31", safetyStock: 2 },

  // AW2021
  { name: "ダウンベスト", categoryId: "cat-jacket", type: "seasonal", season: "AW2021", colors: ["ブラック", "ネイビー", "オリーブ"], sizes: ["S", "M", "L", "XL"], price: 18000, activeFrom: "2021-09-01", onSaleFrom: "2022-03-01", discontinuedFrom: "2022-04-30", safetyStock: 2 },
  { name: "フリースジャケット", categoryId: "cat-jacket", type: "seasonal", season: "AW2021", colors: ["アイボリー", "ブラック", "ブラウン"], sizes: ["S", "M", "L", "XL"], price: 14000, activeFrom: "2021-09-01", onSaleFrom: "2022-03-01", discontinuedFrom: "2022-04-30", safetyStock: 2 },
  { name: "ウールパンツ", categoryId: "cat-pants", type: "seasonal", season: "AW2021", colors: ["グレー", "ブラック", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 13000, activeFrom: "2021-09-01", onSaleFrom: "2022-03-01", discontinuedFrom: "2022-04-30", safetyStock: 2 },
  { name: "タートルネックニット", categoryId: "cat-knit", type: "seasonal", season: "AW2021", colors: ["ホワイト", "ブラック", "ボルドー"], sizes: ["S", "M", "L", "XL"], price: 9000, activeFrom: "2021-09-01", onSaleFrom: "2022-03-01", discontinuedFrom: "2022-04-30", safetyStock: 2 },
  { name: "ウールマフラー", categoryId: "cat-other-acc", type: "seasonal", season: "AW2021", colors: ["グレー", "ネイビー", "ブラウン", "ボルドー"], sizes: ["FREE"], price: 6000, activeFrom: "2021-09-01", onSaleFrom: "2022-03-01", discontinuedFrom: "2022-04-30", safetyStock: 1 },

  // SS2022
  { name: "バンドカラーシャツ", categoryId: "cat-shirt", type: "seasonal", season: "SS2022", colors: ["ホワイト", "ベージュ"], sizes: ["S", "M", "L", "XL"], price: 8500, activeFrom: "2022-03-01", onSaleFrom: "2022-09-01", discontinuedFrom: "2022-10-31", safetyStock: 1 },
  { name: "ワイドショーツ", categoryId: "cat-shorts", type: "seasonal", season: "SS2022", colors: ["ブラック", "ベージュ", "オリーブ"], sizes: ["S", "M", "L", "XL"], price: 7500, activeFrom: "2022-03-01", onSaleFrom: "2022-09-01", discontinuedFrom: "2022-10-31", safetyStock: 1 },
  { name: "メッシュキャップ", categoryId: "cat-hat", type: "seasonal", season: "SS2022", colors: ["ブラック", "ネイビー", "ホワイト"], sizes: ["FREE"], price: 4000, activeFrom: "2022-03-01", onSaleFrom: "2022-09-01", discontinuedFrom: "2022-10-31", safetyStock: 1 },
  { name: "プリントTシャツ SS22", categoryId: "cat-tshirt", type: "seasonal", season: "SS2022", colors: ["ホワイト", "ブラック"], sizes: ["S", "M", "L", "XL"], price: 5500, activeFrom: "2022-03-01", onSaleFrom: "2022-09-01", discontinuedFrom: "2022-10-31", safetyStock: 1 },

  // AW2022
  { name: "ウールステンカラーコート", categoryId: "cat-coat", type: "seasonal", season: "AW2022", colors: ["キャメル", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 35000, activeFrom: "2022-09-01", onSaleFrom: "2023-03-01", discontinuedFrom: "2023-04-30", safetyStock: 1 },
  { name: "モックネックニット", categoryId: "cat-knit", type: "seasonal", season: "AW2022", colors: ["ホワイト", "ブラック", "グレー"], sizes: ["S", "M", "L", "XL"], price: 9500, activeFrom: "2022-09-01", onSaleFrom: "2023-03-01", discontinuedFrom: "2023-04-30", safetyStock: 1 },
  { name: "フランネルシャツ", categoryId: "cat-shirt", type: "seasonal", season: "AW2022", colors: ["レッド×ブラック", "グリーン×ネイビー", "グレー×ブラック"], sizes: ["S", "M", "L", "XL"], price: 8500, activeFrom: "2022-09-01", onSaleFrom: "2023-03-01", discontinuedFrom: "2023-04-30", safetyStock: 1 },
  { name: "キルティングジャケット", categoryId: "cat-jacket", type: "seasonal", season: "AW2022", colors: ["ブラック", "オリーブ"], sizes: ["S", "M", "L", "XL"], price: 22000, activeFrom: "2022-09-01", onSaleFrom: "2023-03-01", discontinuedFrom: "2023-04-30", safetyStock: 1 },

  // SS2023
  { name: "キャンプベスト", categoryId: "cat-jacket", type: "seasonal", season: "SS2023", colors: ["ベージュ", "オリーブ", "ブラック"], sizes: ["S", "M", "L", "XL"], price: 12000, activeFrom: "2023-03-01", onSaleFrom: "2023-09-01", discontinuedFrom: "2023-10-31", safetyStock: 2 },
  { name: "リネンワイドショーツ", categoryId: "cat-shorts", type: "seasonal", season: "SS2023", colors: ["ベージュ", "ネイビー", "ブラック"], sizes: ["S", "M", "L", "XL"], price: 7500, activeFrom: "2023-03-01", onSaleFrom: "2023-09-01", discontinuedFrom: "2023-10-31", safetyStock: 2 },
  { name: "リネンセットアップシャツ", categoryId: "cat-shirt", type: "seasonal", season: "SS2023", colors: ["ベージュ", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 11000, activeFrom: "2023-03-01", onSaleFrom: "2023-09-01", discontinuedFrom: "2023-10-31", safetyStock: 2 },
  { name: "リネンセットアップパンツ", categoryId: "cat-pants", type: "seasonal", season: "SS2023", colors: ["ベージュ", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 10000, activeFrom: "2023-03-01", onSaleFrom: "2023-09-01", discontinuedFrom: "2023-10-31", safetyStock: 2 },
  { name: "メッシュキャップ SS23", categoryId: "cat-hat", type: "seasonal", season: "SS2023", colors: ["ブラック", "ホワイト", "カーキ"], sizes: ["FREE"], price: 4500, activeFrom: "2023-03-01", onSaleFrom: "2023-09-01", discontinuedFrom: "2023-10-31", safetyStock: 2 },

  // AW2023
  { name: "MA-1ジャケット", categoryId: "cat-jacket", type: "seasonal", season: "AW2023", colors: ["ブラック", "オリーブ", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 19000, activeFrom: "2023-09-01", onSaleFrom: "2024-03-01", discontinuedFrom: "2024-04-30", safetyStock: 2 },
  { name: "ヘビーフランネルシャツ", categoryId: "cat-shirt", type: "seasonal", season: "AW2023", colors: ["レッド×ブラック", "ブルー×ブラック", "グリーン×ブラウン"], sizes: ["S", "M", "L", "XL"], price: 10000, activeFrom: "2023-09-01", onSaleFrom: "2024-03-01", discontinuedFrom: "2024-04-30", safetyStock: 2 },
  { name: "ラムウールニット", categoryId: "cat-knit", type: "seasonal", season: "AW2023", colors: ["キャメル", "グレー", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 11000, activeFrom: "2023-09-01", onSaleFrom: "2024-03-01", discontinuedFrom: "2024-04-30", safetyStock: 2 },
  { name: "レザーベルト", categoryId: "cat-other-acc", type: "seasonal", season: "AW2023", colors: ["ブラック", "ブラウン"], sizes: ["S", "M", "L"], price: 8000, activeFrom: "2023-09-01", onSaleFrom: "2024-03-01", discontinuedFrom: "2024-04-30", safetyStock: 1 },
  { name: "カシミヤマフラー AW23", categoryId: "cat-other-acc", type: "seasonal", season: "AW2023", colors: ["グレー", "ネイビー", "キャメル", "ボルドー"], sizes: ["FREE"], price: 15000, activeFrom: "2023-09-01", onSaleFrom: "2024-03-01", discontinuedFrom: "2024-04-30", safetyStock: 1 },

  // SS2024
  { name: "シアサッカーシャツ", categoryId: "cat-shirt", type: "seasonal", season: "SS2024", colors: ["ホワイト", "サックス", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 9500, activeFrom: "2024-03-01", onSaleFrom: "2024-09-01", discontinuedFrom: "2024-10-31", safetyStock: 2 },
  { name: "シアサッカーショーツ", categoryId: "cat-shorts", type: "seasonal", season: "SS2024", colors: ["ホワイト", "サックス", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 8000, activeFrom: "2024-03-01", onSaleFrom: "2024-09-01", discontinuedFrom: "2024-10-31", safetyStock: 2 },
  { name: "レザーサンダル SS24", categoryId: "cat-other-acc", type: "seasonal", season: "SS2024", colors: ["ブラック", "ブラウン"], sizes: ["S", "M", "L", "XL"], price: 13000, activeFrom: "2024-03-01", onSaleFrom: "2024-09-01", discontinuedFrom: "2024-10-31", safetyStock: 1 },
  { name: "プリントTシャツ SS24", categoryId: "cat-tshirt", type: "seasonal", season: "SS2024", colors: ["ホワイト", "ブラック", "ネイビー", "グレー"], sizes: ["S", "M", "L", "XL"], price: 5500, activeFrom: "2024-03-01", onSaleFrom: "2024-09-01", discontinuedFrom: "2024-10-31", safetyStock: 2 },
  { name: "ナイロンバッグ", categoryId: "cat-bag", type: "seasonal", season: "SS2024", colors: ["ブラック", "ネイビー", "カーキ"], sizes: ["FREE"], price: 7500, activeFrom: "2024-03-01", onSaleFrom: "2024-09-01", discontinuedFrom: "2024-10-31", safetyStock: 2 },
  { name: "リネンオープンカラーシャツ", categoryId: "cat-shirt", type: "seasonal", season: "SS2024", colors: ["ホワイト", "ベージュ", "ブルー"], sizes: ["S", "M", "L", "XL"], price: 9000, activeFrom: "2024-03-01", onSaleFrom: "2024-09-01", discontinuedFrom: "2024-10-31", safetyStock: 2 },

  // AW2024
  { name: "ムートンジャケット", categoryId: "cat-jacket", type: "seasonal", season: "AW2024", colors: ["ブラウン", "ブラック"], sizes: ["S", "M", "L", "XL"], price: 38000, activeFrom: "2024-09-01", onSaleFrom: "2025-03-01", discontinuedFrom: "2025-04-30", safetyStock: 1 },
  { name: "カシミヤマフラー AW24", categoryId: "cat-other-acc", type: "seasonal", season: "AW2024", colors: ["グレー", "ネイビー", "キャメル", "ボルドー"], sizes: ["FREE"], price: 16000, activeFrom: "2024-09-01", onSaleFrom: "2025-03-01", discontinuedFrom: "2025-04-30", safetyStock: 1 },
  { name: "ウールスラックス AW24", categoryId: "cat-pants", type: "seasonal", season: "AW2024", colors: ["チャコール", "ネイビー", "ブラック"], sizes: ["S", "M", "L", "XL"], price: 14000, activeFrom: "2024-09-01", onSaleFrom: "2025-03-01", discontinuedFrom: "2025-04-30", safetyStock: 2 },
  { name: "ダウンコート", categoryId: "cat-coat", type: "seasonal", season: "AW2024", colors: ["ブラック", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 45000, activeFrom: "2024-09-01", onSaleFrom: "2025-03-01", discontinuedFrom: "2025-04-30", safetyStock: 1 },
  { name: "ヘビーウェイトスウェット", categoryId: "cat-knit", type: "seasonal", season: "AW2024", colors: ["グレー", "ブラック", "ネイビー"], sizes: ["S", "M", "L", "XL"], price: 10000, activeFrom: "2024-09-01", onSaleFrom: "2025-03-01", discontinuedFrom: "2025-04-30", safetyStock: 2 },
  { name: "ウールニットキャップ", categoryId: "cat-hat", type: "seasonal", season: "AW2024", colors: ["グレー", "ブラック", "ネイビー", "ボルドー"], sizes: ["FREE"], price: 4500, activeFrom: "2024-09-01", onSaleFrom: "2025-03-01", discontinuedFrom: "2025-04-30", safetyStock: 2 },
];

// --- 期間限定商品 ---
export const limitedStyles: StyleDef[] = [
  {
    name: "1周年記念Tシャツ",
    categoryId: "cat-tshirt",
    type: "limited",
    colors: ["ホワイト", "ブラック"],
    sizes: ["S", "M", "L", "XL"],
    price: 5500,
    activeFrom: "2021-04-01",
    discontinuedFrom: "2021-04-14",
    safetyStock: 0,
  },
  {
    name: "アーティストコラボパーカー",
    categoryId: "cat-knit",
    type: "limited",
    colors: ["ブラック"],
    sizes: ["S", "M", "L", "XL"],
    price: 18000,
    activeFrom: "2022-10-15",
    discontinuedFrom: "2022-10-20",
    safetyStock: 0,
  },
  {
    name: "3周年記念トートバッグ",
    categoryId: "cat-bag",
    type: "limited",
    colors: ["ナチ���ラル", "ブラック"],
    sizes: ["FREE"],
    price: 8000,
    activeFrom: "2023-04-01",
    discontinuedFrom: "2023-04-30",
    safetyStock: 0,
  },
  {
    name: "デザイナーコラボMA-1",
    categoryId: "cat-jacket",
    type: "limited",
    colors: ["ブラック"],
    sizes: ["S", "M", "L", "XL"],
    price: 45000,
    activeFrom: "2024-04-15",
    discontinuedFrom: "2024-04-17",
    safetyStock: 0,
  },
  {
    name: "5周年記念フーディ",
    categoryId: "cat-knit",
    type: "limited",
    colors: ["ブラック", "ホワイト", "グレー"],
    sizes: ["S", "M", "L", "XL"],
    price: 12000,
    activeFrom: "2025-01-15",
    discontinuedFrom: "2025-02-15",
    safetyStock: 0,
  },
];
