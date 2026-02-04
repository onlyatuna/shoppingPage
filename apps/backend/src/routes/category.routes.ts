//category.routes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as CategoryController from '../controllers/category.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// Rate limiter for public category reads
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
});

// Stricter rate limiter for admin operations
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 admin requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many admin requests, please try again later.' },
});

// 公開 API：所有人都能取得分類列表 (給商品 Modal 用)
router.get('/', publicLimiter, CategoryController.getAll);

// 管理員 API (rate limited)
router.post('/', adminLimiter, authenticateToken, requireAdmin, CategoryController.create);
router.put('/:id', adminLimiter, authenticateToken, requireAdmin, CategoryController.update);
router.delete('/:id', adminLimiter, authenticateToken, requireAdmin, CategoryController.remove);

export default router;