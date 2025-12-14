//product.schema.ts
import { z } from 'zod';

// 新增/修改商品的資料驗證
export const createProductSchema = z.object({
    name: z.string().min(1, '商品名稱不能為空'),
    slug: z.string().min(1, 'Slug 不能為空').regex(/^[a-z0-9-]+$/, 'Slug 只能包含小寫字母、數字與連字號'),
    description: z.string().optional(),
    price: z.number().min(0, '價格不能小於 0'),
    stock: z.number().int().min(0, '庫存不能小於 0'),
    categoryId: z.number().int(),
    images: z.array(z.string().url()).optional(), // 接收圖片 URL 陣列
    options: z.array(z.any()).optional(), // 規格選項
    variants: z.array(z.any()).optional(), // 規格組合
    isActive: z.boolean().optional(),
});

// 查詢參數驗證 (處理 query string 轉型)
export const queryProductSchema = z.object({
    page: z.coerce.number().min(1).default(1),      // coerce 會把字串 "1" 轉成數字 1
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),                  // 搜尋關鍵字
    categoryId: z.coerce.number().optional(),       // 篩選分類
});