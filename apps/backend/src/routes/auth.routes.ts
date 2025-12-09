import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/resend-verification
router.post('/resend-verification', AuthController.resendVerification);

// GET /api/auth/verify-email
router.get('/verify-email', AuthController.verifyEmail);

// POST /api/auth/request-password-reset
router.post('/request-password-reset', AuthController.requestPasswordReset);

// GET /api/auth/verify-reset-token
router.get('/verify-reset-token', AuthController.verifyResetToken);

// POST /api/auth/reset-password
router.post('/reset-password', AuthController.resetPassword);

router.get('/me', authenticateToken, (req, res) => {
    res.json({ message: '你已登入', user: req.user });
});

export default router;