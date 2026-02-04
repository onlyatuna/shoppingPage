//payment.controller.ts
import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { StatusCodes } from 'http-status-codes';

export const requestLinePay = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { orderId } = req.body; // 前端傳來要付哪張單
        const result = await PaymentService.initiateLinePay(orderId, userId);
        res.json({ status: 'success', data: result });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

export const confirmLinePay = async (req: Request, res: Response) => {
    try {
        console.log('💰 [Confirm Payment] Body:', req.body);
        const { transactionId, orderId } = req.body;
        const userId = req.user!.userId; // 從 JWT Token 取得使用者 ID

        // 簡單防呆
        if (!transactionId || !orderId) {
            throw new Error(`缺少參數: transactionId=${transactionId}, orderId=${orderId}`);
        }

        // 驗證使用者權限並確認付款
        await PaymentService.confirmLinePay(orderId, transactionId, userId);
        res.json({ status: 'success', message: '付款成功' });
    } catch (error: any) {
        console.error('❌ [Confirm Error]:', error.message);
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

export const checkLinePayStatus = async (req: Request, res: Response) => {
    try {
        const { transactionId } = req.params;

        if (!transactionId) {
            throw new Error('缺少 transactionId');
        }

        const result = await PaymentService.checkPaymentStatus(transactionId);

        res.json({
            status: 'success',
            data: result
        });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

export const captureLinePay = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;
        if (!orderId) throw new Error('缺少 orderId');

        const result = await PaymentService.capturePayment(orderId);
        res.json({ status: 'success', message: '請款成功', data: result });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

// --- [新增] 查詢付款明細 ---
export const getLinePayDetails = async (req: Request, res: Response) => {
    try {
        // 從 Query String 取得參數
        // 例如: /api/v1/payment/line-pay/details?orderId=uuid...
        const transactionId = req.query.transactionId as string;
        const orderId = req.query.orderId as string;

        const result = await PaymentService.getPaymentDetails({ transactionId, orderId });

        res.json({
            status: 'success',
            data: result
        });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};