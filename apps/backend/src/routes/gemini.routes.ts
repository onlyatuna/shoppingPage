import { Router, Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service';
import { authenticateToken } from '../middlewares/auth.middleware';
import { StatusCodes } from 'http-status-codes';

const router = Router();

/**
 * POST /api/v1/gemini/edit-image
 * 編輯圖片 - 支援 AI Smart Blend (Inpainting)
 * 接收: { imageBase64, maskBase64, prompt, systemInstruction }
 */
router.post('/edit-image', authenticateToken, async (req: Request, res: Response) => {
    let userId: number | undefined;
    try {
        // [MODIFIED] 支援 imageBase64 與 maskBase64
        const { imageUrl, imageBase64, maskBase64, prompt, systemInstruction } = req.body;
        userId = (req as any).user?.userId;

        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: '無法取得用戶資訊，請重新登入'
            });
        }

        // 驗證: 至少要有一種圖片來源
        if (!imageUrl && !imageBase64) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: '請提供圖片 (URL 或 Base64)'
            });
        }

        if (!prompt || typeof prompt !== 'string') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: '請提供編輯指令'
            });
        }

        // [NEW] 檢查 AI Blend 配額
        const quota = await GeminiService.checkAndIncrementQuota(userId);

        if (!quota.allowed) {
            return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
                error: 'Daily AI Blend quota exceeded',
                message: '您今日的 AI 融合次數已用完，明天再來吧！',
                limit: quota.limit,
                remaining: 0
            });
        }

        // 呼叫 Gemini Service 編輯圖片
        // 優先使用 Base64 (前端 Canvas 合成結果)，其次使用 URL
        const targetImage = imageBase64 || imageUrl;

        const editedImageBase64 = await GeminiService.editImage(
            targetImage,
            maskBase64, // [NEW] 傳遞遮罩
            prompt,
            systemInstruction,
            userId
        );

        res.json({
            status: 'success',
            data: {
                imageBase64: editedImageBase64
            },
            quota: {
                remaining: quota.remaining,
                limit: quota.limit
            }
        });

    } catch (error: any) {
        console.error('Image Edit API Error:', error);

        if (error.response?.promptFeedback?.blockReason) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: `安全過濾攔截: ${error.response.promptFeedback.blockReason}`,
                error: 'SAFETY_FILTER',
                quota: userId ? await GeminiService.getQuota(userId) : undefined
            });
        }

        // 處理常見錯誤
        const errorMessage = error.message || '圖片編輯失敗';
        const statusCode = errorMessage.includes('API Key') ? StatusCodes.INTERNAL_SERVER_ERROR : StatusCodes.BAD_REQUEST;

        res.status(statusCode).json({
            message: errorMessage,
            quota: userId ? await GeminiService.getQuota(userId) : undefined
        });
    }
});

/**
 * POST /api/v1/gemini/caption
 * 生成圖片文案 - 使用 Gemini 2.5 Flash Lite
 * 需要登入
 */
router.post('/caption', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { imageUrl, additionalInfo } = req.body;

        if (!imageUrl) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'Image URL is required'
            });
        }

        const userId = (req as any).user?.userId;
        const result = await GeminiService.generateCaption(imageUrl, additionalInfo, userId);
        res.json(result);

    } catch (error) {
        console.error('Error generating caption:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to generate caption'
        });
    }
});

/**
 * POST /api/v1/gemini/generate-custom-style-prompt
 * 生成自定義風格提示詞 - 使用 Gemini 2.5 Flash Lite
 * 需要登入
 */
router.post('/generate-custom-style-prompt', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { styleName, styleDescription } = req.body;

        // 驗證輸入
        if (!styleName || typeof styleName !== 'string') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: '請提供風格名稱'
            });
        }

        if (!styleDescription || typeof styleDescription !== 'string') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: '請提供風格描述'
            });
        }

        // 呼叫 Gemini Service 生成提示詞
        const userId = (req as any).user?.userId;
        const prompt = await GeminiService.generateCustomStylePrompt(styleName, styleDescription, userId);

        res.json({
            status: 'success',
            prompt
        });

    } catch (error: any) {
        console.error('Generate Custom Style Prompt API Error:', error);

        if (error.message?.includes('GEMINI_API_KEY')) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: 'Gemini API 設定錯誤'
            });
        }

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error.message || 'AI 提示詞生成失敗'
        });
    }
});

export default router;
