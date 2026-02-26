import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

// 建立一個全域的 AsyncLocalStorage，用來儲存 req.id 等關聯上下文
export const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

// 在生產環境中，我們只需要單純的 JSON 輸出；而在開發環境中，如果安裝了 pino-pretty，則可以有一個更好閱讀的格式
const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info', // 可以從環境變數控制輸出層級，預設為 info
    // 配置 PII 脫敏
    redact: {
        paths: [
            'password', '*.password', 'body.password',
            'newPassword', '*.newPassword', 'body.newPassword',
            'resetPasswordToken', '*.resetPasswordToken', 'body.resetPasswordToken',
            'creditCardNumber', '*.creditCardNumber', 'body.creditCardNumber',
            'cvv', '*.cvv', 'body.cvv',
            'req.headers.authorization', 'req.headers.cookie'
        ],
        censor: '[REDACTED]'
    },
    // 自動混入 correlation ID
    mixin() {
        const store = asyncLocalStorage.getStore();
        if (store && store.has('reqId')) {
            return { reqId: store.get('reqId') };
        }
        return {};
    },
    // 使用推薦的結構化日誌格式
    formatters: {
        level: (label) => {
            return { level: label };
        }
    },
    // 對於開發環境可以使用漂亮輸出
    ...(isProduction ? {} : {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard' // 轉換時間格式方便閱讀
            }
        }
    })
});
