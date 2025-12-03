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

    // 1. 處理 URI 與 Query String
    // [關鍵修正] 我們手動把 params 拼接到 url，並清空 params
    // 這樣可以確保 Axios 發送的網址跟我們簽章的網址 100% 一致
    let uri = config.url as string;

    if (config.params) {
        const searchParams = new URLSearchParams(config.params);
        const queryString = searchParams.toString();

        if (queryString) {
            // 將 Query String 拼接到 URI
            uri += `?${queryString}`;
        }

        // [重要] 更新 config.url 並清空 params
        // 這樣 Axios 就不會再對 params 做二次處理
        config.url = uri;
        config.params = {};
    }

    // 2. 處理 Body (GET 請求 body 為空字串，POST 為 JSON)
    const bodyStr = config.data ? JSON.stringify(config.data) : '';

    // 3. 計算簽章 (使用最終的 uri)
    const signature = createLinePaySignature(uri, bodyStr, nonce);

    // 4. 設定 Header
    config.headers['X-LINE-ChannelId'] = channelId;
    config.headers['X-LINE-Authorization-Nonce'] = nonce;
    config.headers['X-LINE-Authorization'] = signature;

    return config;
});