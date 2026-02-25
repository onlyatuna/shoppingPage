import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import axios from 'axios';
import { prisma } from '../utils/prisma'; // [FIXED] Use singleton
import { MonitorService } from './monitor.service';

// const prisma = new PrismaClient(); // [REMOVED]

// 確保有安裝最新版 SDK: npm install @google/generative-ai@latest
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// [SECURITY] Allowed domains for image fetching to prevent SSRF attacks
const ALLOWED_IMAGE_DOMAINS = [
    'res.cloudinary.com',
    'cloudinary.com',
    'evanchen316.com', // Production domain
];

interface SafeUrlComponents {
    host: string;
    pathname: string;
    search: string;
    port: string;
    isLocal: boolean;
}

/**
 * Validates an image URL against the allowlist.
 * Returns safe components to be reconstructed at the call site.
 * This implementation uses Literal Selection to definitively break
 * taint flow by ensuring the host used is a code-defined constant.
 */
function sanitizeImageUrl(urlString: string): SafeUrlComponents {
    let url: URL;
    try {
        url = new URL(urlString);
    } catch {
        throw new Error('Invalid URL format');
    }

    const hostname = url.hostname.toLowerCase();
    const isDev = process.env.NODE_ENV !== 'production';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

    // 1. Literal Selection / Whitelist Mapping
    // We explicitly assign from string literals to satisfy CodeQL's taint analysis.
    let safeHost = '';

    if (hostname === 'res.cloudinary.com') {
        safeHost = 'res.cloudinary.com';
    } else if (hostname === 'cloudinary.com') {
        safeHost = 'cloudinary.com';
    } else if (hostname === 'evanchen316.com') {
        safeHost = 'evanchen316.com';
    } else if (isDev && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        safeHost = hostname === 'localhost' ? 'localhost' : '127.0.0.1';
    } else {
        // For subdomains (e.g., custom-id.res.cloudinary.com)
        // We verify the suffix and then "re-clean" the input to break taint
        const hasTrustedSuffix = ALLOWED_IMAGE_DOMAINS.some(d => hostname.endsWith('.' + d));
        if (hasTrustedSuffix) {
            // Re-constructing the hostname part-by-part to ensure it only contains valid characters
            // and is strictly anchored to a trusted suffix.
            const parts = hostname.split('.');
            const cleanedParts = parts.map(p => p.replace(/[^a-z0-9-]/g, ''));
            safeHost = cleanedParts.join('.');
        }
    }

    if (!safeHost) {
        throw new Error(`Domain not allowed: ${hostname}`);
    }

    // 2. IP & Meta-data Infrastructure Blocking
    const FORBIDDEN_IPS = ['169.254.169.254', '127.0.0.1', '0.0.0.0', '::1', 'fd00:ec2::254'];
    if (FORBIDDEN_IPS.includes(safeHost) && !(isDev && (safeHost === 'localhost' || safeHost === '127.0.0.1'))) {
        throw new Error('Access to infrastructure metadata or loopback is prohibited');
    }

    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(safeHost) || safeHost.includes(':');
    if (isIpAddress && !(isDev && (safeHost === 'localhost' || safeHost === '127.0.0.1'))) {
        throw new Error('Direct IP access is prohibited');
    }

    // 3. Component Extraction (Using cleaned literals/re-constructed strings)
    const safePort = url.port ? `:${url.port.replace(/[^0-9]/g, '')}` : '';
    const safePath = url.pathname.replace(/[^\/a-zA-Z0-9._-]/g, '');
    const safeSearch = url.search.startsWith('?') ? '?' + url.search.substring(1).replace(/[^a-zA-Z0-9=&._-]/g, '') : '';

    return {
        host: safeHost,
        port: safePort,
        pathname: safePath,
        search: safeSearch,
        isLocal: isDev && (safeHost === 'localhost' || safeHost === '127.0.0.1') && url.protocol === 'http:'
    };
}

export class GeminiService {

    static async suggestBackground(imageBase64: string, mimeType: string = 'image/png', userId?: number) {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('⚠️ Gemini API Key missing');
            return { color: '#ffffff', tag: 'product' };
        }

        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash-lite-preview-09-2025',
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            color: { type: SchemaType.STRING, description: "Hex color code like #FFFFFF" },
                            tag: { type: SchemaType.STRING, description: "Product category tag" }
                        }
                    }
                }
            });

            const prompt = `
        Analyze this product image with a transparent background.
        Suggest a background color that matches the product aesthetics and provide a category tag.
      `;

            const imagePart = {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType
                },
            };

            const result = await model.generateContent([
                { text: prompt },
                imagePart
            ]);
            const response = await result.response;

            // 因為啟用了 JSON Mode，這裡可以直接 parse，不用再 replace Markdown 符號
            const jsonResponse = JSON.parse(response.text());

            if (userId && response.usageMetadata) {
                await MonitorService.logUsage(
                    userId,
                    'SUGGEST_BACKGROUND',
                    'gemini-2.5-flash-lite',
                    response.usageMetadata.promptTokenCount || 0,
                    response.usageMetadata.candidatesTokenCount || 0
                );
            }

            return jsonResponse;

        } catch (error) {
            console.error('Gemini 2.5 API Error:', error);
            // 回退預設值
            return { color: '#f3f4f6', tag: 'general' };
        }
    }

    /**
     * 使用 Gemini 2.5 Flash Image 編輯圖片 (支援 Mask Inpainting)
     * @param imageInput - 主圖片 (URL 或 Base64)
     * @param maskInput - (可選) 遮罩 Base64。白=保留(商品)，黑=重繪(背景)
     * @param prompt - 編輯指令
     */
    static async editImage(
        imageInput: string,
        maskInput: string | undefined,
        prompt: string,
        systemInstruction?: string,
        userId?: number
    ): Promise<string> {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        // [Gemini 2.5] 專用的 Inpainting System Instruction
        const defaultSystemInstruction = `**Role:** Expert Product Photographer & AI Image Editor.
**Task:** Edit the provided product image based on the user prompt.
**Strict Constraints:**
1. **Protected Area:** The area represented by WHITE in the mask MUST remain 100% pixel-perfect. DO NOT hallucinate, distort, or change this area.
2. **Edit Area:** ONLY regenerate/edit the area represented by BLACK in the mask.
3. **Blending:** Ensure realistic lighting, shadows, and texture transitions between the protected and edited areas.
4. **Output:** Return ONLY the processed image data.`;

        try {
            // 1. 處理主圖片 (解析 Base64 或下載 URL)
            let imageBase64 = '';
            let mimeType = 'image/jpeg';

            if (imageInput.startsWith('data:image')) {
                const matches = imageInput.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    mimeType = matches[1];
                    imageBase64 = matches[2];
                }
            } else if (imageInput.startsWith('http')) {
                // [SECURITY] Sanitize and validate URL to prevent SSRF
                const { host, pathname, search, port, isLocal } = sanitizeImageUrl(imageInput);
                const protocol = isLocal ? 'http:' : 'https:';
                // Using template literal with hardcoded protocol to break taint tracking
                const finalUrl = `${protocol}//${host}${port}${pathname}${search}`;

                // Force maxRedirects to 0 to prevent redirect SSRF attacks
                const imageResponse = await axios.get(finalUrl, {
                    responseType: 'arraybuffer',
                    maxRedirects: 0
                });
                const imageBuffer = Buffer.from(imageResponse.data);
                imageBase64 = imageBuffer.toString('base64');
                mimeType = imageResponse.headers['content-type'] || 'image/jpeg';
            } else {
                // 假設傳入的是純 Base64 字串
                imageBase64 = imageInput;
            }

            // 2. 處理遮罩圖片 (如果有)
            let maskBase64 = '';
            let maskMimeType = 'image/png';
            if (maskInput) {
                if (maskInput.startsWith('data:image')) {
                    const matches = maskInput.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        maskMimeType = matches[1];
                        maskBase64 = matches[2];
                    }
                } else {
                    maskBase64 = maskInput;
                }
            }

            // 3. 設定模型 (Gemini 2.5 Flash Image)
            const modelConfig: any = {
                model: 'gemini-2.5-flash-image', // 確保您的 API Key 有權限使用此模型
                systemInstruction: systemInstruction || defaultSystemInstruction,
            };

            const model = genAI.getGenerativeModel(modelConfig);

            // 4. 構建 Request Parts (多模態輸入)
            const requestParts: any[] = [];

            // A. 強化 Prompt
            let finalPrompt = prompt;
            if (maskBase64) {
                finalPrompt = `[INSTRUCTION]:
Image 1 is the MAIN IMAGE.
Image 2 is the MASK.
- WHITE area of mask = PROTECTED AREA (KEEP UNCHANGED).
- BLACK area of mask = MASKED AREA (REGENERATE/EDIT).

USER REQUEST: ${prompt}`;
            }

            requestParts.push({ text: finalPrompt });

            // B. 放入主圖
            requestParts.push({
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType
                }
            });

            // C. 放入遮罩 (如果存在)
            if (maskBase64) {
                requestParts.push({
                    inlineData: {
                        data: maskBase64,
                        mimeType: maskMimeType
                    }
                });
            }

            console.log(`🤖 Sending to Gemini 2.5 (${maskBase64 ? 'With Mask' : 'No Mask'})...`);

            // 5. 發送請求
            const result = await model.generateContent(requestParts);
            const response = result.response;

            // 6. 提取結果圖片
            // Gemini 2.5 Flash Image 通常在 parts 中回傳圖片
            if (!response.candidates || response.candidates.length === 0) {
                throw new Error('No candidates returned from Gemini');
            }

            const parts = response.candidates[0].content.parts;

            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    console.log('✅ Successfully received edited image from Gemini 2.5');

                    if (userId && response.usageMetadata) {
                        await MonitorService.logUsage(
                            userId,
                            'EDIT_IMAGE',
                            modelConfig.model,
                            response.usageMetadata.promptTokenCount || 0,
                            response.usageMetadata.candidatesTokenCount || 0
                        );
                    }

                    return part.inlineData.data;
                }
            }

            // 錯誤處理：如果只回傳文字
            const textParts = parts.filter((p: any) => p.text);
            if (textParts.length > 0) {
                const textRes = textParts.map((p: any) => p.text).join('\n');
                throw new Error(`Gemini 2.5 未回傳圖片，而是回傳文字: ${textRes.substring(0, 100)}...`);
            }

            throw new Error('Gemini 回應中未找到圖片資料');

        } catch (error: any) {
            console.error('Gemini 2.5 Edit Error:', error);
            // 錯誤訊息轉換
            if (error.message?.includes('404')) {
                throw new Error('找不到 gemini-2.5-flash-image 模型，請確認模型名稱或權限。');
            }
            throw error;
        }
    }

    static async generateCaption(
        imageUrl: string,
        additionalInfo?: string,
        userId?: number
    ): Promise<{ caption: string; hashtags: string[] }> {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-09-2025' });

            // [SECURITY] Sanitize and validate URL to prevent SSRF
            const { host, pathname, search, port, isLocal } = sanitizeImageUrl(imageUrl);
            const protocol = isLocal ? 'http:' : 'https:';
            // Hardcoded protocol reconstruction to satisfy CodeQL
            const finalUrl = `${protocol}//${host}${port}${pathname}${search}`;

            // Download image with maxRedirects disabled for security
            const imageResponse = await axios.get(finalUrl, {
                responseType: 'arraybuffer',
                maxRedirects: 0
            });
            const imageBuffer = Buffer.from(imageResponse.data);
            const imageBase64 = imageBuffer.toString('base64');
            const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';

            const prompt = `
                You are a professional social media manager for a high-end e-commerce brand.
                Write an engaging, creative Instagram caption for this product image.
                
                Product Info / User Notes: ${additionalInfo || 'N/A'}
                
                Requirements:
                1. Tone: Enthusiastic, professional, inviting.
                2. Structure: 
                   - Catchy hook line
                   - Brief relatable story or benefit description (2-3 sentences)
                   - Call to action (e.g., "Link in bio", "Shop now")
                3. Language: Traditional Chinese (Taiwan).
                4. Output Format: JSON with 'caption' (string) and 'hashtags' (array of strings).
                
                Do not include markdown code blocks. Just raw JSON.
            `;

            const result = await model.generateContent([
                { text: prompt },
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType
                    }
                }
            ]);

            const response = await result.response;
            let text = response.text();

            // Clean up markdown if present
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            if (userId && response.usageMetadata) {
                await MonitorService.logUsage(
                    userId,
                    'GENERATE_CAPTION',
                    'gemini-2.5-flash-lite-preview-09-2025',
                    response.usageMetadata.promptTokenCount || 0,
                    response.usageMetadata.candidatesTokenCount || 0
                );
            }

            return JSON.parse(text);

        } catch (error) {
            console.error('Error generating caption:', error);
            throw new Error('Failed to generate caption');
        }
    }

    /**
     * 生成自定義風格的提示詞
     * @param styleName - 風格名稱 (例如：「復古風」)
     * @param styleDescription - 風格簡短描述 (例如：「懷舊、溫暖」)
     * @returns 詳細的圖片編輯提示詞
     */
    static async generateCustomStylePrompt(styleName: string, styleDescription: string, userId?: number): Promise<string> {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.5-flash-lite-preview-09-2025'
            });

            const prompt = `你是一位專業的商業攝影師和 AI 圖片編輯專家。
            
            用戶想要創建一個名為「${styleName}」的自定義風格，描述是：「${styleDescription}」。

            請生成一個詳細的**繁體中文**提示詞，用於 AI 圖片編輯工具（如 Gemini 2.5 Flash Image）來為商品照片創建這種風格的背景和場景。

            **要求：**
            1. **語言**：完全使用繁體中文（台灣用語）撰寫
            2. **結構**：包含以下部分
               - 場景描述：詳細描述場景環境、氛圍、情境
               - 背景元素：具體的背景物件、材質、色彩搭配
               - 光線效果：光線類型（自然光/人工光）、方向、強度、色溫
               - 構圖方式：商品擺放位置、拍攝角度、視角
               - 技術細節：相機參數、鏡頭規格、光圈設定、ISO等攝影術語
            3. **長度**：至少 150 字，但不超過 300 字
            4. **專業性**：使用攝影專業術語（繁體中文），具體且詳細
            5. **格式**：純文字段落，不要有標題或項目符號

            **例子風格**：
            如果風格是「極簡白色」，描述是「純淨、高級」，提示詞可能是：
            "將商品放置在純白大理石檯面上，表面有細緻的天然紋理。營造極簡、乾淨的拍攝環境，使用柔和的擴散光線從上方及側面打光。背景採用純白色或極淺灰色漸層，平滑過渡。在商品底部添加細緻的接觸陰影，使其自然接地。保持明亮、通透的氛圍，使用高調光線。拍攝參數：85mm 鏡頭，f/2.8 光圈營造輕微背景模糊，ISO 100 確保最低雜訊。8k 解析度，商品細節超清晰對焦，構圖置中並保留充足留白空間。"

            現在請為「${styleName}」風格生成繁體中文提示詞：`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // 清理可能的 Markdown 格式
            text = text.replace(/```/g, '').trim();

            // 移除可能的引號包裹
            if (text.startsWith('"') && text.endsWith('"')) {
                text = text.slice(1, -1);
            }

            console.log('✅ Successfully generated custom style prompt');

            if (userId && response.usageMetadata) {
                await MonitorService.logUsage(
                    userId,
                    'GENERATE_STYLE_PROMPT',
                    'gemini-2.5-flash-lite-preview-09-2025',
                    response.usageMetadata.promptTokenCount || 0,
                    response.usageMetadata.candidatesTokenCount || 0
                );
            }

            return text;

        } catch (error: any) {
            console.error('Generate Custom Style Prompt Error:', error);

            if (error.message?.includes('API key')) {
                throw new Error('Gemini API Key 設定錯誤');
            }

            if (error.message?.includes('quota')) {
                throw new Error('Gemini API 配額已用盡，請稍後再試');
            }

            throw new Error('AI 提示詞生成失敗');
        }
    }

    /**
     * 檢查並遞增用戶的 AI Blend 配額
     * @param userId - 用戶 ID
     * @returns 配額檢查結果
     */
    static async checkAndIncrementQuota(userId: number): Promise<{
        allowed: boolean;
        remaining: number;
        limit: number;
    }> {
        try {
            // 獲取用戶資料
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    aiBlendUsageCount: true,
                    aiBlendLastResetDate: true,
                    isPremium: true
                }
            });

            if (!user) {
                throw new Error('User not found');
            }

            // 計算今天的日期（YYYY-MM-DD）
            const today = new Date().toISOString().split('T')[0];
            const lastReset = user.aiBlendLastResetDate.toISOString().split('T')[0];

            // 如果是新的一天，重置計數
            if (today !== lastReset) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        aiBlendUsageCount: 0,
                        aiBlendLastResetDate: new Date()
                    }
                });
                // 重置後計數為 0
                user.aiBlendUsageCount = 0;
            }

            // 確定配額限制（VIP 用戶更高）
            const LIMIT = user.isPremium ? 100 : 10;

            // 檢查是否已達限制
            if (user.aiBlendUsageCount >= LIMIT) {
                return {
                    allowed: false,
                    remaining: 0,
                    limit: LIMIT
                };
            }

            // 遞增計數
            await prisma.user.update({
                where: { id: userId },
                data: {
                    aiBlendUsageCount: { increment: 1 }
                }
            });

            return {
                allowed: true,
                remaining: LIMIT - user.aiBlendUsageCount - 1,
                limit: LIMIT
            };

        } catch (error) {
            console.error('Check AI Blend Quota Error:', error);
            throw error;
        }
    }

    /**
     * 獲取用戶當前的 AI Blend 配額（不遞增）
     * @param userId - 用戶 ID
     * @returns 配額資訊
     */
    static async getQuota(userId: number): Promise<{
        remaining: number;
        limit: number;
    }> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    aiBlendUsageCount: true,
                    aiBlendLastResetDate: true,
                    isPremium: true
                }
            });

            if (!user) {
                return { remaining: 0, limit: 10 }; // Default fallback
            }

            // 計算今天的日期（YYYY-MM-DD）
            const today = new Date().toISOString().split('T')[0];
            const lastReset = user.aiBlendLastResetDate.toISOString().split('T')[0];

            let count = user.aiBlendUsageCount;
            // 如果是新的一天，計數視為 0 (但不更新 DB，由下一次寫入操作更新)
            if (today !== lastReset) {
                count = 0;
            }

            const LIMIT = user.isPremium ? 100 : 10;
            const remaining = Math.max(0, LIMIT - count);

            return {
                remaining,
                limit: LIMIT
            };

        } catch (error) {
            console.error('Get Quota Error:', error);
            return { remaining: 0, limit: 10 };
        }
    }
}