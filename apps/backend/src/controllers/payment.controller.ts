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

        // 簡單防呆
        if (!transactionId || !orderId) {
            throw new Error(`缺少參數: transactionId=${transactionId}, orderId=${orderId}`);
        }

        // 這裡不需要 userId 驗證，因為是 Callback，只要 transactionId 對就好
        // 或是你可以加上 auth middleware 確保是用戶本人觸發
        await PaymentService.confirmLinePay(orderId, transactionId);
        res.json({ status: 'success', message: '付款成功' });
    } catch (error: any) {
        console.error('❌ [Confirm Error]:', error.message); // 這行會告訴你真正的錯誤
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};