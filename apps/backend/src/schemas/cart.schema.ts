import { z } from 'zod';

// 加入購物車
export const addToCartSchema = z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1, '數量至少為 1').default(1),
});

// 更新數量
export const updateCartItemSchema = z.object({
    quantity: z.number().int().min(1, '數量至少為 1'),
});