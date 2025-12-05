// cart.controller.ts
import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { addToCartSchema, updateCartItemSchema } from '../schemas/cart.schema';
import { StatusCodes } from 'http-status-codes';

// 取得購物車
export const getMyCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId; // 來自 authenticateToken Middleware
        const cart = await CartService.getCart(userId);
        res.json({ status: 'success', data: cart });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '無法取得購物車' });
    }
};

// 加入商品
export const addItemToCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { productId, quantity } = addToCartSchema.parse(req.body);

        await CartService.addItem(userId, productId, quantity);

        // 為了前端方便，新增完通常會重新撈一次最新的購物車狀態回傳
        const updatedCart = await CartService.getCart(userId);
        res.json({ status: 'success', data: updatedCart });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

// 更新數量
export const updateItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const itemId = Number(req.params.id);
        const { quantity } = updateCartItemSchema.parse(req.body);

        await CartService.updateItemQuantity(userId, itemId, quantity);

        const updatedCart = await CartService.getCart(userId);
        res.json({ status: 'success', data: updatedCart });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

// 移除項目
export const removeItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        // 1. 確保將 params.id 轉為數字
        const itemId = Number(req.params.id);

        // 2. 簡單防呆
        if (isNaN(itemId)) {
            throw new Error('無效的 Item ID');
        }

        await CartService.removeItem(userId, itemId);

        // 3. 刪除後，通常回傳最新的購物車狀態給前端更新 (或是回傳成功訊息)
        const updatedCart = await CartService.getCart(userId);
        res.json({ status: 'success', data: updatedCart });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};