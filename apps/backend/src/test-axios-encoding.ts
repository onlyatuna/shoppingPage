//test-axios-encoding.ts
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';

// Mock environment variables
process.env.LINE_PAY_CHANNEL_ID = 'test-channel-id';
process.env.LINE_PAY_CHANNEL_SECRET = 'test-channel-secret';

const logs: any[] = [];
function log(msg: string) {
    console.log(msg);
    logs.push(msg);
}

const linePayClient = axios.create({
    baseURL: 'https://sandbox-api-pay.line.me',
    headers: {
        'Content-Type': 'application/json',
    },
    paramsSerializer: {
        encode: (params) => {
            if (typeof params === 'string') return params;
            return new URLSearchParams(params).toString();
        }
    }
});

function createLinePaySignature(uri: string, bodyStr: string, nonce: string) {
    const channelSecret = process.env.LINE_PAY_CHANNEL_SECRET as string;
    const encryptText = `${channelSecret}${uri}${bodyStr}${nonce}`;
    log(`[Sign] URI: ${uri}`);
    log(`[Sign] EncryptText: ${encryptText}`);

    return crypto
        .createHmac('sha256', channelSecret)
        .update(encryptText)
        .digest('base64');
}

linePayClient.interceptors.request.use((config) => {
    const nonce = 'test-nonce'; // Fixed nonce for testing
    const channelId = process.env.LINE_PAY_CHANNEL_ID as string;
    const bodyStr = config.method?.toUpperCase() === 'GET' ? '' : (config.data ? JSON.stringify(config.data) : '');
    const uri = config.url as string;

    log(`[Interceptor] config.url: ${config.url}`);

    const signature = createLinePaySignature(uri, bodyStr, nonce);

    config.headers['X-LINE-ChannelId'] = channelId;
    config.headers['X-LINE-Authorization-Nonce'] = nonce;
    config.headers['X-LINE-Authorization'] = signature;

    return config;
});

async function test() {
    const orderId = '12345';
    // Simulate the call from payment.service.ts
    const url = `/v3/payments?orderId%5B%5D=${orderId}`;

    log(`[Test] Calling get with url: ${url}`);

    try {
        // We mock the adapter to prevent actual network call and just see what would be sent
        linePayClient.defaults.adapter = async (config) => {
            log(`[Adapter] Final URL: ${config.url}`);
            // Axios constructs the full URL (baseURL + url) before adapter?
            // Actually, adapter receives config.url as passed (merged with baseURL if relative?)
            // If baseURL is set, axios merges it.
            // Let's check if axios merges it before adapter.
            // Yes, axios dispatchRequest merges it.
            return {
                data: { returnCode: '0000', info: {} },
                status: 200,
                statusText: 'OK',
                headers: {},
                config
            };
        };

        await linePayClient.get(url);
    } catch (e: any) {
        log(`Error: ${e.message}`);
    }

    fs.writeFileSync('test_result.json', JSON.stringify(logs, null, 2));
}

test();
