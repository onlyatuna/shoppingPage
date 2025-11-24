import { prisma } from '../utils/prisma';
import { StatusCodes } from 'http-status-codes';

export class CartService {

    // --- 取得個人購物車 ---
    static async getCart(userId: number) {
        // 確保購物車存在
        let cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true, // 把商品資訊 (名稱、圖片、價格) 一併撈出來
                    },
                    orderBy: {
                        id: 'asc', // 依加入順序排列
                    },
                },
            },
        });

        // 防呆：如果該用戶沒購物車，幫他建一個
        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
                include: { items: { include: { product: true } } },
            });
        }

        // 計算總金額 (可選，通常前端算也可以，但在後端算更安全)
        const totalAmount = cart.items.reduce((sum, item) => {
            return sum + Number(item.product.price) * item.quantity;
        }, 0);

        return { ...cart, totalAmount };
    }

    // --- 加入商品到購物車 ---
    // apps/backend/src/services/cart.service.ts

    static async addItem(userId: number, productId: number, quantity: number) {
        // 1. 撈取商品資訊
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error('商品不存在');
        if (!product.isActive) throw new Error('商品已下架');

        // --- 修正點 1: 基本檢查 (單次加入不能超過庫存) ---
        if (quantity > product.stock) {
            throw new Error(`庫存不足，僅剩 ${product.stock} 件`);
        }

        // 2. 取得或建立購物車
        let cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { userId } });
        }

        // 3. 檢查商品是否已在車內
        const existingItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: productId,
                },
            },
        });

        if (existingItem) {
            // --- 修正點 2: 累加檢查 (關鍵！) ---
            // 計算「目前的數量」+「想加入的數量」
            const newTotalQuantity = existingItem.quantity + quantity;

            if (newTotalQuantity > product.stock) {
                throw new Error(`庫存不足！購物車已有 ${existingItem.quantity} 件，再加 ${quantity} 件會超過庫存 (${product.stock} 件)`);
            }

            // 檢查通過，執行更新
            return prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newTotalQuantity },
            });
        } else {
            // 如果原本不在車內，前面已經檢查過 quantity > stock，直接建立即可
            return prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                },
            });
        }
    }
    // --- 更新項目數量 ---
    static async updateItemQuantity(userId: number, itemId: number, quantity: number) {
        // 驗證該 Item 是否屬於該使用者的購物車 (安全性檢查)
        const item = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });

        if (!item || item.cart.userId !== userId) {
            throw new Error('找不到該購物車項目');
        }

        // 檢查庫存 (如果要嚴謹一點，這裡也要查 Product 表看庫存夠不夠)
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product && quantity > product.stock) {
            throw new Error(`庫存不足，最大可購買數量為 ${product.stock}`);
        }

        return prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
        });
    }

    // --- 移除單一項目 ---
    static async removeItem(userId: number, itemId: number) {
        // 同樣做安全性檢查
        const item = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });

        if (!item || item.cart.userId !== userId) {
            throw new Error('無法刪除：權限不足或項目不存在');
        }

        return prisma.cartItem.delete({
            where: { id: itemId },
        });
    }

    // --- 清空購物車 ---
    static async clearCart(userId: number) {
        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) return;

        return prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });
    }
}