import { prisma } from '../utils/prisma';
import { createOrderSchema } from '../schemas/order.schema';
import { z } from 'zod';
import { Prisma, OrderStatus } from '@prisma/client';

type CreateOrderInput = z.infer<typeof createOrderSchema>;

export class OrderService {

    // --- 建立訂單 (結帳) ---
    static async createOrder(userId: number, shippingInfo: CreateOrderInput) {

        // 開啟一個互動式交易 (Interactive Transaction)
        return prisma.$transaction(async (tx) => {

            // 步驟 1: 撈取該使用者的購物車內容
            // 這裡必須在 transaction (tx) 內查詢，確保讀取一致性
            const cart = await tx.cart.findUnique({
                where: { userId },
                include: {
                    items: {
                        include: { product: true },
                    },
                },
            });

            if (!cart || cart.items.length === 0) {
                throw new Error('購物車是空的，無法結帳');
            }

            // 步驟 2: 檢查庫存 & 計算總金額
            let totalAmount = 0;
            const orderItemsData = [];

            for (const item of cart.items) {
                // 再次檢查庫存 (防止加入購物車後被買光)
                if (item.product.stock < item.quantity) {
                    throw new Error(`商品 "${item.product.name}" 庫存不足 (剩餘: ${item.product.stock})`);
                }

                // 檢查商品是否已下架
                if (!item.product.isActive) {
                    throw new Error(`商品 "${item.product.name}" 已下架`);
                }

                // 累加金額 (Prisma 的 Decimal 轉為 Number 計算，或使用 Decimal 函式庫運算)
                // 注意: 實際金流建議全程用 Decimal，這裡為了教學簡化轉 Number
                const price = Number(item.product.price);
                totalAmount += price * item.quantity;

                // 準備寫入 OrderItem 的資料 (這就是價格快照！)
                orderItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.product.price, // 存入當下價格
                });

                // 步驟 3: 扣除庫存
                // 這裡直接 update，如果併發量極大，建議使用 decrement 原子操作
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity },
                    },
                });
            }

            // 步驟 4: 建立訂單
            const order = await tx.order.create({
                data: {
                    userId,
                    totalAmount,
                    status: 'PENDING', // 預設為待付款
                    shippingInfo,      // 儲存 JSON 格式的收件資訊
                    items: {
                        create: orderItemsData,
                    },
                },
            });

            // 步驟 5: 清空購物車
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            // 回傳訂單資料
            return order;
        });
    }

    // --- 查詢我的訂單列表 ---
    static async getMyOrders(userId: number) {
        return prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { product: true }, // 顯示商品詳情
                },
            },
        });
    }

    // --- 查詢單筆訂單詳情 ---
    static async getOrderById(userId: number, orderId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: { product: true },
                },
            },
        });

        if (!order || order.userId !== userId) {
            throw new Error('找不到訂單');
        }

        return order;
    }


    // [新增] 管理員：取得所有訂單 (支援狀態篩選)
    static async findAllAdmin(status?: OrderStatus) {
        return prisma.order.findMany({
            where: status ? { status } : {}, // 如果有傳 status 就篩選，沒傳就撈全部
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } }, // 順便撈出是誰買的
                items: { include: { product: true } },
            },
        });
    }

    // [新增] 管理員：修改訂單狀態
    static async updateStatus(orderId: string, status: OrderStatus) {
        return prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
    }

}