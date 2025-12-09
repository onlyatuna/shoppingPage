//user.routes.ts
import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// --- 個人功能 (需登入) ---
router.get('/profile', authenticateToken, UserController.getProfile);
router.patch('/profile', authenticateToken, UserController.updateProfile);

// --- 管理員功能 (需 Admin 權限) ---
router.get('/', authenticateToken, requireAdmin, UserController.getAllUsers);
router.patch('/:id/role', authenticateToken, requireAdmin, UserController.updateUserRole);
router.delete('/:id', authenticateToken, requireAdmin, UserController.deleteUser);

export default router;