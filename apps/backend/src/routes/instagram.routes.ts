import { Router, Request, Response } from 'express';
import { InstagramService } from '../services/instagram.service';
import { StatusCodes } from 'http-status-codes';

const router = Router();

/**
 * GET /api/v1/instagram/posts
 * 取得 Instagram 貼文列表
 */
router.get('/posts', async (req: Request, res: Response) => {
    try {
        const posts = await InstagramService.getPosts();
        res.json({
            status: 'success',
            data: posts
        });
    } catch (error: any) {
        // 若是設定錯誤，回傳 500
        if (error.message.includes('IG_ACCESS_TOKEN')) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                message: 'Instagram API Token 未設定'
            });
        }

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            message: '無法取得 Instagram 貼文'
        });
    }
});

/**
 * POST /api/v1/instagram/publish
 * 發佈貼文到 Instagram
 */
router.post('/publish', async (req: Request, res: Response) => {
    try {
        const { imageUrl, caption } = req.body;

        if (!imageUrl) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                message: '缺少圖片網址 (imageUrl)'
            });
        }

        const postId = await InstagramService.publishPost(imageUrl, caption || '');

        res.json({
            status: 'success',
            data: { postId },
            message: '發佈成功！'
        });

    } catch (error: any) {
        if (error.message.includes('configured')) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: 'error',
                message: 'Instagram 設定未完成 (Token 或 UserID)'
            });
        }
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            message: '發佈失敗',
            error: error.message
        });
    }
});

export default router;
