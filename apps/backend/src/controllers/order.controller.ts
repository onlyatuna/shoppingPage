// apps/backend/src/controllers/order.controller.ts
import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas/order.schema';
import { StatusCodes } from 'http-status-codes';
import { OrderStatus } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';

// 建立訂單
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const shippingInfo = createOrderSchema.parse(req.body);

    const order = await OrderService.createOrder(userId, shippingInfo);

    res.status(StatusCodes.CREATED).json({
        status: 'success',
        message: '訂單建立成功',
        data: {
            orderId: order.id,
            totalAmount: order.totalAmount,
        },
    });
});

// 取得我的訂單
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const orders = await OrderService.getMyOrders(userId);
    res.json({ status: 'success', data: orders });
});

// 取得訂單詳情
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const orderId = req.params.id;
    const order = await OrderService.getOrderById(userId, orderId);
    res.json({ status: 'success', data: order });
});

// [新增] 取得所有訂單 (Admin)
export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.query;
    // 簡單驗證 status 是否合法，若不合法則當作 undefined (查全部)
    const filterStatus = Object.values(OrderStatus).includes(status as any)
        ? (status as OrderStatus)
        : undefined;

    const orders = await OrderService.findAllAdmin(filterStatus);
    res.json({ status: 'success', data: orders });
});

// [新增] 更新狀態 (Admin)
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const { status } = updateOrderStatusSchema.parse(req.body);

    const order = await OrderService.updateStatus(orderId, status);
    res.json({ status: 'success', data: order, message: '狀態更新成功' });
});

// [新增] 刪除訂單 (僅限開發者)
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    await OrderService.deleteOrder(orderId);
    res.json({ status: 'success', message: '訂單已刪除' });
});

// [新增] 模擬付款
export const payOrder = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const userId = req.user!.userId;

    await OrderService.payOrder(userId, orderId);
    res.json({ status: 'success', message: '付款成功' });
});