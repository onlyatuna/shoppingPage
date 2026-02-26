//linePay.ts
import crypto from 'crypto';
import axios from 'axios';

// 統一的 Query String 序列化邏輯 (符合 LINE Pay V3 規範：排序 + Key/Value 均編碼)
const serializeParams = (params: any) => {
    return Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
};

export const linePayClient = axios.create({
    baseURL: process.env.LINE_PAY_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    paramsSerializer: (params) => serializeParams(params)
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
    const nonce = Date.now().toString(); // 使用時間戳作為 Nonce 更穩定
    const channelId = process.env.LINE_PAY_CHANNEL_ID as string;
    const channelSecret = process.env.LINE_PAY_CHANNEL_SECRET as string;

    if (!channelId || !channelSecret) {
        throw new Error('[LINE Pay] 缺少 Channel ID 或 Channel Secret');
    }

    const bodyStr = config.method?.toUpperCase() === 'GET' ? '' : (config.data ? JSON.stringify(config.data) : '');

    // [關鍵] LINE Pay V3 規範：GET 請求時，簽章基底 = Path + QueryString (注意：不含 '?' 分隔符)
    let uriForSignature = config.url as string;
    if (config.params) {
        const qs = serializeParams(config.params);
        if (qs) {
            uriForSignature += qs; // 直接拼接，不加 '?'
        }
    }

    const signature = createLinePaySignature(uriForSignature, bodyStr, nonce);

    // [Debug Log] 協助診斷 400/401 錯誤
    if (process.env.DEBUG_LINE_PAY === 'true') {
        const signatureBase = `${uriForSignature}${bodyStr}${nonce}`;
        console.log(`📡 [LINE Pay Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}${config.params ? '?' + serializeParams(config.params) : ''}`);
        console.log(`   Headers: X-LINE-ChannelId=${channelId}, Nonce=${nonce}`);
        console.log(`   Signature Base (URI+Body+Nonce): ${signatureBase}`);
        console.log(`   Signature: ${signature.substring(0, 8)}...`);
    }

    config.headers['X-LINE-ChannelId'] = channelId;
    config.headers['X-LINE-Authorization-Nonce'] = nonce;
    config.headers['X-LINE-Authorization'] = signature;

    return config;
});