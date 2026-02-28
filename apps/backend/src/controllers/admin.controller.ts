import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

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
