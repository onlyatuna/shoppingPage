//prisma.ts
import { PrismaClient } from '@prisma/client';

// 避免在開發模式 (Hot Reload) 下建立過多連線
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'], // 在終端機顯示 SQL 語法，方便除錯
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;