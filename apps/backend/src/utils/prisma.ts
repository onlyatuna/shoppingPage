//prisma.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from './logger';

// 避免在開發模式 (Hot Reload) 下建立過多連線
const globalForPrisma = global as unknown as { prisma: PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'> };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
        ],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 攔截 Prisma 的事件，導向 Pino Logger
prisma.$on('query', (e: Prisma.QueryEvent) => {
    // 預防 query 太長洗版，可以在這裡裁切，或者改變 level (如只在 dev 開 log, prod 不印 query)
    logger.debug({ action: 'prisma_query', durationMs: e.duration, params: e.params }, e.query);
});

prisma.$on('info', (e: Prisma.LogEvent) => {
    logger.info({ action: 'prisma_info' }, e.message);
});

prisma.$on('warn', (e: Prisma.LogEvent) => {
    logger.warn({ action: 'prisma_warn' }, e.message);
});

prisma.$on('error', (e: Prisma.LogEvent) => {
    logger.error({ action: 'prisma_error' }, e.message);
});