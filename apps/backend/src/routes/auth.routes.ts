import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as AuthController from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// 速率限制配置
// 密碼重設：15分鐘內最多3次請求
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 3, // 最多 3 次請求
    standardHeaders: true, // 回傳 RateLimit-* headers
    legacyHeaders: false, // 停用 X-RateLimit-* headers
    handler: (req, res) => {
        res.status(429).json({
            message: '請求過於頻繁，請稍後再試'
        });
    }
});

// 登入/註冊：15分鐘內最多5次請求（防止暴力破解）
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 5, // 最多 5 次請求
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            message: '嘗試次數過多，請15分鐘後再試'
        });
    }
});

// Email 驗證相關：5分鐘內最多3次
const emailLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 分鐘
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            message: '驗證信發送過於頻繁，請稍後再試'
        });
    }
});

// 一般認證端點（如 /me）：較寬鬆的限制
const generalAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 100, // 較寬鬆，因為前端常呼叫
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: '請求過於頻繁，請稍後再試' }
});

// POST /api/auth/register
router.post('/register', authLimiter, AuthController.register);

// POST /api/auth/login
router.post('/login', authLimiter, AuthController.login);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

// POST /api/auth/resend-verification
router.post('/resend-verification', emailLimiter, AuthController.resendVerification);

// GET /api/auth/verify-email
router.get('/verify-email', emailLimiter, AuthController.verifyEmail);

// POST /api/auth/request-password-reset
router.post('/request-password-reset', passwordResetLimiter, AuthController.requestPasswordReset);

// GET /api/auth/verify-reset-token
router.get('/verify-reset-token', passwordResetLimiter, AuthController.verifyResetToken);

// POST /api/auth/reset-password
router.post('/reset-password', passwordResetLimiter, AuthController.resetPassword);

// GET /api/auth/me - 取得當前用戶資訊
router.get('/me', generalAuthLimiter, authenticateToken, (req, res) => {
    res.json({ message: '你已登入', user: req.user });
});

export default router;