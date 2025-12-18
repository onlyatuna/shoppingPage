import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import { MonitorService } from '../services/monitor.service';
import { StatusCodes } from 'http-status-codes';

const router = Router();

/**
 * GET /api/v1/admin/stats
 * Get AI usage statistics
 * Requires Admin permission
 */
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
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

export default router;
