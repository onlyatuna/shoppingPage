import crypto from 'crypto';
import axios from 'axios';

export const linePayClient = axios.create({
    baseURL: process.env.LINE_PAY_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export function createLinePaySignature(uri: string, bodyStr: string, nonce: string) {
    const channelSecret = process.env.LINE_PAY_CHANNEL_SECRET as string;
    const encryptText = `${channelSecret}${uri}${bodyStr}${nonce}`;

    const signature = crypto
        .createHmac('sha256', channelSecret)
        .update(encryptText)
        .digest('base64');

    return signature;
}

linePayClient.interceptors.request.use((config) => {
    const nonce = crypto.randomUUID();
    const channelId = process.env.LINE_PAY_CHANNEL_ID as string;

    // --- [修正] 處理 Query String (標準編碼模式) ---
    if (config.params) {
        let queryString = '';

        // 1. 統一轉成 URLSearchParams 字串 (這會自動把 [] 轉成 %5B%5D)
        if (config.params instanceof URLSearchParams) {
            queryString = config.params.toString();
        } else {
            queryString = new URLSearchParams(config.params).toString();
        }

        // 2. [關鍵] 不要 replace！保留 %5B%5D
        // 這樣簽章用的字串就是標準編碼格式
        if (queryString) {
            config.url = `${config.url}?${queryString}`;
        }

        // 3. 清空 params，確保 Axios 不會再次處理，直接發送我們組好的 config.url
        config.params = {};
    }

    const bodyStr = config.data ? JSON.stringify(config.data) : '';
    const uri = config.url as string;

    const signature = createLinePaySignature(uri, bodyStr, nonce);

    config.headers['X-LINE-ChannelId'] = channelId;
    config.headers['X-LINE-Authorization-Nonce'] = nonce;
    config.headers['X-LINE-Authorization'] = signature;

    return config;
});