//order.service.ts
import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/appError';
import { StatusCodes } from 'http-status-codes';
import { createOrderSchema } from '../schemas/order.schema';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

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
                throw new AppError('購物車是空的，無法結帳', StatusCodes.BAD_REQUEST);
            }

            // 步驟 2: 檢查庫存 & 計算總金額
            let totalAmount = new Prisma.Decimal(0);
            const orderItemsData = [];

            for (const item of cart.items) {
                // 再次檢查庫存 (防止加入購物車後被買光)
                if (item.product.stock < item.quantity) {
                    throw new AppError(`商品 "${item.product.name}" 庫存不足 (剩餘: ${item.product.stock})`, StatusCodes.BAD_REQUEST);
                }

                // 檢查商品是否已下架
                if (!item.product.isActive) {
                    throw new AppError(`商品 "${item.product.name}" 已下架`, StatusCodes.BAD_REQUEST);
                }

                // 累加金額 (使用 Prisma.Decimal 確保精準度)
                const price = new Prisma.Decimal(item.product.price);
                totalAmount = totalAmount.plus(price.times(item.quantity));

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
            select: {
                id: true,
                status: true,
                totalAmount: true,
                shippingInfo: true,
                createdAt: true,
                updatedAt: true,
                items: {
                    include: { product: true },
                },
            }
        });
    }

    // --- 查詢單筆訂單詳情 ---
    static async getOrderById(userId: number, orderId: string) {
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId },
            select: {
                id: true,
                status: true,
                totalAmount: true,
                shippingInfo: true,
                paymentId: true, // 使用者可以看 ID
                // paymentData: false, // 排除敏感原始資料
                createdAt: true,
                updatedAt: true,
                items: {
                    include: { product: true },
                },
            }
        });

        if (!order) {
            throw new AppError('找不到訂單', StatusCodes.NOT_FOUND);
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

    // [新增] 開發者：刪除單個訂單
    static async deleteOrder(orderId: string) {
        return prisma.$transaction(async (tx) => {
            // 先刪除訂單項目
            await tx.orderItem.deleteMany({
                where: { orderId }
            });

            // 再刪除訂單
            const deletedOrder = await tx.order.delete({
                where: { id: orderId }
            });

            return deletedOrder;
        });
    }

    // [新增] 模擬付款 (BOLA 修復版本)
    static async payOrder(userId: number, orderId: string, isAdmin: boolean = false) {
        // [SECURITY] 使用 findFirst 並帶入 userId 確保擁有權 (除非是 Admin)
        const order = await prisma.order.findFirst({
            where: isAdmin ? { id: orderId } : { id: orderId, userId }
        });

        if (!order) {
            throw new AppError('訂單不存在', StatusCodes.NOT_FOUND);
        }

        if (order.status !== 'PENDING') {
            throw new AppError(`訂單狀態不正確 (當前為: ${order.status})`, StatusCodes.BAD_REQUEST);
        }

        return prisma.order.update({
            where: { id: orderId },
            data: { status: 'PAID' },
        });
    }
}
