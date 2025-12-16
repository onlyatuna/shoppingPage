import { Router, Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service';
import { authenticateToken } from '../middlewares/auth.middleware';
import { StatusCodes } from 'http-status-codes';

const router = Router();

/**
 * POST /api/v1/gemini/edit-image
 * 編輯圖片 - 使用 Gemini 2.5 Flash Lite
 * 需要登入
 */
router.post('/edit-image', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { imageUrl, prompt, systemInstruction } = req.body;

        // 驗證輸入
        if (!imageUrl || typeof imageUrl !== 'string') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: '請提供有效的圖片 URL'
            });
        }

        if (!prompt || typeof prompt !== 'string') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: '請提供編輯指令'
            });
        }

        if (prompt.length > 500) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: '編輯指令過長（最多 500 字元）'
            });
        }

        // 呼叫 Gemini Service 編輯圖片
        const editedImageBase64 = await GeminiService.editImage(
            imageUrl,
            prompt,
            systemInstruction
        );

        res.json({
            status: 'success',
            data: {
                imageBase64: editedImageBase64
            }
        });

    } catch (error: any) {
        console.error('Image Edit API Error:', error);

        if (error.message?.includes('GEMINI_API_KEY')) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: 'Gemini API 設定錯誤'
            });
        }

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error.message || '圖片編輯失敗'
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

        const result = await GeminiService.generateCaption(imageUrl, additionalInfo);
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
        const prompt = await GeminiService.generateCustomStylePrompt(styleName, styleDescription);

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
