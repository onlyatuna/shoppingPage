// apps/backend/src/controllers/cart.controller.ts
import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { addToCartSchema, updateCartItemSchema } from '../schemas/cart.schema';
import { asyncHandler } from '../utils/asyncHandler';

// 取得購物車
export const getMyCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const cart = await CartService.getCart(userId);
    res.json({ status: 'success', data: cart });
});

// 加入商品
export const addItemToCart = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { productId, quantity, variantId } = addToCartSchema.parse(req.body);

    await CartService.addItem(userId, productId, quantity, variantId);

    const updatedCart = await CartService.getCart(userId);
    res.json({ status: 'success', data: updatedCart });
});

// 更新數量
export const updateItem = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const itemId = Number(req.params.id);
    const { quantity } = updateCartItemSchema.parse(req.body);

    await CartService.updateItemQuantity(userId, itemId, quantity);

    const updatedCart = await CartService.getCart(userId);
    res.json({ status: 'success', data: updatedCart });
});

// 移除項目
export const removeItem = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const itemId = Number(req.params.id);

    if (isNaN(itemId)) {
        throw new Error('無效的 Item ID');
    }

    await CartService.removeItem(userId, itemId);

    const updatedCart = await CartService.getCart(userId);
    res.json({ status: 'success', data: updatedCart });
});