import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { PaymentService } from './payment.service';

export class CronService {
    // 1. 掃描過期的 PENDING 訂單 (超過 24 小時)，並取消返還庫存
    static async cleanStaleOrders() {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const staleOrders = await prisma.order.findMany({
                where: {
                    status: 'PENDING',
                    createdAt: { lt: twentyFourHoursAgo }
                },
                include: { items: true }
            });

            if (staleOrders.length === 0) return { count: 0 };

            let count = 0;
            for (const order of staleOrders) {
                await prisma.$transaction(async (tx) => {
                    // 返還庫存
                    for (const item of order.items) {
                        await tx.product.updateMany({
                            where: { id: item.productId },
                            data: { stock: { increment: item.quantity } }
                        });
                    }

                    // 標記為 CANCELLED
                    await tx.order.update({
                        where: { id: order.id },
                        data: { status: 'CANCELLED' }
                    });
                });
                count++;
            }
            logger.info(`[CronJob] 成功清理 ${count} 筆超過 24 小時的未付款訂單`);
            return { count };
        } catch (error) {
            logger.error(`[CronJob] 清理訂單發生錯誤: ${error}`);
            // throw error
            return { count: 0, error: String(error) };
        }
    }

    // 2. 掃描卡住的 Line Pay 訂單 (20 分鐘 ~ 24 小時內) 嘗試自動補請款
    static async checkPendingLinePay() {
        try {
            const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const pendingOrders = await prisma.order.findMany({
                where: {
                    status: 'PENDING',
                    paymentId: { not: null },
                    createdAt: {
                        lt: twentyMinsAgo,
                        gte: twentyFourHoursAgo
                    }
                }
            });

            if (pendingOrders.length === 0) return { checked: 0, fixed: 0 };

            let checked = 0;
            let fixed = 0;

            for (const order of pendingOrders) {
                checked++;
                try {
                    // 嘗試主動向 LINE Pay 確認該筆交易。
                    // 由於使用者可能已經在 App 付款但未回到網站，這個動作若不執行，錢將卡在「授權未扣款」狀態。
                    // 如果這筆根本沒付，此方法會自然 throws 錯誤並被 catch 忽略，不會中斷迴圈。
                    await PaymentService.confirmLinePay(order.id, order.paymentId!, order.userId);

                    fixed++;
                    logger.info(`[CronJob] 成功自動確認訂單 ${order.id} 的遺失付款`);
                } catch (e: any) {
                    // 1172 代表交易尚未授權或其他狀態，我們只需靜默略過
                    logger.debug(`[CronJob] 訂單 ${order.id} 尚未付款或無效: ${e.message}`);
                }
            }

            if (fixed > 0) {
                logger.info(`[CronJob] 排程掃描完成，檢查了 ${checked} 筆待確認訂單，自動修復並確認了 ${fixed} 筆付款`);
            }
            return { checked, fixed };
        } catch (error) {
            logger.error(`[CronJob] 檢查 LinePay 排程發生錯誤: ${error}`);
            return { checked: 0, fixed: 0, error: String(error) };
        }
    }
}
