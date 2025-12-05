//category.routes.ts
import { Router } from 'express';
import * as CategoryController from '../controllers/category.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// 公開 API：所有人都能取得分類列表 (給商品 Modal 用)
router.get('/', CategoryController.getAll);

// 管理員 API
router.post('/', authenticateToken, requireAdmin, CategoryController.create);
router.put('/:id', authenticateToken, requireAdmin, CategoryController.update);
router.delete('/:id', authenticateToken, requireAdmin, CategoryController.remove);

export default router;