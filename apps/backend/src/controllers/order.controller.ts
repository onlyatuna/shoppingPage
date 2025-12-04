import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas/order.schema';
import { StatusCodes } from 'http-status-codes';
import { OrderStatus } from '@prisma/client';

// 建立訂單
export const createOrder = async (req: Request, res: Response) => {
    try {
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
    } catch (error: any) {
        // 捕捉庫存不足等錯誤
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

// 取得我的訂單
export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const orders = await OrderService.getMyOrders(userId);
        res.json({ status: 'success', data: orders });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '取得訂單失敗' });
    }
};

// 取得訂單詳情
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const orderId = req.params.id;
        const order = await OrderService.getOrderById(userId, orderId);
        res.json({ status: 'success', data: order });
    } catch (error) {
        res.status(StatusCodes.NOT_FOUND).json({ message: '訂單不存在' });
    }
};

// [新增] 取得所有訂單
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        // 簡單驗證 status 是否合法，若不合法則當作 undefined (查全部)
        const filterStatus = Object.values(OrderStatus).includes(status as any)
            ? (status as OrderStatus)
            : undefined;

        const orders = await OrderService.findAllAdmin(filterStatus);
        res.json({ status: 'success', data: orders });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '取得訂單列表失敗' });
    }
};

// [新增] 更新狀態
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id;
        const { status } = updateOrderStatusSchema.parse(req.body);

        const order = await OrderService.updateStatus(orderId, status);
        res.json({ status: 'success', data: order, message: '狀態更新成功' });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message || '更新失敗' });
    }
};

// [新增] 刪除訂單 (僅限開發者)
export const deleteOrder = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.id;
        await OrderService.deleteOrder(orderId);
        res.json({ status: 'success', message: '訂單已刪除' });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message || '刪除失敗' });
    }
};