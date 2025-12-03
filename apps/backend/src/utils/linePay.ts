import crypto from 'crypto';
import axios from 'axios';

export const linePayClient = axios.create({
    baseURL: process.env.LINE_PAY_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // 防止 Axios 自動對 params 進行編碼，我們在攔截器自己處理
    paramsSerializer: {
        encode: (params) => {
            return params.toString();
        }
    }
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

    // --- [關鍵修正] 處理 Query String ---
    if (config.params) {
        let queryString = '';

        // 判斷傳進來的是不是已經是 URLSearchParams 物件
        if (config.params instanceof URLSearchParams) {
            queryString = config.params.toString();
        } else {
            // 如果是普通物件，轉成 URLSearchParams 字串
            queryString = new URLSearchParams(config.params).toString();
        }

        if (queryString) {
            // 手動拼接到 URL 後面
            config.url = `${config.url}?${queryString}`;
        }

        // ⚠️ 非常重要：清空 params
        // 這樣 Axios 就不會再次處理它，確保送出的 URL 跟我們簽章的一模一樣
        config.params = {};
    }

    const bodyStr = config.data ? JSON.stringify(config.data) : '';
    const uri = config.url as string; // 這時候 uri 已經包含 query string 了

    const signature = createLinePaySignature(uri, bodyStr, nonce);

    config.headers['X-LINE-ChannelId'] = channelId;
    config.headers['X-LINE-Authorization-Nonce'] = nonce;
    config.headers['X-LINE-Authorization'] = signature;

    return config;
});