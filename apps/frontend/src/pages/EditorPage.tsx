import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
import ControlPanel from '../components/editor/ControlPanel';
import { StylePresetKey, presets } from '../components/editor/StylePresetGrid';
import ImageCanvas from '../components/editor/ImageCanvas';
import CopywritingAssistant from '../components/editor/CopywritingAssistant';
import ExportControls from '../components/editor/ExportControls';
import apiClient from '../api/client';
import { useLocation, useNavigate } from 'react-router-dom';
import LibraryModal from '../components/LibraryModal';
import { useMutation } from '@tanstack/react-query';
import ProductFormModal from '../components/ProductFormModal';
import { Product } from '../types';
import MobileBottomSheet from '../components/mobile/MobileBottomSheet';
import MobileWizardNav from '../components/mobile/MobileWizardNav';
import UploadZone from '../components/editor/UploadZone';
import StylePresetGrid from '../components/editor/StylePresetGrid';
import AdvancedAccordion from '../components/editor/AdvancedAccordion';
import { Sparkles } from 'lucide-react'; // For mobile trigger button icons

export default function EditorPage() {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    // Editor State
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<StylePresetKey | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    // Mobile specific state
    const [mobileStep, setMobileStep] = useState<'edit' | 'caption' | 'publish'>('edit');
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

    // Product Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productInitialData, setProductInitialData] = useState<Partial<Product> | null>(null);

    // Mutation for creating product
    const createProductMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiClient.post('/products', data);
        },
        onSuccess: () => {
            toast.success('🎉 商品上架成功！');
            setIsProductModalOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || '上架失敗')
    });

    // Initial load from navigation state (Library)
    useEffect(() => {
        if (location.state?.imageUrl) {
            setUploadedImage(location.state.imageUrl);
            setEditedImage(null);
            setGeneratedCaption(null);
            toast.success('已載入雲端圖片');
        }
    }, [location.state]);

    // Copywriting State
    const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
    const [captionPrompt, setCaptionPrompt] = useState('');
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

    // Handlers
    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setUploadedImage(e.target.result as string);
                setEditedImage(null); // Reset edited image
                setGeneratedCaption(null); // Reset caption
            }
        };
        reader.readAsDataURL(file);
    };

    const handleStyleSelect = (style: StylePresetKey) => {
        setSelectedStyle(style);
        const preset = presets.find(p => p.key === style);
        if (preset) {
            setPrompt(preset.prompt);
        }
    };

    const handleLibrarySelect = (imageUrl: string) => {
        setUploadedImage(imageUrl);
        setEditedImage(null); // Reset edited image
        setGeneratedCaption(null); // Reset caption
        setIsLibraryOpen(false);
        toast.success('已載入雲端圖片');
    };

    // Helper: Upload Base64 to Cloudinary
    const uploadBase64Image = async (base64Str: string): Promise<string | null> => {
        try {
            const res = await fetch(base64Str);
            const blob = await res.blob();
            const file = new File([blob], "image.png", { type: "image/png" });
            const formData = new FormData();
            formData.append('image', file);

            const uploadRes = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return uploadRes.data.data.url;
        } catch (error) {
            console.error('Upload failed', error);
            return null;
        }
    };

    const handleGenerate = async () => {
        if (!uploadedImage || !prompt) return;

        setIsProcessing(true);
        try {
            const response = await apiClient.post('/gemini/edit-image', {
                imageUrl: uploadedImage,
                prompt: prompt
            });

            const data = response.data.data ? response.data.data : response.data;
            let resultImage = '';

            // Check for data.imageBase64 format
            if (data.imageBase64) {
                resultImage = data.imageBase64;
            } else if (data.processedImage) {
                resultImage = data.processedImage;
            } else if (typeof data === 'string') {
                resultImage = data;
            }

            if (resultImage) {
                // Ensure base64 prefix
                const prefix = 'data:image/jpeg;base64,';
                let fullBase64 = resultImage;
                if (!resultImage.startsWith('data:image')) {
                    fullBase64 = `${prefix}${resultImage}`;
                }

                // 1. Show immediately (Base64)
                setEditedImage(fullBase64);
                toast.success('圖片生成成功！正在背景上傳...');

                // 2. Auto upload in background
                uploadBase64Image(fullBase64).then((url) => {
                    if (url) {
                        setEditedImage(url);
                        console.log('Auto-uploaded to Cloudinary:', url);
                        // Optional: Toast "Saved to cloud"
                    }
                });
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || '生成失敗，請重試');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateCaption = async () => {
        if (!editedImage && !uploadedImage) return;

        setIsGeneratingCaption(true);
        try {
            // Use edited image if available, otherwise original
            const targetImage = editedImage || uploadedImage;

            // Combine general prompt with specific caption prompt
            const finalPrompt = captionPrompt
                ? `${captionPrompt} (Style reference: ${prompt})`
                : prompt;

            const response = await apiClient.post('/gemini/caption', {
                imageUrl: targetImage,
                additionalInfo: finalPrompt
            });

            const data = response.data;
            setGeneratedCaption(`${data.caption}\n\n${data.hashtags.join(' ')}`);
            toast.success('文案生成成功！');

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || '文案生成失敗');
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const handleDownload = () => {
        if (!editedImage) return;
        const link = document.createElement('a');
        link.href = editedImage;
        link.download = `edited-product-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('已開始下載');
    };

    const handlePublish = async () => {
        // Allow publishing either edited OR original image
        let targetImage = editedImage || uploadedImage;
        if (!targetImage) return;

        // If Base64, try to upload first (redundancy check)
        if (targetImage.startsWith('data:')) {
            const uploadedUrl = await uploadBase64Image(targetImage);
            if (uploadedUrl) targetImage = uploadedUrl;
        }

        setIsProcessing(true);
        try {
            const response = await apiClient.post('/instagram/publish', {
                imageUrl: targetImage,
                // Use generated/manual caption OR prompt OR default
                caption: generatedCaption || prompt || 'Made with AI Editor'
            });

            toast.success('🎉 發佈成功！已上傳至 Instagram');
        } catch (error: any) {
            console.error(error);
            toast.error(`發佈失敗: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePublishProduct = async () => {
        let targetImage = editedImage || uploadedImage;
        if (!targetImage) return;

        // If it's a Base64 string, upload it first
        if (targetImage.startsWith('data:')) {
            const toastId = toast.loading('正在上傳圖片...');
            const url = await uploadBase64Image(targetImage);

            if (url) {
                targetImage = url;
                toast.success('圖片上傳完成，準備上架...', { id: toastId });
            } else {
                toast.error('圖片上傳失敗，無法繼續上架', { id: toastId });
                return;
            }
        }

        // Open Modal instead of Navigation
        setProductInitialData({
            name: '',
            price: '0',
            stock: 10,
            isActive: true,
            images: [targetImage],
            description: generatedCaption || prompt || ''
        });
        setIsProductModalOpen(true);
    };

    const handleProductSubmit = (data: any) => {
        createProductMutation.mutate(data);
    };

    // Mobile Navigation Handlers
    const handleMobileNext = () => {
        if (mobileStep === 'edit') setMobileStep('caption');
        else if (mobileStep === 'caption') setMobileStep('publish');
    };

    const handleMobileBack = () => {
        if (mobileStep === 'caption') setMobileStep('edit');
        else if (mobileStep === 'publish') setMobileStep('caption');
    };

    const canGoNext = () => {
        if (mobileStep === 'edit') return !!(uploadedImage || editedImage); // Need image
        if (mobileStep === 'caption') return true; // Can skip caption
        return false;
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-50 dark:bg-[#1e1e1e] transition-colors flex">
            {/* Theme Toggle Button - Fixed Position */}
            <button
                onClick={toggleTheme}
                className="fixed top-4 right-6 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 transition-all"
                aria-label="Toggle theme"
            >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Library Modal */}
            <LibraryModal
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                onSelect={handleLibrarySelect}
            />

            {/* Product Modal */}
            <ProductFormModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSubmit={handleProductSubmit}
                initialData={productInitialData}
                isPending={createProductMutation.isPending}
            />

            {/* Left Panel - Control Panel (Desktop Only) */}
            <div className="hidden md:block h-full">
                <ControlPanel
                    uploadedImage={uploadedImage}
                    onImageUpload={handleImageUpload}
                    onOpenLibrary={() => setIsLibraryOpen(true)}
                    selectedStyle={selectedStyle}
                    onSelectStyle={handleStyleSelect}
                    prompt={prompt}
                    onPromptChange={setPrompt}
                    isProcessing={isProcessing}
                    onGenerate={handleGenerate}
                />
            </div>

            {/* Center Stage - Canvas */}
            {/* Show on Mobile only if step is 'edit'. Show on Desktop always. */}
            <div className={`
                flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative
                ${mobileStep !== 'edit' ? 'hidden md:flex' : 'flex'}
            `}>
                <ImageCanvas
                    originalImage={uploadedImage}
                    editedImage={editedImage}
                    isProcessing={isProcessing}
                    onRegenerate={handleGenerate}
                />

                {/* Mobile Trigger Button for Bottom Sheet (Only in Edit step and visible on mobile) */}
                <button
                    onClick={() => setIsMobileSheetOpen(true)}
                    className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#2d2d2d] rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold z-30"
                >
                    <Sparkles size={18} className="text-blue-500" />
                    <span>更換風格 / 上傳</span>
                </button>
            </div>

            {/* Mobile View: Caption Step */}
            <div className={`flex-1 p-6 pb-32 overflow-y-auto ${mobileStep === 'caption' ? 'block md:hidden' : 'hidden'}`}>
                <h2 className="text-xl font-bold mb-4">AI 文案助手</h2>
                <CopywritingAssistant
                    generatedCaption={generatedCaption}
                    onCaptionChange={setGeneratedCaption}
                    captionPrompt={captionPrompt}
                    onCaptionPromptChange={setCaptionPrompt}
                    isGenerating={isGeneratingCaption}
                    onGenerate={handleGenerateCaption}
                    disabled={(!uploadedImage && !editedImage) || isProcessing}
                />
            </div>

            {/* Mobile View: Publish Step */}
            <div className={`flex-1 p-6 pb-32 overflow-y-auto ${mobileStep === 'publish' ? 'block md:hidden' : 'hidden'}`}>
                <h2 className="text-xl font-bold mb-4">發佈與匯出</h2>
                {/* Preview Image small */}
                {(editedImage || uploadedImage) && (
                    <div className="mb-6 w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img src={editedImage || uploadedImage || ''} className="w-full h-full object-contain" />
                    </div>
                )}
                <ExportControls
                    onDownload={handleDownload}
                    onPublishInstagram={handlePublish}
                    onPublishProduct={handlePublishProduct}
                    disabled={(!editedImage && !uploadedImage) || isProcessing}
                />
            </div>

            {/* Right Panel - Action Panel (Desktop Only) */}
            <div className="hidden md:flex w-[280px] bg-white dark:bg-[#2d2d2d] border-l border-gray-200 dark:border-gray-700 flex-col h-full z-10">
                <div className="p-6 flex-1 overflow-y-auto flex flex-col custom-scrollbar">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        操作面板
                    </h2>

                    <CopywritingAssistant
                        generatedCaption={generatedCaption}
                        onCaptionChange={setGeneratedCaption}
                        captionPrompt={captionPrompt}
                        onCaptionPromptChange={setCaptionPrompt}
                        isGenerating={isGeneratingCaption}
                        onGenerate={handleGenerateCaption}
                        // Allow generating caption even if only uploaded image exists
                        disabled={(!uploadedImage && !editedImage) || isProcessing}
                    />

                    <div className="mt-auto pt-6">
                        <ExportControls
                            onDownload={handleDownload}
                            onPublishInstagram={handlePublish}
                            onPublishProduct={handlePublishProduct}
                            // Allow publish if ANY image exists
                            disabled={(!editedImage && !uploadedImage) || isProcessing}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Components */}
            <MobileBottomSheet
                isOpen={isMobileSheetOpen}
                onClose={() => setIsMobileSheetOpen(false)}
                title="編輯設定"
            >
                <UploadZone
                    onImageUpload={handleImageUpload}
                    onOpenLibrary={() => {
                        setIsLibraryOpen(true);
                        setIsMobileSheetOpen(false); // Close sheet when opening library
                    }}
                    uploadedImage={uploadedImage}
                />

                <StylePresetGrid
                    selectedStyle={selectedStyle}
                    onSelectStyle={(s) => {
                        handleStyleSelect(s);
                        // Optional: Close sheet on select? No, user might want to generate immediately.
                    }}
                    disabled={isProcessing}
                />

                <AdvancedAccordion
                    prompt={prompt}
                    onPromptChange={setPrompt}
                    disabled={isProcessing}
                />

                <button
                    onClick={() => {
                        handleGenerate();
                        setIsMobileSheetOpen(false); // Close sheet to show generation
                    }}
                    disabled={!uploadedImage || !prompt || isProcessing}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 mt-4"
                >
                    {isProcessing ? 'AI 設計中...' : '✨ 開始設計'}
                </button>
            </MobileBottomSheet>

            <MobileWizardNav
                step={mobileStep}
                onNext={handleMobileNext}
                onBack={mobileStep !== 'edit' ? handleMobileBack : undefined}
                canGoNext={canGoNext()}
                nextLabel={mobileStep === 'publish' ? '完成' : undefined}
                isProcessing={isProcessing}
            />
        </div>
    );
}
