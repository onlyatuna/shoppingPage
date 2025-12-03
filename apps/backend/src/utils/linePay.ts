import crypto from 'crypto';
import axios from 'axios';

export const linePayClient = axios.create({
    baseURL: process.env.LINE_PAY_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * 產生 LINE Pay HMAC-SHA256 簽章
 * @param uri 請求路徑 (包含 Query String)
 * @param bodyStr 請求內容 (JSON 字串，GET 時為空字串)
 * @param nonce 隨機數
 */
export function createLinePaySignature(uri: string, bodyStr: string, nonce: string) {
    const channelSecret = process.env.LINE_PAY_CHANNEL_SECRET as string;
    const encryptText = `${channelSecret}${uri}${bodyStr}${nonce}`;

    const signature = crypto
        .createHmac('sha256', channelSecret)
        .update(encryptText)
        .digest('base64');

    return signature;
}

// Axios Interceptor: 自動加上簽章 Header
linePayClient.interceptors.request.use((config) => {
    const nonce = crypto.randomUUID();
    const channelId = process.env.LINE_PAY_CHANNEL_ID as string;

    // 1. 處理 URI (如果有 params，要拼接到 url 後面)
    let uri = config.url as string;
    if (config.params) {
        // 使用 URLSearchParams 確保編碼與送出的一致
        const searchParams = new URLSearchParams(config.params);
        const queryString = searchParams.toString();
        if (queryString) {
            uri += `?${queryString}`;
        }
    }

    // 2. 處理 Body (GET 請求 body 為空字串，POST 為 JSON)
    const bodyStr = config.data ? JSON.stringify(config.data) : '';

    // 3. 計算簽章
    const signature = createLinePaySignature(uri, bodyStr, nonce);

    // 4. 設定 Header
    config.headers['X-LINE-ChannelId'] = channelId;
    config.headers['X-LINE-Authorization-Nonce'] = nonce;
    config.headers['X-LINE-Authorization'] = signature;

    return config;
});