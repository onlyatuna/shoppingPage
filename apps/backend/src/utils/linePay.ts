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

    // 1. 處理 Query String
    if (config.params) {
        let queryString = '';
        if (config.params instanceof URLSearchParams) {
            queryString = config.params.toString();
        } else {
            queryString = new URLSearchParams(config.params).toString();
        }

        if (queryString) {
            config.url = `${config.url}?${queryString}`;
        }
        config.params = {};
    }

    // 2. [關鍵修正] 處理 Body
    // 如果是 GET，強制 bodyStr 為空字串，不管 config.data 是什麼
    let bodyStr = '';
    if (config.method?.toUpperCase() === 'GET') {
        bodyStr = '';
    } else {
        bodyStr = config.data ? JSON.stringify(config.data) : '';
    }

    const uri = config.url as string;
    const signature = createLinePaySignature(uri, bodyStr, nonce);

    // [Debug Log] 印出簽名細節，方便除錯
    console.log('🔍 [LINE Pay Sign Debug]');
    console.log(`   Method: ${config.method?.toUpperCase()}`);
    console.log(`   URI: ${uri}`);
    console.log(`   Body: '${bodyStr}'`); // 檢查這裡是不是空的
    console.log(`   Nonce: ${nonce}`);

    config.headers['X-LINE-ChannelId'] = channelId;
    config.headers['X-LINE-Authorization-Nonce'] = nonce;
    config.headers['X-LINE-Authorization'] = signature;

    return config;
});