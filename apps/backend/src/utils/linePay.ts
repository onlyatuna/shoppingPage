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

    // --- [關鍵修正] 手動處理 Query String ---
    if (config.params) {
        // 1. 強制轉為 URLSearchParams 字串 (這會產生標準的 %5B%5D 編碼)
        let queryString = '';
        if (config.params instanceof URLSearchParams) {
            queryString = config.params.toString();
        } else {
            queryString = new URLSearchParams(config.params).toString();
        }

        // 2. 手動拼接到 URL 後面
        if (queryString) {
            config.url = `${config.url}?${queryString}`;
        }

        // 3. ⚠️ 清空 params，確保 Axios 不會再次處理它
        config.params = {};
    }

    // 4. 處理 Body (GET 請求強制為空字串)
    let bodyStr = '';
    if (config.method?.toUpperCase() === 'GET') {
        bodyStr = '';
    } else {
        bodyStr = config.data ? JSON.stringify(config.data) : '';
    }

    // 5. 使用最終的 URI (含 Query String) 進行簽章
    const uri = config.url as string;
    const signature = createLinePaySignature(uri, bodyStr, nonce);

    // [Debug Log] 方便除錯
    console.log(`📡 [LINE Pay] ${config.method?.toUpperCase()} ${uri}`);

    config.headers['X-LINE-ChannelId'] = channelId;
    config.headers['X-LINE-Authorization-Nonce'] = nonce;
    config.headers['X-LINE-Authorization'] = signature;

    return config;
});