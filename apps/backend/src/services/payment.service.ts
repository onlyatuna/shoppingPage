import { prisma } from '../utils/prisma';
import { linePayClient } from '../utils/linePay';

export class PaymentService {

    // --- 步驟 1: 向 LINE Pay 請求付款 ---
    static async initiateLinePay(orderId: string, userId: number) {
        // 1. 找訂單
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } }
        });

        if (!order || order.userId !== userId) throw new Error('訂單不存在');
        if (order.status !== 'PENDING') throw new Error('訂單狀態不正確');

        // 2. 組合 LINE Pay 需要的 Request Body
        // 注意：amount 必須是整數
        const amount = parseInt(order.totalAmount.toString());

        const packages = [{
            id: order.id,
            amount: amount,
            products: order.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: parseInt(item.price.toString()),
            }))
        }];

        const orderBody = {
            amount,
            currency: 'TWD',
            orderId: order.id, // 商店的訂單編號
            packages,
            redirectUrls: {
                confirmUrl: `${process.env.LINE_PAY_RETURN_HOST}${process.env.LINE_PAY_RETURN_CONFIRM_URL}?orderId=${order.id}`,
                cancelUrl: `${process.env.LINE_PAY_RETURN_HOST}${process.env.LINE_PAY_RETURN_CANCEL_URL}`,
            },
        };

        // 3. 打 LINE Pay API
        try {
            const res = await linePayClient.post('/v3/payments/request', orderBody);

            if (res.data.returnCode !== '0000') {
                throw new Error(`LINE Pay Error: ${res.data.returnMessage}`);
            }

            // 4. 重要：暫存 transactionId 到資料庫 (Confirm 時會用到)
            // 此時訂單狀態還是 PENDING，但多了一個 paymentId
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentId: res.data.info.transactionId.toString(),
                    paymentData: res.data // 存 log
                }
            });

            // 回傳跳轉網址給前端
            return { paymentUrl: res.data.info.paymentUrl.web };

        } catch (error: any) {
            console.error('LinePay Request Error:', error.response?.data || error.message);
            throw new Error('無法發起 LINE Pay 付款');
        }
    }

    // --- 步驟 2: 確認付款 (Confirm) ---
    static async confirmLinePay(orderId: string, transactionId: string) {
        // 1. 找訂單
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new Error('訂單不存在');

        if (order.paymentId && order.paymentId !== transactionId) {
            console.warn(`⚠️ 交易編號不符 (可能是重複請求導致): DB=${order.paymentId}, Req=${transactionId}`);
            console.warn('👉 將強制使用當前請求的 Transaction ID 進行確認');

            // 強制更新 DB 為當前的 ID，讓流程可以跑下去
            await prisma.order.update({
                where: { id: orderId },
                data: { paymentId: transactionId }
            });
        }
        // 如果是 null，也補填進去
        else if (!order.paymentId) {
            await prisma.order.update({
                where: { id: orderId },
                data: { paymentId: transactionId }
            });
        }

        // 如果資料庫已經紀錄為 PAID，直接回傳成功 (冪等性)
        if (order.status === 'PAID') return order;

        const amount = parseInt(order.totalAmount.toString());

        // 2. 打 LINE Pay Confirm API
        try {
            const res = await linePayClient.post(`/v3/payments/${transactionId}/confirm`, {
                amount,
                currency: 'TWD',
            });

            // [修改重點開始] -------------------------------------------------
            if (res.data.returnCode !== '0000') {
                // 👇👇👇 必須有這段 👇👇👇
                if (res.data.returnCode === '1172') {
                    console.log('⚠️ LINE Pay 提示已付款過 (1172)，視為成功');
                    return order;
                }
                // 👆👆👆 必須有這段 👆👆👆

                throw new Error(`LINE Pay Confirm Error: ${res.data.returnMessage}`);
            }
            // [修改重點結束] -------------------------------------------------

            // 3. 更新訂單狀態為 PAID
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID',
                    paymentData: res.data // 更新最新的付款資訊
                }
            });

            return updatedOrder;

        } catch (error: any) {
            // 印出詳細錯誤以便除錯
            console.error('LinePay Confirm Logic Error:', error.response?.data || error.message);
            // 如果是我們自己拋出的 Error，直接往上拋
            if (error.message.includes('LINE Pay Confirm Error')) {
                throw error;
            }
            throw new Error('LINE Pay 確認失敗');
        }
    }
}