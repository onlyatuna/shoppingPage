import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import axios from 'axios';

// 確保有安裝最新版 SDK: npm install @google/generative-ai@latest
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class GeminiService {

    static async suggestBackground(imageBase64: string, mimeType: string = 'image/png') {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('⚠️ Gemini API Key missing');
            return { color: '#ffffff', tag: 'product' };
        }

        try {
            const model = genAI.getGenerativeModel({
                model: 'Gemini 2.5 Flash-Lite',
                // [新功能] 強制輸出 JSON，讓 Gemini 3.0 更聽話
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

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;

            // 因為啟用了 JSON Mode，這裡可以直接 parse，不用再 replace Markdown 符號
            const jsonResponse = JSON.parse(response.text());

            return jsonResponse;

        } catch (error) {
            console.error('Gemini 2.5 API Error:', error);
            // 回退預設值
            return { color: '#f3f4f6', tag: 'general' };
        }
    }

    /**
     * 使用 Gemini 2.5 Flash Image 編輯圖片
     * @param imageUrl - 要編輯的圖片 URL
     * @param prompt - 編輯指令（例如：「移除背景」、「更換成藍色背景」）
     * @param systemInstruction - 選填的系統指令（用於優化構圖、光影、細節等）。若未提供，將使用預設優化提示詞
     * @returns base64 編碼的編輯後圖片
     */
    static async editImage(imageUrl: string, prompt: string, systemInstruction?: string): Promise<string> {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        // 預設的 System Instruction（優化圖片品質）
        const defaultSystemInstruction = `**Role:**
You are an expert commercial product photographer and CGI lighting specialist.

**Objective:**
Generate a high-end, photorealistic studio background specifically for the object provided in the input image. Seamlessly integrate the object into the new environment.

**Visual Constraints & Composition:**
1.  **Subject Integrity:** DO NOT alter, crop, or distort the provided product. Its shape, color, branding, and texture must remain 100% original.
2.  **Composition:** Create a perfectly centered square composition (1:1 aspect ratio).
3.  **Camera Angle:** Eye-level shot, matching the perspective of the product.
4.  **Layout:** Maintain ample, clean negative space around the product edges (especially top and sides) to allow room for advertising text overlays.

**Lighting & Atmosphere:**
1.  **Environment:** A clean, minimalist podium or smooth surface.
2.  **Lighting:** Soft, diffused studio lighting.
3.  **Grounding (Crucial):** Generate realistic **contact shadows** and subtle reflections on the surface directly beneath the product to ensure it looks physically grounded, not floating.
4.  **Quality:** 8k resolution, ultra-detailed textures, depth of field blurring the distant background slightly to keep focus on the product.

**Negative Constraints:**
No text in background, no watermarks, no complex patterns that distract from the product, no distortion of the product edges.

**Technical Details:**
Shot with 100mm macro lens, f/2.8 aperture for shallow depth of field, ISO 100. 8k resolution, highly detailed, sharp focus on the product, no noise, no artifacts.`;

        try {
            // 1. 下載原始圖片
            const imageResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer'
            });
            const imageBuffer = Buffer.from(imageResponse.data);
            const imageBase64 = imageBuffer.toString('base64');
            const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';

            // 2. 使用 Gemini 2.5 Flash Image 進行圖片編輯
            const modelConfig: any = {
                model: 'gemini-2.5-flash-image',
            };

            // 如果未提供 systemInstruction 或為空字串，使用預設值
            const finalSystemInstruction = (systemInstruction && systemInstruction.trim())
                ? systemInstruction.trim()
                : defaultSystemInstruction;

            modelConfig.systemInstruction = finalSystemInstruction;
            console.log('🎨 Using System Instruction:', finalSystemInstruction === defaultSystemInstruction ? 'Default' : 'Custom');

            const model = genAI.getGenerativeModel(modelConfig);

            // 3. 建立編輯請求
            const requestParts = [
                prompt,
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType
                    }
                }
            ];

            const result = await model.generateContent(requestParts);

            const response = result.response;

            // 4. 從回應中提取圖片
            // Gemini 2.5 Flash Image 會在 candidates[0].content.parts 中回傳圖片
            if (!response.candidates || response.candidates.length === 0) {
                throw new Error('No candidates returned from Gemini');
            }

            const parts = response.candidates[0].content.parts;

            for (const part of parts) {
                // 檢查是否有圖片資料
                if (part.inlineData && part.inlineData.data) {
                    console.log('✅ Successfully received edited image from Gemini');
                    return part.inlineData.data;
                }
            }

            // 如果沒有找到圖片，檢查是否有文字回應
            const textParts = parts.filter((p: any) => p.text);
            if (textParts.length > 0) {
                const textResponse = textParts.map((p: any) => p.text).join('\n');
                throw new Error(`Gemini 未回傳圖片，而是回傳文字：${textResponse.substring(0, 200)}`);
            }

            throw new Error('Gemini 回應中未找到圖片資料');

        } catch (error: any) {
            console.error('Gemini Image Edit Error:', error);

            // 提供更友善的錯誤訊息
            if (error.message?.includes('API key')) {
                throw new Error('Gemini API Key 設定錯誤');
            }

            if (error.message?.includes('quota')) {
                throw new Error('Gemini API 配額已用盡，請稍後再試');
            }

            if (error.message?.includes('not found') || error.message?.includes('404')) {
                throw new Error('gemini-2.5-flash-image 模型不可用，請確認您的 API key 有權限使用此模型');
            }

            throw error;
        }
    }

    static async generateCaption(
        imageUrl: string,
        additionalInfo?: string
    ): Promise<{ caption: string; hashtags: string[] }> {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-09-2025' });

            // Download image to pass to Gemini
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
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
                prompt,
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

            return JSON.parse(text);

        } catch (error) {
            console.error('Error generating caption:', error);
            throw new Error('Failed to generate caption');
        }
    }
}