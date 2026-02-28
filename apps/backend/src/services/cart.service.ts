//cart.service.ts
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/appError';
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
        // 計算總金額 (可選，通常前端算也可以，但在後端算更安全)
        const totalAmount = cart.items.reduce((sum, item) => {
            let price = Number(item.product.price);

            // 嘗試尋找對應的變體價格
            if (item.variantId && item.product.variants) {
                const variants = item.product.variants as any[];
                const variant = variants.find((v: any) => v.id === item.variantId);

                if (variant) {
                    // Check for variant sale price
                    if (variant.isOnSale && variant.salePrice) {
                        price = Number(variant.salePrice);
                    } else {
                        price = Number(variant.price);
                    }
                }
            } else {
                // Check for product sale price (if no variant selected)
                if (item.product.isOnSale && item.product.salePrice) {
                    price = Number(item.product.salePrice);
                }
            }

            return sum + price * item.quantity;
        }, 0);

        return { ...cart, totalAmount };
    }

    // --- 加入商品到購物車 ---
    // apps/backend/src/services/cart.service.ts

    static async addItem(userId: number, productId: number, quantity: number, variantId?: string) {
        return prisma.$transaction(async (tx) => {
            // 1. 撈取最新的商品資訊 (在交易內，確保讀取一致性)
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product || product.deletedAt) throw new AppError('商品不存在', StatusCodes.NOT_FOUND);
            if (!product.isActive) throw new AppError('商品已下架', StatusCodes.BAD_REQUEST);

            // --- 庫存檢查 (支援變體) ---
            let currentStock = product.stock;
            if (variantId) {
                const variants = product.variants as any[];
                const targetVariant = variants?.find((v: any) => v.id === variantId);
                if (!targetVariant) throw new AppError('無效的規格變體', StatusCodes.BAD_REQUEST);
                currentStock = Number(targetVariant.stock);
            }

            if (quantity > currentStock) {
                throw new AppError(`庫存不足，僅剩 ${currentStock} 件`, StatusCodes.BAD_REQUEST);
            }

            // 2. 取得或建立購物車
            let cart = await tx.cart.findUnique({ where: { userId } });
            if (!cart) {
                cart = await tx.cart.create({ data: { userId } });
            }

            // 3. 檢查商品是否已在車內
            const existingItem = await tx.cartItem.findFirst({
                where: {
                    cartId: cart.id,
                    productId: productId,
                    variantId: variantId || null,
                }
            });

            if (existingItem) {
                const newTotalQuantity = existingItem.quantity + quantity;
                if (newTotalQuantity > currentStock) {
                    throw new AppError(`庫存不足！購物車已有 ${existingItem.quantity} 件，再加 ${quantity} 件會超過庫存 (${currentStock} 件)`, StatusCodes.BAD_REQUEST);
                }

                return tx.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: newTotalQuantity },
                });
            } else {
                return tx.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId,
                        variantId: variantId || null,
                        quantity,
                    },
                });
            }
        });
    }
    // --- 更新項目數量 ---
    static async updateItemQuantity(userId: number, itemId: number, quantity: number) {
        return prisma.$transaction(async (tx) => {
            // [SECURITY] 結合 userId 查詢，確保該項目屬於當前使用者
            const item = await tx.cartItem.findFirst({
                where: {
                    id: itemId,
                    cart: { userId }
                }
            });

            if (!item) {
                throw new AppError('找不到該購物車項目', StatusCodes.NOT_FOUND);
            }

            // 檢查庫存
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product || product.deletedAt) throw new AppError('商品不存在', StatusCodes.NOT_FOUND);

            let currentStock = product.stock;
            if (item.variantId) {
                const variants = product.variants as any[];
                const targetVariant = variants?.find((v: any) => v.id === item.variantId);
                if (targetVariant) {
                    currentStock = Number(targetVariant.stock);
                }
            }

            if (quantity > currentStock) {
                throw new AppError(`庫存不足，最大可購買數量為 ${currentStock}`, StatusCodes.BAD_REQUEST);
            }

            return tx.cartItem.update({
                where: { id: itemId },
                data: { quantity },
            });
        });
    }

    // --- 移除單一項目 ---
    static async removeItem(userId: number, itemId: number) {
        // [SECURITY] 結合 userId 查詢，確保該項目屬於當前使用者
        const item = await prisma.cartItem.findFirst({
            where: {
                id: itemId,
                cart: { userId }
            }
        });

        if (!item) {
            throw new AppError('無法刪除：權限不足或項目不存在', StatusCodes.FORBIDDEN);
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