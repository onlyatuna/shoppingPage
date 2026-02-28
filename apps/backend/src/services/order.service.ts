//order.service.ts
import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/appError';
import { StatusCodes } from 'http-status-codes';
import { createOrderSchema } from '../schemas/order.schema';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { DevLogService } from './devLog.service';

type CreateOrderInput = z.infer<typeof createOrderSchema>;

export class OrderService {

    // --- 內部建立訂單邏輯 (共用) ---
    private static async createOrderInternal(tx: any, userId: number, shippingInfo: CreateOrderInput) {
        // 步驟 1: 撈取該使用者的購物車內容
        const cart = await tx.cart.findUnique({
            where: { userId },
            include: {
                items: { include: { product: true } },
            },
        });

        if (!cart || cart.items.length === 0) {
            throw new AppError('購物車是空的，無法結帳', StatusCodes.BAD_REQUEST);
        }

        // 步驟 2: 檢查庫存 & 計算總金額
        let totalAmount = new Prisma.Decimal(0);
        const orderItemsData = [];

        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                throw new AppError(`商品 "${item.product.name}" 庫存不足 (剩餘: ${item.product.stock})`, StatusCodes.BAD_REQUEST);
            }

            if (!item.product.isActive) {
                throw new AppError(`商品 "${item.product.name}" 已下架`, StatusCodes.BAD_REQUEST);
            }

            const price = new Prisma.Decimal(item.product.price);
            totalAmount = totalAmount.plus(price.times(item.quantity));

            orderItemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
                productName: item.product.name,
            });

            // 步驟 3: 扣除庫存
            const updateRes = await tx.product.updateMany({
                where: {
                    id: item.productId,
                    stock: { gte: item.quantity }
                },
                data: {
                    stock: { decrement: item.quantity },
                },
            });

            if (updateRes.count === 0) {
                throw new AppError(`商品 "${item.product.name}" 庫存不足，訂單建立失敗`, StatusCodes.BAD_REQUEST);
            }
        }

        // 步驟 4: 建立訂單
        const order = await tx.order.create({
            data: {
                userId,
                totalAmount,
                status: 'PENDING',
                shippingInfo,
                items: { create: orderItemsData },
            },
        });

        // 步驟 5: 清空購物車
        await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        return order;
    }

    // --- 建立訂單 (結帳) ---
    static async createOrder(userId: number, shippingInfo: CreateOrderInput) {
        return prisma.$transaction(async (tx) => {
            return this.createOrderInternal(tx, userId, shippingInfo);
        });
    }

    // --- [新增] 原子化開發者指令 ---
    static async developerInstantCheckout(userId: number, shippingInfo: CreateOrderInput) {
        return prisma.$transaction(async (tx) => {
            // 1. 自動清除該帳號所有 PENDING 訂單 (釋放開發環境資料庫空間)
            // 先找出來以返還庫存
            const pendingOrders = await tx.order.findMany({
                where: { userId, status: 'PENDING' },
                include: { items: true }
            });

            const deletedOrderIds: string[] = pendingOrders.map((o: any) => o.id);

            if (deletedOrderIds.length > 0) {
                // A. 返還庫存邏輯
                for (const po of pendingOrders) {
                    for (const poItem of po.items) {
                        await tx.product.updateMany({
                            where: { id: poItem.productId },
                            data: { stock: { increment: poItem.quantity } }
                        });
                    }
                }

                // B. 先刪除所有關聯的 OrderItem (外鍵約束)
                await tx.orderItem.deleteMany({
                    where: { orderId: { in: deletedOrderIds } }
                });

                // C. 再刪除 Order 本身
                await tx.order.deleteMany({
                    where: { id: { in: deletedOrderIds } }
                });

                DevLogService.log(
                    'CLEAN_PENDING_ORDERS',
                    userId,
                    `開發者繞過：成功清空 ${deletedOrderIds.length} 筆舊有 PENDING 訂單與項目`,
                    { deletedOrderIds }
                );
            }

            // 2. 執行原有的建立訂單邏輯 (扣庫存、建快照)
            const order = await this.createOrderInternal(tx, userId, shippingInfo);

            // 3. 直接標記為 PAID 並寫入開發者繞過標記
            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: {
                    status: 'PAID',
                    paymentData: {
                        method: 'DEV_INSTANT_CHECKOUT',
                        forcedBy: userId,
                        timestamp: new Date().toISOString()
                    }
                }
            });

            return updatedOrder;
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
                trackingNumber: true,
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
                trackingNumber: true,
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
    static async updateStatus(orderId: string, status: OrderStatus, trackingNumber?: string) {
        const updateData: Prisma.OrderUpdateInput = { status };
        if (trackingNumber !== undefined) {
            updateData.trackingNumber = trackingNumber;
        }

        return prisma.order.update({
            where: { id: orderId },
            data: updateData,
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
