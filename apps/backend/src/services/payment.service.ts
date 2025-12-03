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

        // 2. 建構 Products 列表 (並做防呆處理)
        const linePayProducts = order.items.map(item => ({
            name: item.product.name.substring(0, 80), // 截斷名稱，防止過長導致 API 錯誤
            quantity: item.quantity,
            price: parseInt(item.price.toString()), // 確保是整數
        }));

        // 3. [關鍵優化] 重新計算總金額
        // LINE Pay 要求：amount 必須嚴格等於所有 product (price * quantity) 的總和
        // 我們不直接用 order.totalAmount，而是重新算一次，避免資料庫小數點誤差導致 1106 錯誤
        const calculatedAmount = linePayProducts.reduce((sum, product) => {
            return sum + (product.price * product.quantity);
        }, 0);

        const packages = [{
            id: order.id,
            amount: calculatedAmount,
            products: linePayProducts
        }];

        const orderBody = {
            amount: calculatedAmount,
            currency: 'TWD',
            orderId: order.id, // 商店的訂單編號
            packages,
            redirectUrls: {
                confirmUrl: `${process.env.LINE_PAY_RETURN_HOST}${process.env.LINE_PAY_RETURN_CONFIRM_URL}?orderId=${order.id}`,
                cancelUrl: `${process.env.LINE_PAY_RETURN_HOST}${process.env.LINE_PAY_RETURN_CANCEL_URL}`,
            },
        };

        // 4. 打 LINE Pay API
        try {
            // Debug 用：印出送出的資料，方便出錯時檢查
            console.log('🔵 LINE Pay Request Body:', JSON.stringify(orderBody, null, 2));

            const res = await linePayClient.post('/v3/payments/request', orderBody);

            if (res.data.returnCode !== '0000') {
                console.error('LINE Pay Response Error:', res.data);
                throw new Error(`LINE Pay Error: ${res.data.returnMessage}`);
            }

            // 5. 暫存 transactionId
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentId: res.data.info.transactionId.toString(),
                    paymentData: res.data
                }
            });

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

        // [開發環境容錯] ID 不符時自動修正
        if (order.paymentId && order.paymentId !== transactionId) {
            console.warn(`⚠️ 交易編號不符 (可能是重複請求導致): DB=${order.paymentId}, Req=${transactionId}`);
            console.warn('👉 將強制使用當前請求的 Transaction ID 進行確認');

            await prisma.order.update({
                where: { id: orderId },
                data: { paymentId: transactionId }
            });
        }
        else if (!order.paymentId) {
            await prisma.order.update({
                where: { id: orderId },
                data: { paymentId: transactionId }
            });
        }

        // 冪等性檢查
        if (order.status === 'PAID') return order;

        const amount = parseInt(order.totalAmount.toString());

        // 2. 打 LINE Pay Confirm API
        try {
            const res = await linePayClient.post(`/v3/payments/${transactionId}/confirm`, {
                amount,
                currency: 'TWD',
            }, {
                timeout: 40000 // [修改] 官方建議 Confirm 至少 40秒
            });

            // 處理 LINE Pay 回傳結果
            if (res.data.returnCode !== '0000') {
                // 如果是 1172 (已付款)，我們不拋錯，而是繼續往下執行「更新 DB 狀態」
                // 這樣能確保即使第一次請求超時，第二次重試也能正確把 DB 改成 PAID
                if (res.data.returnCode === '1172') {
                    console.log('⚠️ LINE Pay 提示已付款過 (1172)，視為成功，繼續更新訂單狀態...');
                } else {
                    console.error('LINE Pay Confirm Failed:', res.data);
                    throw new Error(`LINE Pay Confirm Error: ${res.data.returnMessage}`);
                }
            }

            // 3. 更新訂單狀態為 PAID
            // 無論是 0000 還是 1172，只要到了這一步，都代表錢已經付了，必須更新 DB
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID',
                    paymentData: res.data // 更新最新的付款資訊
                }
            });

            return updatedOrder;

        } catch (error: any) {
            console.error('LinePay Confirm Logic Error:', error.response?.data || error.message);
            if (error.message.includes('LINE Pay Confirm Error')) {
                throw error;
            }
            throw new Error('LINE Pay 確認失敗');
        }
    }

    // --- 步驟 3: 請款 (Capture) ---
    // 僅在使用「分開請款」模式時需要呼叫此 API
    static async capturePayment(orderId: string) {
        // 1. 找訂單
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new Error('訂單不存在');
        if (!order.paymentId) throw new Error('無交易編號');

        // 只有狀態是 AUTHORIZED 的訂單才需要執行 Capture
        // (請確保你的 prisma schema 有加入 AUTHORIZED 狀態)
        if (order.status !== 'AUTHORIZED') {
            throw new Error(`訂單狀態非 AUTHORIZED，無法請款 (目前狀態: ${order.status})`);
        }

        const amount = parseInt(order.totalAmount.toString());

        // 2. 打 LINE Pay Capture API
        try {
            // POST /v3/payments/authorizations/{transactionId}/capture
            const res = await linePayClient.post(`/v3/payments/authorizations/${order.paymentId}/capture`, {
                amount,
                currency: 'TWD',
            }, {
                timeout: 60000 // [重要] 官方建議 Capture 至少 60秒
            });

            if (res.data.returnCode !== '0000') {
                // 1172 代表已請款過，視為成功
                if (res.data.returnCode === '1172') {
                    console.log(`⚠️ 訂單 ${orderId} 重複請款 (1172)，視為成功`);
                } else {
                    throw new Error(`LINE Pay Capture Error: ${res.data.returnMessage}`);
                }
            }

            // 3. 更新為 PAID
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID', // 真正收到錢了
                    paymentData: res.data // 更新最新的交易資訊
                }
            });

            return updatedOrder;

        } catch (error: any) {
            console.error('LinePay Capture Error:', error.response?.data || error.message);
            throw new Error('請款失敗');
        }
    }

    // --- [新增] 查詢付款狀態 ---
    static async checkPaymentStatus(transactionId: string) {
        try {
            // LINE Pay API: GET /v3/payments/requests/{transactionId}/check
            const res = await linePayClient.get(`/v3/payments/requests/${transactionId}/check`, {
                timeout: 20000, // 官方建議：Read Timeout 至少 20 秒
            });

            // 回傳完整的 LINE Pay 回應 (包含 returnCode 和 returnMessage)
            return res.data;

        } catch (error: any) {
            console.error('Check Status Error:', error.response?.data || error.message);
            throw new Error('無法查詢付款狀態');
        }
    }

    // --- [新增] 查詢付款明細 (Get Payment Details) ---
    /**
     * 查詢已授權或已請款的交易明細
     * @param params 包含 transactionId 或 orderId (至少擇一)
     */
    static async getPaymentDetails(params: { transactionId?: string; orderId?: string }) {
        if (!params.transactionId && !params.orderId) {
            throw new Error('查詢參數錯誤：必須提供 transactionId 或 orderId');
        }

        try {
            // [關鍵] 自己手動拼接 URL
            let url = '/v3/payments';
            const queryParts: string[] = [];

            if (params.transactionId) {
                // LINE Pay 要求 [] 不編碼
                queryParts.push(`transactionId[]=${params.transactionId}`);
            }
            if (params.orderId) {
                queryParts.push(`orderId[]=${params.orderId}`);
            }

            if (queryParts.length > 0) {
                url += `?${queryParts.join('&')}`;
            }

            // 直接呼叫拼接好的 URL，不使用 params
            const res = await linePayClient.get(url, {
                timeout: 20000,
            });

            if (res.data.returnCode !== '0000') {
                throw new Error(`LINE Pay 查詢失敗: ${res.data.returnMessage}`);
            }

            return res.data.info;

        } catch (error: any) {
            console.error('Get Payment Details Error:', error.response?.data || error.message);
            throw error;
        }
    }
}