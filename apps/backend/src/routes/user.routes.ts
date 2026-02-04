//user.routes.ts
import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireDeveloper } from '../middlewares/admin.middleware';

const router = Router();

// --- 個人功能 (需登入) ---
router.get('/profile', authenticateToken, UserController.getProfile);
router.patch('/profile', authenticateToken, UserController.updateProfile);

// --- 開發者功能 (需 Developer 權限) ---
router.get('/', authenticateToken, requireDeveloper, UserController.getAllUsers);
router.patch('/:id/role', authenticateToken, requireDeveloper, UserController.updateUserRole);
router.delete('/:id', authenticateToken, requireDeveloper, UserController.deleteUser);

export default router;