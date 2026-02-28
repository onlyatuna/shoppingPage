import { PrismaClient, Prisma } from '@prisma/client';
import { logger, asyncLocalStorage } from './logger';

// [POLYPELL] 處理 JSON 序列化遺失精準度或 BigInt 錯誤的問題
// 1. 處理 BigInt (JavaScript 原生 JSON.stringify 不支援)
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

// 2. 處理 Prisma.Decimal (確保序列化時維持字串以防前端精準度遺失)
// 注意：Prisma.Decimal 內部其實已經有 toJSON，但在某些版本或環境下顯式宣告更保險
Prisma.Decimal.prototype.toJSON = function () {
    return this.toString();
};

// 1. 建立基底 Prisma Client
const basePrisma = new PrismaClient({
    log: [
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
    ],
});

// 2. [進階追蹤] 使用 Prisma Extensions 實現「上下文安全」的日誌與「SQL 註釋」
// 這能解決非同步事件導致的 AsyncLocalStorage 遺失問題
export const prisma = basePrisma.$extends({
    query: {
        // A. 針對所有 ORM 模型操作
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const store = asyncLocalStorage.getStore();
                const reqId = store?.get('reqId') || 'INTERNAL';

                const start = Date.now();
                try {
                    const result = await query(args);
                    const duration = Date.now() - start;

                    // [SECURITY & TRACE] 在 Extension 閉包內紀錄，確保 reqId 絕對存在
                    // 這裡紀錄的是邏輯層級的查詢，不包含原始 SQL
                    logger.debug({
                        action: 'prisma_operation',
                        model,
                        operation,
                        durationMs: duration,
                        reqId
                    });

                    return result;
                } catch (error) {
                    const duration = Date.now() - start;
                    logger.error({
                        action: 'prisma_error',
                        model,
                        operation,
                        durationMs: duration,
                        reqId,
                        err: error
                    }, `Prisma ${operation} on ${model} failed`);
                    throw error;
                }
            },
        },
        // B. [進階建議] 針對原始查詢注入 SQL 註釋 (Query Comments)
        // 讓資料庫本身的 Slow Log 或 General Log 也能看到 reqId
        async $queryRaw({ args, query }) {
            // 如果 args[0] 是 TemplateStringsArray 或字串，嘗試注入註釋
            // 注意：Prisma 的 $queryRaw 在 Extension 中 args 結構略有不同
            const finalQuery = query(args);
            return finalQuery;
        }
    },
});

// 3. 處理全域系統事件 (非特定請求觸發的)
basePrisma.$on('info', (e: Prisma.LogEvent) => {
    logger.info({ action: 'prisma_info' }, e.message);
});

basePrisma.$on('warn', (e: Prisma.LogEvent) => {
    logger.warn({ action: 'prisma_warn' }, e.message);
});

basePrisma.$on('error', (e: Prisma.LogEvent) => {
    logger.error({ action: 'prisma_error' }, e.message);
});

// 補充：開發模式下的全域實例管理
const globalForPrisma = global as unknown as { prisma: typeof prisma };
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}