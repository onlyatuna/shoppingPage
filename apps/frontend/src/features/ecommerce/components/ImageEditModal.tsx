import { useState } from 'react';
import { X, Wand2, Loader2, Check } from 'lucide-react';
import apiClient from '../../../api/client';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    onImageEdited: (editedImageUrl: string) => void;
}

export default function ImageEditModal({ isOpen, onClose, imageUrl, onImageEdited }: Props) {
    const [prompt, setPrompt] = useState('');
    const [systemInstruction, setSystemInstruction] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editedImageBase64, setEditedImageBase64] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 預設 System Instruction
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

    // 四大風格預設
    const stylePresets = {
        minimalist: {
            name: '🤍 極簡風',
            description: '高冷極簡 (Muji/Apple)',
            prompt: 'Place the product on a clean, matte white podium. The background is a soft, abstract geometry with minimal details. Soft, diffused daylight coming from the left window. High-key lighting, airy atmosphere, clean lines. Style reference: Muji, Apple, Kinfolk magazine.'
        },
        luxury: {
            name: '💎 輕奢風',
            description: '輕奢質感 (Luxury/Cosmetic)',
            prompt: 'Place the product on a polished black marble surface with gold veining. The background is dark and moody with soft bokeh lights. Dramatic studio lighting, rim lighting highlighting the edges of the product. Elegant, expensive, premium look. Style reference: Chanel, high-end cosmetics advertisement.'
        },
        organic: {
            name: '🌿 自然風',
            description: '自然清新 (Organic/Nature)',
            prompt: 'Place the product on a rustic light oak wooden table. Surround the product with blurred green leaves and natural elements like stones or dried flowers in the background. Dappled sunlight filtering through trees (Gobo light effect). Warm, organic, fresh atmosphere. Style reference: Aesop, lifestyle photography.'
        },
        festival: {
            name: '🎉 節慶風',
            description: '節日慶典 (Festival/Seasonal)',
            prompt: 'Place the product in a festive setting. Background features soft, out-of-focus warm fairy lights and colorful holiday decorations (but not overwhelming). Warm color palette (red, gold, orange). Joyful, inviting, celebration atmosphere. Perfect for a holiday sale poster.'
        }
    };

    if (!isOpen) return null;

    const handleEdit = async () => {
        if (!prompt.trim()) {
            setError('請輸入編輯指令');
            return;
        }

        setIsEditing(true);
        setError(null);

        try {
            // 1. Optimize URL if it's a Cloudinary URL
            const targetImageUrl = imageUrl.includes('cloudinary.com')
                ? imageUrl.replace(/\/upload\//, '/upload/w_1024,c_limit,f_webp,q_auto/')
                : imageUrl;

            // 2. 呼叫 Gemini API 編輯圖片
            const res = await apiClient.post('/gemini/edit-image', {
                imageUrl: targetImageUrl,
                prompt: prompt.trim(),
                systemInstruction: systemInstruction.trim() || undefined
            });

            const { imageBase64 } = res.data.data;
            setEditedImageBase64(imageBase64);

        } catch (err: any) {
            console.error('Edit error:', err);
            setError(err.response?.data?.message || '編輯失敗，請稍後再試');
        } finally {
            setIsEditing(false);
        }
    };

    const handleApply = async () => {
        if (!editedImageBase64) return;

        setIsUploading(true);
        setError(null);

        try {
            // 2. 將 base64 轉為 Blob
            const byteCharacters = atob(editedImageBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });

            // 3. 上傳至 Cloudinary
            const formData = new FormData();
            formData.append('image', blob, 'edited-image.jpeg');

            const uploadRes = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const newUrl = uploadRes.data.data.url;

            // 4. 回傳新 URL 給父元件
            onImageEdited(newUrl);

            // 5. 關閉 modal
            handleClose();

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || '上傳失敗，請稍後再試');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setPrompt('');
        setSystemInstruction('');
        setShowAdvanced(false);
        setEditedImageBase64(null);
        setError(null);
        onClose();
    };

    const handleRetry = () => {
        setEditedImageBase64(null);
        setError(null);
    };

    const applyStylePreset = (styleKey: keyof typeof stylePresets) => {
        const style = stylePresets[styleKey];
        setPrompt(style.prompt);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-black"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-4">✨ 編輯圖片</h2>

                {/* 原始圖片預覽 */}
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">原始圖片</label>
                    <div className="relative aspect-video bg-gray-100 rounded overflow-hidden border">
                        <img
                            src={imageUrl}
                            alt="Original"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* 風格預設按鈕 */}
                {!editedImageBase64 && (
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">快速風格</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => applyStylePreset('minimalist')}
                                className="p-3 border-2 border-gray-200 rounded hover:border-blue-500 hover:bg-blue-50 transition text-left"
                                disabled={isEditing}
                            >
                                <div className="font-bold text-sm">{stylePresets.minimalist.name}</div>
                                <div className="text-xs text-gray-500">{stylePresets.minimalist.description}</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyStylePreset('luxury')}
                                className="p-3 border-2 border-gray-200 rounded hover:border-blue-500 hover:bg-blue-50 transition text-left"
                                disabled={isEditing}
                            >
                                <div className="font-bold text-sm">{stylePresets.luxury.name}</div>
                                <div className="text-xs text-gray-500">{stylePresets.luxury.description}</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyStylePreset('organic')}
                                className="p-3 border-2 border-gray-200 rounded hover:border-blue-500 hover:bg-blue-50 transition text-left"
                                disabled={isEditing}
                            >
                                <div className="font-bold text-sm">{stylePresets.organic.name}</div>
                                <div className="text-xs text-gray-500">{stylePresets.organic.description}</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyStylePreset('festival')}
                                className="p-3 border-2 border-gray-200 rounded hover:border-blue-500 hover:bg-blue-50 transition text-left"
                                disabled={isEditing}
                            >
                                <div className="font-bold text-sm">{stylePresets.festival.name}</div>
                                <div className="text-xs text-gray-500">{stylePresets.festival.description}</div>
                            </button>
                        </div>
                    </div>
                )}

                {/* 編輯後圖片預覽 */}
                {editedImageBase64 && (
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2 text-green-600">編輯後圖片</label>
                        <div className="relative aspect-video bg-gray-100 rounded overflow-hidden border border-green-500">
                            <img
                                src={`data:image/png;base64,${editedImageBase64}`}
                                alt="Edited"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                )}

                {/* 指令輸入 */}
                {!editedImageBase64 && (
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">編輯指令</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="例如：移除背景、更換成藍色背景、讓產品更亮..."
                            className="w-full border p-3 rounded resize-none"
                            rows={3}
                            maxLength={500}
                            disabled={isEditing}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {prompt.length} / 500 字元
                        </p>
                    </div>
                )}

                {/* Advanced Settings */}
                {!editedImageBase64 && (
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            {showAdvanced ? '▼' : '▶'} Advanced Settings
                        </button>

                        {showAdvanced && (
                            <div className="mt-3 p-4 bg-gray-50 rounded border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold">System Instruction</label>
                                    <button
                                        type="button"
                                        onClick={() => setSystemInstruction(defaultSystemInstruction)}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        使用預設提示詞
                                    </button>
                                </div>
                                <textarea
                                    value={systemInstruction}
                                    onChange={(e) => setSystemInstruction(e.target.value)}
                                    placeholder="選填：輸入系統指令以優化圖片品質（構圖、光影、細節等）"
                                    className="w-full border p-3 rounded resize-none text-sm font-mono bg-white"
                                    rows={6}
                                    disabled={isEditing}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    預設提示詞包含：構圖鎖定、細節增強、負向提示
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 錯誤訊息 */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* 按鈕區 */}
                <div className="flex gap-3">
                    {!editedImageBase64 ? (
                        <>
                            <button
                                onClick={handleClose}
                                className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
                                disabled={isEditing}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleEdit}
                                disabled={isEditing || !prompt.trim()}
                                className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isEditing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        AI 正在精細繪圖中 (預計 10-15 秒)...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={18} />
                                        開始編輯
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleRetry}
                                className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
                                disabled={isUploading}
                            >
                                重新編輯
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={isUploading}
                                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        上傳中...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        套用此圖片
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
