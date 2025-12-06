import { prisma } from '../utils/prisma';
import { linePayClient } from '../utils/linePay';
import Decimal from 'decimal.js'; 

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
        // 1. 找訂單
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } }
        });

        if (!order || order.userId !== userId) throw new Error('訂單不存在或無權限訪問');
        if (order.status !== 'PENDING') throw new Error(`訂單狀態無效: ${order.status}`);

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

        // [Security Log] 檢查金額是否一致
        const dbAmount = new Decimal(order.totalAmount.toString()).toNumber();
        if (calculatedAmount !== dbAmount) {
            console.warn(`⚠️ [Security Alert] 訂單 ${orderId} 金額不一致! DB: ${dbAmount}, Calc: ${calculatedAmount}`);
        }

        const packages = [{
            id: order.id,
            amount: calculatedAmount,
            products: linePayProducts
        }];

        const orderBody = {
            amount: calculatedAmount,
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
            console.log(`[LINE Pay] Initiating request for Order ${orderId}, Amount: ${calculatedAmount}`);

            // 建議 Request API 也加入 10~20s 超時設定 (文件建議至少10s)
            const res = await linePayClient.post('/v3/payments/request', orderBody, {
                timeout: 20000
            });

            if (res.data.returnCode !== '0000') {
                console.error('[LINE Pay Error]', res.data);
                throw new Error(`LINE Pay Refused: ${res.data.returnMessage}`);
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
            console.error('LinePay Request Exception:', error.response?.data || error.message);
            throw new Error('無法發起 LINE Pay 付款');
        }
    }

    // --- 步驟 2: 確認付款 (Confirm) ---
    static async confirmLinePay(orderId: string, transactionId: string) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new Error('訂單不存在');

        // [開發環境容錯]
        if (order.paymentId && order.paymentId !== transactionId) {
            console.warn(`⚠️ Transaction ID Mismatch: Auto-correcting to ${transactionId}`);
            await prisma.order.update({ where: { id: orderId }, data: { paymentId: transactionId } });
        } else if (!order.paymentId) {
            await prisma.order.update({ where: { id: orderId }, data: { paymentId: transactionId } });
        }

        if (order.status === 'PAID') {
            console.log(`ℹ️ Order ${orderId} is already PAID.`);
            return order;
        }

        const amount = new Decimal(order.totalAmount.toString()).toNumber();

        try {
            const res = await linePayClient.post(`/v3/payments/${transactionId}/confirm`, {
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
                    console.error('LINE Pay Confirm Failed:', res.data);
                    throw new Error(`LINE Pay Confirm Error: ${res.data.returnMessage}`);
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
            console.error('LinePay Confirm Exception:', error.response?.data || error.message);
            if (error.message.includes('LINE Pay Confirm Error')) {
                throw error;
            }
            throw new Error('LINE Pay 確認失敗');
        }
    }

    // --- 步驟 3: 請款 (Capture) ---
    static async capturePayment(orderId: string) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || !order.paymentId) throw new Error('訂單無效');
        if (order.status !== 'AUTHORIZED') throw new Error('狀態非 AUTHORIZED');

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
                    throw new Error(`Capture Error: ${res.data.returnMessage}`);
                }
            }

            return await prisma.order.update({
                where: { id: orderId },
                data: { status: 'PAID', paymentData: res.data }
            });

        } catch (error: any) {
            console.error('LinePay Capture Exception:', error.response?.data || error.message);
            throw new Error('請款失敗');
        }
    }

    // --- 查詢狀態與明細 ---
    static async checkPaymentStatus(transactionId: string) {
        try {
            const res = await linePayClient.get(`/v3/payments/requests/${transactionId}/check`, {
                timeout: 20000
            });
            return res.data;
        } catch (error: any) {
            console.error('Check Status Error:', error.message);
            throw new Error('無法查詢付款狀態');
        }
    }

    static async getPaymentDetails(params: { transactionId?: string; orderId?: string }) {
        if (!params.transactionId && !params.orderId) throw new Error('需提供 ID');
        try {
            const queryParams: any = {};
            if (params.transactionId) queryParams['transactionId[]'] = params.transactionId;
            if (params.orderId) queryParams['orderId[]'] = params.orderId;

            // 維持 params 傳遞以確保 HMAC 簽章正確
            const res = await linePayClient.get('/v3/payments', {
                params: queryParams,
                timeout: 20000
            });

            if (res.data.returnCode !== '0000') throw new Error(res.data.returnMessage);
            return res.data.info;
        } catch (error: any) {
            console.error('Get Details Error:', error.message);
            throw error;
        }
    }

    // --- [補完] 退款 (Refund) ---
    // 適用情境：訂單狀態為 PAID，需要退還款項給用戶
    static async refundPayment(orderId: string, refundAmount?: number) {
        // 1. 驗證訂單
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || !order.paymentId) throw new Error('訂單不存在或無交易編號');
        
        // 只有已付款的訂單才能退款
        if (order.status !== 'PAID') {
            throw new Error(`無法退款：訂單狀態為 ${order.status}`);
        }

        // 2. 處理金額 (Decimal.js)
        // 如果沒傳 refundAmount，預設為全額退款
        const amount = refundAmount 
            ? new Decimal(refundAmount).toNumber() 
            : undefined; // undefined 代表全額退款

        // 防呆：退款金額不可大於訂單總額
        if (amount && amount > new Decimal(order.totalAmount.toString()).toNumber()) {
            throw new Error('退款金額不可大於訂單總額');
        }

        try {
            // POST /v3/payments/{transactionId}/refund
            const res = await linePayClient.post(`/v3/payments/${order.paymentId}/refund`, {
                refundAmount: amount 
            });

            if (res.data.returnCode !== '0000') {
                // 1198: Request is already refunded (重複退款視為成功)
                if (res.data.returnCode === '1198') {
                     console.log(`⚠️ Order ${orderId} already refunded (1198).`);
                } else {
                    throw new Error(`Refund Failed: ${res.data.returnMessage}`);
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
            console.error('LinePay Refund Exception:', error.response?.data || error.message);
            throw new Error('退款失敗');
        }
    }

    // --- [補完] 取消授權 (Void) ---
    // 適用情境：訂單狀態為 AUTHORIZED (尚未請款)，管理者決定取消訂單
    static async voidAuthorization(orderId: string) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || !order.paymentId) throw new Error('訂單無效');

        if (order.status !== 'AUTHORIZED') {
            throw new Error(`只有 AUTHORIZED 狀態的訂單可以執行 Void (目前: ${order.status})`);
        }

        try {
            // POST /v3/payments/authorizations/{transactionId}/void
            const res = await linePayClient.post(`/v3/payments/authorizations/${order.paymentId}/void`, {});

            if (res.data.returnCode !== '0000') {
                 throw new Error(`Void Failed: ${res.data.returnMessage}`);
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
            console.error('LinePay Void Exception:', error.response?.data || error.message);
            throw new Error('取消授權失敗');
        }
    }
}