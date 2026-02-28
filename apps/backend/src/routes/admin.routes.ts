import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin, requireDeveloper } from '../middlewares/admin.middleware';
import { MonitorService } from '../services/monitor.service';
import { resetTestData, forcePayOrder, triggerCheckLinePay, triggerCleanStaleOrders, developerInstantCheckout } from '../controllers/admin.controller';
import { StatusCodes } from 'http-status-codes';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for admin endpoints
const adminRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per 15 minutes per IP
    message: { status: 'error', message: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * PATCH /api/v1/admin/orders/:id/force-pay
 * Force payment success for an order (Developer Only)
 */
router.patch('/orders/:id/force-pay', adminRateLimiter, authenticateToken, requireDeveloper, forcePayOrder);

/**
 * GET /api/v1/admin/stats
 * Get AI usage statistics
 * Requires Admin permission
 */
router.get('/stats', adminRateLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const days = req.query.days ? Number(req.query.days) : 30;
        const stats = await MonitorService.getDailyStats(days);

        res.json({
            status: 'success',
            data: stats
        });
    } catch (error) {
        console.error('Get Admin Stats Error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to retrieve statistics'
        });
    }
});

/**
 * POST /api/v1/admin/reset-test-data
 * Reset cart and AI quota for a user.
 * Requires Developer permission
 */
router.post('/reset-test-data', adminRateLimiter, authenticateToken, requireDeveloper, resetTestData);

/**
 * POST /api/v1/admin/cron/check-linepay
 * Manual trigger to check pending line pay payments
 */
router.post('/cron/check-linepay', adminRateLimiter, authenticateToken, requireDeveloper, triggerCheckLinePay);

/**
 * POST /api/v1/admin/cron/clean-stale-orders
 * Manual trigger to clean >24h pending orders
 */
router.post('/cron/clean-stale-orders', adminRateLimiter, authenticateToken, requireDeveloper, triggerCleanStaleOrders);

/**
 * POST /api/v1/admin/developer/instant-checkout
 * Atomic instant checkout for faster testing
 */
router.post('/developer/instant-checkout', adminRateLimiter, authenticateToken, requireDeveloper, developerInstantCheckout);

export default router;
