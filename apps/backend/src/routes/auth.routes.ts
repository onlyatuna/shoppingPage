import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

router.get('/me', authenticateToken, (req, res) => {
    res.json({ message: '你已登入', user: req.user });
});

export default router;