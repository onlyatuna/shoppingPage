import { Router } from 'express';
import { prisma } from '../utils/prisma'; // [FIXED] Use singleton
import { authenticateToken } from '../middlewares/auth.middleware';
import { StatusCodes } from 'http-status-codes';
import rateLimit from 'express-rate-limit';

const router = Router();
// const prisma = new PrismaClient(); // [REMOVED]

// Rate limiter for custom style endpoints
const customStyleRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per 15 minutes per IP
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Get user's custom styles
router.get('/', customStyleRateLimiter, authenticateToken, async (req: any, res) => {
    try {
        const styles = await prisma.customStyle.findMany({
            where: { userId: req.user?.userId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(StatusCodes.OK).json({
            success: true,
            data: styles
        });
    } catch (error: any) {
        console.error('Error fetching custom styles:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: '獲取自訂風格失敗'
        });
    }
});

// Create a new custom style
router.post('/', customStyleRateLimiter, authenticateToken, async (req: any, res) => {
    try {
        const { key, name, engName, desc, icon, color, borderColor, prompt, preview } = req.body;

        // Validate required fields
        if (!key || !name || !prompt) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: '請提供必要欄位：key, name, prompt'
            });
        }

        // Check if style with same key already exists for this user
        const existing = await prisma.customStyle.findUnique({
            where: {
                userId_key: {
                    userId: req.user?.userId,
                    key: key
                }
            }
        });

        if (existing) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: '此風格名稱已存在'
            });
        }

        // Create new custom style
        const newStyle = await prisma.customStyle.create({
            data: {
                key,
                name,
                engName,
                desc,
                icon,
                color,
                borderColor,
                prompt,
                preview,
                userId: req.user?.userId
            }
        });

        res.status(StatusCodes.CREATED).json({
            success: true,
            data: newStyle,
            message: '自訂風格已儲存'
        });
    } catch (error: any) {
        console.error('Error creating custom style:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: '儲存自訂風格失敗'
        });
    }
});

// Update a custom style
router.put('/:id', customStyleRateLimiter, authenticateToken, async (req: any, res) => {
    try {
        const styleId = parseInt(req.params.id);
        const { name, engName, desc, icon, color, borderColor, prompt, key } = req.body;

        // Check if style exists and belongs to user
        const existingStyle = await prisma.customStyle.findFirst({
            where: {
                id: styleId,
                userId: req.user?.userId
            }
        });

        if (!existingStyle) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: '找不到此風格或無權限編輯'
            });
        }

        // Update the style
        const updatedStyle = await prisma.customStyle.update({
            where: { id: styleId },
            data: {
                name,
                engName,
                desc,
                icon,
                color,
                borderColor,
                prompt,
                key
            }
        });

        res.status(StatusCodes.OK).json({
            success: true,
            data: updatedStyle,
            message: '風格已更新'
        });
    } catch (error: any) {
        console.error('Error updating custom style:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: '更新風格失敗'
        });
    }
});

// Delete a custom style
router.delete('/:id', customStyleRateLimiter, authenticateToken, async (req: any, res) => {
    try {
        const styleId = parseInt(req.params.id);

        // Check if style exists and belongs to user
        const style = await prisma.customStyle.findFirst({
            where: {
                id: styleId,
                userId: req.user?.userId
            }
        });

        if (!style) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: '找不到此風格或無權限刪除'
            });
        }

        await prisma.customStyle.delete({
            where: { id: styleId }
        });

        res.status(StatusCodes.OK).json({
            success: true,
            message: '風格已刪除'
        });
    } catch (error: any) {
        console.error('Error deleting custom style:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: '刪除風格失敗'
        });
    }
});

export default router;
