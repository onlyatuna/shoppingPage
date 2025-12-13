// translate.routes.ts
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

const router = Router();

// DeepL Translation API
router.post('/translate', async (req, res) => {
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
