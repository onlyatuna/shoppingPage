import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { OrderService } from '../services/order.service';
import { CronService } from '../services/cron.service';

/**
 * [DEVELOPER ONLY] Reset test data for a specific user.
 * Clears cart and resets AI quota.
 */
export const resetTestData = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing userId in request body' });
    }

    const targetUserId = Number(userId);

    // 1. Check if user exists
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found' });
    }

    // [SECURITY] Log developer action for audit trail
    logger.info({
        action: 'RESET_TEST_DATA',
        developerId: req.user?.userId,
        targetUserId: targetUserId
    }, `Developer ${req.user?.userId} reset test data for user ${targetUserId}`);

    // 2. Perform Atomic Resets
    await prisma.$transaction([
        // Clear Cart
        prisma.cartItem.deleteMany({
            where: { cart: { userId: targetUserId } }
        }),
        // Reset AI Usage Count
        prisma.user.update({
            where: { id: targetUserId },
            data: {
                aiBlendUsageCount: 0,
                aiBlendLastResetDate: new Date()
            }
        })
    ]);

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: `Successfully reset test data (cart & AI quota) for user ${targetUserId}`
    });
});

/**
 * [DEVELOPER ONLY] Force a payment to SUCCESS for an order.
 * Bypasses real payment gateway.
 */
export const forcePayOrder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    // We reuse payOrder logic with isAdmin=true to bypass ownership if developer
    await OrderService.payOrder(userId, id, true);

    // [New] Add trace info to paymentData for audit
    await prisma.order.update({
        where: { id },
        data: {
            paymentData: {
                method: 'DEV_BYPASS',
                forcedBy: userId,
                timestamp: new Date().toISOString()
            }
        }
    });

    logger.info({
        action: 'FORCE_PAY',
        developerId: userId,
        orderId: id
    }, `Developer ${userId} forced payment for order ${id}`);

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'Developer Bypass: Payment forced to SUCCESS.'
    });
});

/**
 * [CRON] Check missing LINE Pay payments
 */
export const triggerCheckLinePay = asyncHandler(async (req: Request, res: Response) => {
    const result = await CronService.checkPendingLinePay();
    res.json({ status: 'success', message: '檢查遺失訂單完成', data: result });
});

/**
 * [CRON] Clean stale orders (older than 24 hrs)
 */
export const triggerCleanStaleOrders = asyncHandler(async (req: Request, res: Response) => {
    const result = await CronService.cleanStaleOrders();
    res.json({ status: 'success', message: '清除過期訂單完成', data: result });
});

/**
 * [DEVELOPER ONLY] Atomic instant checkout for faster testing
 */
export const developerInstantCheckout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const shippingInfo = req.body.shippingInfo;

    // Check shipping info validity (reuse schema or trust dev)
    if (!shippingInfo || !shippingInfo.recipient) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid shipping info' });
    }

    const order = await OrderService.developerInstantCheckout(userId, shippingInfo);

    logger.info({
        action: 'DEVELOPER_INSTANT_CHECKOUT',
        developerId: userId,
        orderId: order.id
    }, `Developer ${userId} performed atomic instant checkout`);

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: '原子化結帳成功',
        data: order
    });
});

