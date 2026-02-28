//product.schema.ts
import { z } from 'zod';

// 規格選項 schema (例如: {id: "opt1", name: "顏色", values: ["紅", "藍"]})
export const productOptionSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    values: z.array(z.string().min(1))
});

// 規格變體 schema (例如: {id: "v1", price: 100, stock: 10, combination: {opt1: "紅"}})
export const productVariantSchema = z.object({
    id: z.string().min(1),
    price: z.number().min(0),
    stock: z.number().int().min(0),
    combination: z.record(z.string(), z.string()) // key 為 optionId
});

// 新增/修改商品的資料驗證
export const createProductSchema = z.object({
    name: z.string().min(1, '商品名稱不能為空').max(255, '名稱過長'),
    slug: z.string().min(1, 'Slug 不能為空').max(200, 'Slug 過長').regex(/^[a-z0-9-]+$/, 'Slug 只能包含小寫字母、數字與連字號').optional(), // 可選，由後端生成
    description: z.string().max(5000, '描述過長').optional(),
    price: z.number().min(0, '價格不能小於 0'),
    salePrice: z.number().min(0, '特價價格不能小於 0').optional(),
    isOnSale: z.boolean().optional(),
    stock: z.number().int().min(0, '庫存不能小於 0'),
    categoryId: z.number().int(),
    images: z.array(z.string().url()).optional(), // 接收圖片 URL 陣列
    options: z.array(productOptionSchema).optional(), // 規格選項
    variants: z.array(productVariantSchema).optional(), // 規格組合
    isActive: z.boolean().optional(),
});

// 查詢參數驗證 (處理 query string 轉型)
export const queryProductSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().max(100, '搜尋字串過長').optional(),
    categoryId: z.coerce.number().optional(),
});