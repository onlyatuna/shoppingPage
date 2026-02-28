// apps/backend/src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';

export const requestLinePay = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { orderId } = req.body;
    const result = await PaymentService.initiateLinePay(orderId, userId);
    res.json({ status: 'success', data: result });
});

export const confirmLinePay = asyncHandler(async (req: Request, res: Response) => {
    logger.info({ action: 'payment_confirm_init', body: req.body });
    const { transactionId, orderId } = req.body;
    const userId = req.user!.userId;

    if (!transactionId || !orderId) {
        throw new Error(`缺少參數: transactionId=${transactionId}, orderId=${orderId}`);
    }

    await PaymentService.confirmLinePay(orderId, transactionId, userId);
    res.json({ status: 'success', message: '付款成功' });
});

export const checkLinePayStatus = asyncHandler(async (req: Request, res: Response) => {
    const { transactionId } = req.params;

    if (!transactionId) {
        throw new Error('缺少 transactionId');
    }

    const userId = req.user!.userId;
    const result = await PaymentService.checkPaymentStatus(transactionId, userId);

    res.json({
        status: 'success',
        data: result
    });
});

export const captureLinePay = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.body;
    if (!orderId) throw new Error('缺少 orderId');

    const result = await PaymentService.capturePayment(orderId);
    res.json({ status: 'success', message: '請款成功', data: result });
});

export const getLinePayDetails = asyncHandler(async (req: Request, res: Response) => {
    const transactionId = req.query.transactionId as string;
    const orderId = req.query.orderId as string;
    const userId = req.user!.userId;

    const result = await PaymentService.getPaymentDetails({ transactionId, orderId }, userId);

    res.json({
        status: 'success',
        data: result
    });
});