//category.schema.ts
import { z } from 'zod';

export const createCategorySchema = z.object({
    name: z.string().min(1, '分類名稱不能為空').max(100, '名稱過長'),
    slug: z.string().min(1, 'Slug 不能為空').max(100, 'Slug 過長').regex(/^[a-z0-9-]+$/, 'Slug 只能包含小寫字母、數字與連字號'),
});

export const updateCategorySchema = createCategorySchema.partial();