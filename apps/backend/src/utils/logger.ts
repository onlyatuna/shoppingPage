import pino from 'pino';

// 在生產環境中，我們只需要單純的 JSON 輸出；而在開發環境中，如果安裝了 pino-pretty，則可以有一個更好閱讀的格式
const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info', // 可以從環境變數控制輸出層級，預設為 info
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
