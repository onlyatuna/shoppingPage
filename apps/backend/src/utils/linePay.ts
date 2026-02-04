//linePay.ts
import crypto from 'crypto';
import axios from 'axios';

export const linePayClient = axios.create({
    baseURL: process.env.LINE_PAY_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // [關鍵] 阻止 Axios 對參數進行任何自動編碼
    paramsSerializer: {
        encode: (params) => {
            // 直接回傳原始字串，不做任何處理
            if (typeof params === 'string') return params;
            // 預留給 POST
            return new URLSearchParams(params).toString();
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

// 攔截器
linePayClient.interceptors.request.use((config) => {
    const nonce = crypto.randomUUID();
    const channelId = process.env.LINE_PAY_CHANNEL_ID as string;
    const channelSecret = process.env.LINE_PAY_CHANNEL_SECRET as string;

    const bodyStr = config.method?.toUpperCase() === 'GET' ? '' : (config.data ? JSON.stringify(config.data) : '');

    // 處理 Query String
    let uri = config.url as string;
    if (config.params) {
        const qs = new URLSearchParams(config.params).toString();
        if (qs) {
            uri += `?${qs}`;
        }
    }

    const signature = createLinePaySignature(uri, bodyStr, nonce);

    // Debug Log - 只在開發環境顯示，且不洩露敏感資訊
    if (process.env.NODE_ENV === 'development') {
        console.log(`📡 [LINE Pay] ${config.method?.toUpperCase()} ${uri}`);
        console.log(`   Body: '${bodyStr}'`);
        console.log(`   Nonce: ${nonce}`);
        // ❌ 不要記錄包含 channelSecret 的 Signature Base
        // console.log(`   Signature Base: ${channelSecret}${uri}${bodyStr}${nonce}`);
    }

    config.headers['X-LINE-ChannelId'] = channelId;
    config.headers['X-LINE-Authorization-Nonce'] = nonce;
    config.headers['X-LINE-Authorization'] = signature;

    return config;
});