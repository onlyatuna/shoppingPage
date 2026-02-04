//cart.service.ts
import { prisma } from '../utils/prisma';

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
        // 1. 撈取商品資訊
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error('商品不存在');
        if (!product.isActive) throw new Error('商品已下架');

        // --- 庫存檢查 (支援變體) ---
        let currentStock = product.stock;

        if (variantId) {
            // 如果有指定變體，檢查該變體是否存在且有庫存
            const variants = product.variants as any[];
            const targetVariant = variants?.find((v: any) => v.id === variantId);

            if (!targetVariant) {
                throw new Error('無效的規格變體');
            }
            currentStock = Number(targetVariant.stock);

            if (quantity > currentStock) {
                throw new Error(`該規格庫存不足，僅剩 ${currentStock} 件`);
            }
        } else {
            // 無變體，檢查總庫存 (或主庫存)
            if (quantity > currentStock) {
                throw new Error(`庫存不足，僅剩 ${currentStock} 件`);
            }
        }


        // 2. 取得或建立購物車
        let cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { userId } });
        }

        // 3. 檢查商品是否已在車內 (符合 ProductId AND VariantId)
        const existingItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId_variantId: { // 使用新的複合鍵
                    cartId: cart.id,
                    productId: productId,
                    variantId: variantId ?? '', // Prisma String? needs explicit handling if unique constraint treats key differently? 
                    // Wait, Prisma 'String?' unique composite works with nulls usually, BUT
                    // in MySQL, unique constraint allowing multiple NULLs means we might get duplicates if we rely on NULL.
                    // Ideally, avoiding NULL in unique index is safer, or we ensure code handles it.
                    // Actually, let's use check findFirst for safety if unique index behavior varies.
                    // But schema says @@unique([cartId, productId, variantId])
                    // For null variantId, we should query where variantId is null.
                },
            },
        } as any);
        // Note: The unique key name might be generated differently or we need to query differently since 'variantId' is optional.
        // Let's use findFirst to be safe and robust against NULL handling in Unique constraints logic

        const existingItemSafe = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId: productId,
                variantId: variantId || null,
            }
        });

        if (existingItemSafe) {
            // 累加檢查
            const newTotalQuantity = existingItemSafe.quantity + quantity;

            if (newTotalQuantity > currentStock) {
                throw new Error(`庫存不足！購物車已有 ${existingItemSafe.quantity} 件，再加 ${quantity} 件會超過庫存 (${currentStock} 件)`);
            }

            return prisma.cartItem.update({
                where: { id: existingItemSafe.id },
                data: { quantity: newTotalQuantity },
            });
        } else {
            return prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    variantId, // Can be null
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