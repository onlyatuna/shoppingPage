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
        let queryString = '';

        // 1. 產生 Query String
        if (config.params instanceof URLSearchParams) {
            queryString = config.params.toString();
        } else {
            queryString = new URLSearchParams(config.params).toString();
        }

        // 2. [重要] 把編碼過的括號轉回來 (%5B -> [, %5D -> ])
        // LINE Pay 簽章通常預期看到原始的 []
        queryString = queryString
            .replace(/%5B/g, '[')
            .replace(/%5D/g, ']');

        if (queryString) {
            // 3. 手動拼接到 URL
            config.url = `${config.url}?${queryString}`;
        }

        // 4. 清空 params，阻止 Axios 再次處理
        config.params = {};
    }

    const bodyStr = config.data ? JSON.stringify(config.data) : '';

    // 5. 使用處理過的 config.url (已包含 query string) 進行簽章
    const signature = createLinePaySignature(config.url as string, bodyStr, nonce);

    config.headers['X-LINE-ChannelId'] = channelId;
    config.headers['X-LINE-Authorization-Nonce'] = nonce;
    config.headers['X-LINE-Authorization'] = signature;

    return config;
});