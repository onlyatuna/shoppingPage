//test-linepay-debug.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/backend/.env' }); // Adjust path if needed
import { linePayClient } from './utils/linePay';
import * as fs from 'fs';

async function test() {
    const logs: string[] = [];
    const log = (...args: any[]) => {
        originalLog(...args);
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    // Override console.log to capture logs from linePay.ts
    const originalLog = console.log;
    console.log = log;

    try {
        log('Starting test...');
        const orderId = 'test-order-id';
        const url = `/v3/payments?orderId%5B%5D=${orderId}`;
        log(`Making request to: ${url}`);

        await linePayClient.get(url, {
            timeout: 5000
        });
    } catch (error: any) {
        log('Request finished (error expected)');
        if (error.response) {
            log('Response status:', error.response.status);
            log('Response data:', error.response.data);
        } else {
            log('Error message:', error.message);
        }
    } finally {
        fs.writeFileSync('debug_log.json', JSON.stringify(logs, null, 2));
        console.log = originalLog;
    }
}

test();
