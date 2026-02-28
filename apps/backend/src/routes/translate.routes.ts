import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticateToken } from '../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// [SECURITY] 翻譯 API 速率限制：15分鐘內最多 10 次請求 (保護 DeepL 配額)
const translateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(StatusCodes.TOO_MANY_REQUESTS).json({
            message: '翻譯請求過於頻繁，請 15 分鐘後再試'
        });
    }
});

// DeepL Translation API
// [SECURITY] 已加入 authenticateToken 與 translateLimiter
router.post('/', authenticateToken, translateLimiter, async (req: any, res: any) => {
    try {
        const { text, targetLang = 'EN' } = req.body;

        if (!text) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: '請提供要翻譯的文字'
            });
        }

        const apiKey = process.env.DEEPL_API_KEY;
        if (!apiKey) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: 'DeepL API Key 未設定'
            });
        }

        const { MonitorService } = await import('../services/monitor.service');
        const hasQuota = await MonitorService.checkDeepLQuota(text.length);
        if (!hasQuota) {
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                message: '伺服器翻譯配額(DeepL)本月已用盡，請稍後再試或通知系統管理員'
            });
        }

        // Call DeepL API using form-urlencoded format
        const params = new URLSearchParams();
        params.append('text', text);
        params.append('target_lang', targetLang);

        const response = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${apiKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepL API Error Response:', errorText);
            throw new Error(`DeepL API error: ${response.statusText}`);
        }

        const data = await response.json();
        const translatedText = data.translations[0].text;

        // [SECURITY] 記錄 DeepL API 使用量，避免配額耗盡
        // DeepL Free API limit is 500,000 characters per month
        if (req.user?.userId) {
            import('../services/monitor.service').then(({ MonitorService }) => {
                // Character count as "inputTokens", 0 as output since DeepL bills by character
                MonitorService.logUsage(
                    req.user.userId,
                    'TRANSLATE_TEXT',
                    'deepl-api-free',
                    text.length,
                    translatedText.length
                ).catch(err => console.error('Failed to log DeepL usage:', err));
            });
        }

        res.json({
            status: 'success',
            data: {
                original: text,
                translated: translatedText,
                targetLang
            }
        });
    } catch (error: any) {
        console.error('Translation Error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: '翻譯失敗',
            error: error.message
        });
    }
});

export default router;
