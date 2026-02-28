import { prisma } from '../utils/prisma';
import { linePayClient } from '../utils/linePay';
import Decimal from 'decimal.js';
import { AppError } from '../utils/appError';
import { StatusCodes } from 'http-status-codes';

/**
 * [SECURITY] Sanitizes and validates LINE Pay transaction ID to prevent SSRF
 * LINE Pay transaction IDs are numeric strings (e.g., "2024121900000000001")
 * @param transactionId - The transaction ID to validate
 * @returns The validated transaction ID
 * @throws Error if transaction ID format is invalid
 */
function sanitizeTransactionId(transactionId: string): string {
    // LINE Pay transaction IDs are 19-20 digit numeric strings
    if (!transactionId || typeof transactionId !== 'string') {
        throw new AppError('Transaction ID is required', StatusCodes.BAD_REQUEST);
    }

    // Remove any whitespace
    const cleaned = transactionId.trim();

    // Validate format: only digits, 15-25 characters (flexible for future changes)
    if (!/^\d{15,25}$/.test(cleaned)) {
        throw new AppError('Invalid transaction ID format', StatusCodes.BAD_REQUEST);
    }

    return cleaned;
}

export class PaymentService {

    /**
     * 🔒 安全計算訂單總金額
     * 使用 Decimal.js 避免 JavaScript 浮點數誤差
     */
    private static calculateTotal(items: { price: number | any; quantity: number }[]): number {
        const total = items.reduce((sum, item) => {
            const price = new Decimal(item.price.toString());
            const qty = new Decimal(item.quantity);
            return sum.plus(price.times(qty));
        }, new Decimal(0));

        return total.round().toNumber();
    }

    // --- 步驟 1: 向 LINE Pay 請求付款 ---
    static async initiateLinePay(orderId: string, userId: number) {
        // 1. 找訂單 (結合 userId 確保擁有權)
        const order = await prisma.order.findFirst({
            where: { id: orderId, userId },
            include: { items: { include: { product: true } } }
        });

        if (!order) throw new AppError('訂單不存在或無權限訪問', StatusCodes.NOT_FOUND);
        if (order.status !== 'PENDING') throw new AppError(`訂單狀態無效: ${order.status}`, StatusCodes.BAD_REQUEST);

        // 2. 建構 Products 列表 (安全性清洗與型別修正)
        const linePayProducts = order.items.map(item => {
            const safePrice = new Decimal(item.price.toString()).round().toNumber();

            // [修正] 從 Prisma JSON 欄位安全提取第一張圖片
            let productImageUrl = '';
            if (Array.isArray(item.product.images) && item.product.images.length > 0) {
                // 強制轉型為 string，避免 TypeScript 報錯
                productImageUrl = String(item.product.images[0]);
            }

            return {
                name: item.product.name.substring(0, 80), // 限制長度符合 API 規範
                quantity: item.quantity,
                price: safePrice,
                imageUrl: productImageUrl // 確保傳入的是字串
            };
        });

        // 3. [關鍵優化] 重算總金額
        const calculatedAmount = this.calculateTotal(linePayProducts);

        // [Security Fix: Order Amount Freeze]
        // Prices might have changed between Cart creation and Payment initiation.
        // We MUST rely ONLY on the initial DB snapshot (`order.totalAmount`) for payment processing,
        // rather than recalculating current product prices which could lead to inconsistencies.
        const dbAmount = new Decimal(order.totalAmount.toString()).toNumber();

        if (calculatedAmount !== dbAmount) {
            console.error(`🚨 [Security Alert] Order ${String(order.id).replace(/\n|\r/g, ' ')} amount discrepancy! Snapshot: ${dbAmount}, Current Calc: ${calculatedAmount}. Halting payment.`);
            throw new AppError(`訂單金額發生變動，請重新建立訂單`, StatusCodes.CONFLICT);
        }

        const packages = [{
            id: order.id,
            amount: dbAmount,
            products: linePayProducts
        }];

        const orderBody = {
            amount: dbAmount,
            currency: 'TWD',
            orderId: order.id,
            packages,
            redirectUrls: {
                confirmUrl: `${process.env.LINE_PAY_RETURN_HOST}${process.env.LINE_PAY_RETURN_CONFIRM_URL}?orderId=${order.id}`,
                cancelUrl: `${process.env.LINE_PAY_RETURN_HOST}${process.env.LINE_PAY_RETURN_CANCEL_URL}`,
            },
        };

        // 4. 打 LINE Pay API
        try {
            // [Security] Validate redirect URLs
            if (!process.env.LINE_PAY_RETURN_HOST) {
                throw new AppError('系統設定錯誤：缺少 LINE_PAY_RETURN_HOST', StatusCodes.INTERNAL_SERVER_ERROR);
            }

            console.log(`[LINE Pay] Initiating request for Order ${String(order.id).replace(/\n|\r/g, ' ')}, Amount: ${dbAmount}`);

            const res = await linePayClient.post('/v3/payments/request', orderBody, {
                timeout: 20000
            });

            if (res.data.returnCode !== '0000') {
                console.error('[LINE Pay Error Details]', {
                    orderId: String(order.id).replace(/\n|\r/g, ' '),
                    returnCode: res.data.returnCode,
                    returnMessage: res.data.returnMessage,
                    info: res.data.info
                });
                throw new AppError(`LINE Pay 拒絕請求 (${res.data.returnCode}, StatusCodes.INTERNAL_SERVER_ERROR): ${res.data.returnMessage}`);
            }

            // 5. 更新 DB
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentId: res.data.info.transactionId.toString(),
                    paymentData: res.data
                }
            });

            return { paymentUrl: res.data.info.paymentUrl.web };

        } catch (error: any) {
            const errorDetail = error.response?.data || error.message;
            console.error('LinePay Request Exception:', String(errorDetail).replace(/\n|\r/g, ' '));

            // 如果是 LINE Pay 回傳的錯誤，直接拋出其訊息
            if (error.response?.data?.returnMessage) {
                throw new AppError(`LINE Pay 錯誤: ${error.response.data.returnMessage}`, StatusCodes.INTERNAL_SERVER_ERROR);
            }

            // 如果是我們自己丟出的「拒絕請求」錯誤，保持原樣
            if (error.message.includes('LINE Pay 拒絕請求')) {
                throw error;
            }

            throw new AppError(`無法發起 LINE Pay 付款: ${error.message}`, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    // --- 步驟 2: 確認付款 (Confirm) ---
    static async confirmLinePay(orderId: string, transactionId: string, userId: number) {
        // [SECURITY] Sanitize transaction ID to prevent SSRF
        const safeTransactionId = sanitizeTransactionId(transactionId);

        // 1. 找訂單 (強制結合 userId 確保擁有權 - 防止 IDOR)
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: userId
            }
        });

        if (!order) throw new AppError('訂單不存在或無權限訪問', StatusCodes.NOT_FOUND);

        // [開發環境容錯]
        if (order.paymentId && order.paymentId !== safeTransactionId) {
            console.warn(`⚠️ Transaction ID Mismatch: Auto-correcting to ${String(safeTransactionId).replace(/\n|\r/g, ' ')}`);
            await prisma.order.update({ where: { id: orderId }, data: { paymentId: safeTransactionId } });
        } else if (!order.paymentId) {
            await prisma.order.update({ where: { id: orderId }, data: { paymentId: safeTransactionId } });
        }

        if (order.status === 'PAID') {
            console.log(`ℹ️ Order ${String(order.id).replace(/\n|\r/g, ' ')} is already PAID.`);
            return order;
        }

        const amount = new Decimal(order.totalAmount.toString()).toNumber();

        try {
            const res = await linePayClient.post(`/v3/payments/${safeTransactionId}/confirm`, {
                amount,
                currency: 'TWD',
            }, {
                timeout: 40000 // 文件建議: 40s
            });

            if (res.data.returnCode !== '0000') {
                // 1172: 重複交易視為成功
                if (res.data.returnCode === '1172') {
                    console.log('⚠️ [Idempotency] LINE Pay returned 1172. Treating as success.');
                } else {
                    console.error('LINE Pay Confirm Failed:', String(JSON.stringify(res.data)).replace(/\n|\r/g, ' '));
                    throw new AppError(`LINE Pay Confirm Error: ${res.data.returnMessage}`, StatusCodes.INTERNAL_SERVER_ERROR);
                }
            }

            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID',
                    paymentData: res.data
                }
            });

            return updatedOrder;

        } catch (error: any) {
            console.error('LinePay Confirm Exception:', String(error.response?.data || error.message).replace(/\n|\r/g, ' '));
            if (error.message.includes('LINE Pay Confirm Error')) {
                throw error;
            }
            throw new AppError('LINE Pay 確認失敗', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    // --- 步驟 3: 請款 (Capture) ---
    static async capturePayment(orderId: string) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || !order.paymentId) throw new AppError('訂單無效', StatusCodes.BAD_REQUEST);
        if (order.status !== 'AUTHORIZED') throw new AppError('狀態非 AUTHORIZED', StatusCodes.BAD_REQUEST);

        const amount = new Decimal(order.totalAmount.toString()).toNumber();

        try {
            const res = await linePayClient.post(`/v3/payments/authorizations/${order.paymentId}/capture`, {
                amount,
                currency: 'TWD',
            }, {
                timeout: 60000 // 文件建議: 60s
            });

            if (res.data.returnCode !== '0000') {
                if (res.data.returnCode === '1172') {
                    console.log(`⚠️ Capture 1172 (Duplicate). Treating as success.`);
                } else {
                    throw new AppError(`Capture Error: ${res.data.returnMessage}`, StatusCodes.INTERNAL_SERVER_ERROR);
                }
            }

            return await prisma.order.update({
                where: { id: orderId },
                data: { status: 'PAID', paymentData: res.data }
            });

        } catch (error: any) {
            console.error('LinePay Capture Exception:', String(error.response?.data || error.message).replace(/\n|\r/g, ' '));
            throw new AppError('請款失敗', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    // --- 查詢狀態與明細 ---
    static async checkPaymentStatus(transactionId: string, userId: number) {
        // [SECURITY] Sanitize transaction ID to prevent SSRF
        const safeTransactionId = sanitizeTransactionId(transactionId);

        // [SECURITY] Verify ownership before querying Line Pay (IDOR Protection)
        const orderInfo = await prisma.order.findFirst({
            where: { paymentId: safeTransactionId, userId }
        });
        if (!orderInfo) {
            throw new AppError('交易不存在或無權限存取', StatusCodes.FORBIDDEN);
        }

        try {
            const res = await linePayClient.get(`/v3/payments/requests/${safeTransactionId}/check`, {
                timeout: 20000
            });
            return res.data;
        } catch (error: any) {
            console.error('Check Status Error:', String(error.message).replace(/\n|\r/g, ' '));
            throw new AppError('無法查詢付款狀態', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    static async getPaymentDetails(params: { transactionId?: string; orderId?: string }, userId: number) {
        if (!params.transactionId && !params.orderId) throw new AppError('需提供 ID', StatusCodes.BAD_REQUEST);

        // [SECURITY] Verify ownership before querying Line Pay (IDOR Protection)
        const ownedOrder = await prisma.order.findFirst({
            where: {
                userId,
                ...(params.orderId ? { id: params.orderId } : {}),
                ...(params.transactionId ? { paymentId: params.transactionId } : {})
            }
        });

        if (!ownedOrder) throw new AppError('訂單不存在或無權限訪問', StatusCodes.NOT_FOUND);

        try {
            const queryParams: any = {};
            if (params.transactionId) {
                queryParams['transactionId'] = sanitizeTransactionId(params.transactionId);
            }
            if (params.orderId) {
                queryParams['orderId'] = params.orderId;
            }

            // 維持 params 傳遞以確保 HMAC 簽章正確
            const res = await linePayClient.get('/v3/payments', {
                params: queryParams,
                timeout: 20000
            });

            if (res.data.returnCode !== '0000') {
                console.error('[LINE Pay Details Error Response]', String(JSON.stringify(res.data)).replace(/\n|\r/g, ' '));
                throw new AppError(res.data.returnMessage, StatusCodes.INTERNAL_SERVER_ERROR);
            }
            return res.data.info;
        } catch (error: any) {
            const errorDetail = error.response?.data || error.message;
            console.error('Get Details Error:', String(errorDetail).replace(/\n|\r/g, ' '));
            throw error;
        }
    }

    // --- [補完] 退款 (Refund) ---
    // 適用情境：訂單狀態為 PAID，需要退還款項給用戶
    static async refundPayment(orderId: string, refundAmount?: number) {
        // 1. 驗證訂單
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || !order.paymentId) throw new AppError('訂單不存在或無交易編號', StatusCodes.NOT_FOUND);

        // 只有已付款的訂單才能退款
        if (order.status !== 'PAID') {
            throw new AppError(`無法退款：訂單狀態為 ${order.status}`, StatusCodes.BAD_REQUEST);
        }

        // 2. 處理金額 (Decimal.js)
        // 如果沒傳 refundAmount，預設為全額退款
        const amount = refundAmount
            ? new Decimal(refundAmount).toNumber()
            : undefined; // undefined 代表全額退款

        // 防呆：退款金額不可大於訂單總額
        if (amount && amount > new Decimal(order.totalAmount.toString()).toNumber()) {
            throw new AppError('退款金額不可大於訂單總額', StatusCodes.BAD_REQUEST);
        }

        try {
            // POST /v3/payments/{transactionId}/refund
            const res = await linePayClient.post(`/v3/payments/${order.paymentId}/refund`, {
                refundAmount: amount
            });

            if (res.data.returnCode !== '0000') {
                // 1198: Request is already refunded (重複退款視為成功)
                if (res.data.returnCode === '1198') {
                    console.log(`⚠️ Order ${String(order.id).replace(/\n|\r/g, ' ')} already refunded (1198).`);
                } else {
                    throw new AppError(`Refund Failed: ${res.data.returnMessage}`, StatusCodes.INTERNAL_SERVER_ERROR);
                }
            }

            // 3. 更新 DB 狀態
            // 若是全額退款，狀態改為 REFUNDED；部分退款則視業務邏輯而定 (這裡示範全額)
            const newStatus = (!amount || amount === new Decimal(order.totalAmount.toString()).toNumber())
                ? 'REFUNDED'
                : 'PARTIALLY_REFUNDED'; // 需確認您的 Enum 是否支援此狀態

            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: newStatus as any, // 轉型以配合您的 Enum
                    paymentData: res.data // 更新最新的退款紀錄
                }
            });

            return res.data.info;

        } catch (error: any) {
            console.error('LinePay Refund Exception:', String(error.response?.data || error.message).replace(/\n|\r/g, ' '));
            throw new AppError('退款失敗', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    // --- [補完] 取消授權 (Void) ---
    // 適用情境：訂單狀態為 AUTHORIZED (尚未請款)，管理者決定取消訂單
    static async voidAuthorization(orderId: string) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || !order.paymentId) throw new AppError('訂單無效', StatusCodes.BAD_REQUEST);

        if (order.status !== 'AUTHORIZED') {
            throw new AppError(`只有 AUTHORIZED 狀態的訂單可以執行 Void (目前: ${order.status})`, StatusCodes.BAD_REQUEST);
        }

        try {
            // POST /v3/payments/authorizations/{transactionId}/void
            const res = await linePayClient.post(`/v3/payments/authorizations/${order.paymentId}/void`, {});

            if (res.data.returnCode !== '0000') {
                throw new AppError(`Void Failed: ${res.data.returnMessage}`, StatusCodes.INTERNAL_SERVER_ERROR);
            }

            // 更新狀態為 CANCELLED
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    paymentData: res.data
                }
            });

            return res.data;

        } catch (error: any) {
            console.error('LinePay Void Exception:', String(error.response?.data || error.message).replace(/\n|\r/g, ' '));
            throw new AppError('取消授權失敗', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}