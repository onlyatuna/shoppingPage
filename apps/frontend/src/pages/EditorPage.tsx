import { useState, useEffect } from 'react';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
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
import StylePresetGrid from '../components/editor/StylePresetGrid';
import { Sparkles } from 'lucide-react'; // For mobile trigger button icons
import useSwipe from '../hooks/useSwipe';
import CustomStyleModal, { CustomStyle } from '../components/editor/CustomStyleModal';
import FrameSelector from '../components/editor/FrameSelector';
import FrameUploadModal from '../components/editor/FrameUploadModal';
import { Frame } from '../types/frame';

export default function EditorPage() {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    // Editor State
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<StylePresetKey | string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    // Custom Styles State
    const [customStyles, setCustomStyles] = useState<CustomStyle[]>([]);
    const [isCustomStyleModalOpen, setIsCustomStyleModalOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState<CustomStyle | null>(null);

    // Frame State
    const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
    const [customFrames, setCustomFrames] = useState<Frame[]>([]);
    const [isFrameSelectorOpen, setIsFrameSelectorOpen] = useState(false);
    const [isFrameUploadOpen, setIsFrameUploadOpen] = useState(false);

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

    // Load custom styles and frames from localStorage/backend on mount
    useEffect(() => {
        // Load custom frames from localStorage
        const storedFrames = localStorage.getItem('customFrames');
        if (storedFrames) {
            setCustomFrames(JSON.parse(storedFrames));
        }

        // Load custom styles from backend API
        const loadCustomStyles = async () => {
            try {
                const response = await apiClient.get('/custom-styles');
                if (response.data.success) {
                    // Convert backend format to frontend format
                    const styles = response.data.data.map((style: any) => ({
                        id: style.id, // Database ID for deletion
                        key: style.key,
                        name: style.name,
                        engName: style.engName,
                        desc: style.desc,
                        icon: style.icon,
                        color: style.color,
                        borderColor: style.borderColor,
                        prompt: style.prompt,
                        preview: style.preview
                    }));
                    console.log('📥 Loaded custom styles from backend:', styles);
                    setCustomStyles(styles);
                }
            } catch (error) {
                console.error('Failed to load custom styles from backend:', error);
                // Fallback to localStorage if API fails
                const storedStyles = localStorage.getItem('customStyles');
                if (storedStyles) {
                    setCustomStyles(JSON.parse(storedStyles));
                }
            }
        };

        loadCustomStyles();
    }, []);

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

    const handleStyleSelect = (style: StylePresetKey | string) => {
        setSelectedStyle(style);

        // Find preset in default or custom styles
        const preset = presets.find(p => p.key === style);
        const customPreset = customStyles.find(c => c.key === style);

        if (preset) {
            setPrompt(preset.prompt);
        } else if (customPreset) {
            setPrompt(customPreset.prompt);
        }

        // Auto-generate if image is uploaded
        if (uploadedImage && !isProcessing) {
            // Use setTimeout to ensure state is updated before generation
            setTimeout(() => {
                handleGenerate();
            }, 100);
        }
    };

    const handleSaveCustomStyle = async (customStyle: CustomStyle) => {
        try {
            const isEditing = editingStyle !== null;
            console.log('💾 Saving custom style:', { isEditing, customStyle, editingStyle });

            if (isEditing) {
                // Update existing style in backend
                if (customStyle.id) {
                    console.log('🔄 Updating style with ID:', customStyle.id);
                    try {
                        const response = await apiClient.put(`/custom-styles/${customStyle.id}`, customStyle);
                        console.log('✅ Backend update response:', response.data);

                        if (response.data.success) {
                            const updatedStyles = customStyles.map(s =>
                                s.key === customStyle.key ? customStyle : s
                            );
                            setCustomStyles(updatedStyles);
                            localStorage.setItem('customStyles', JSON.stringify(updatedStyles));
                            toast.success(`✨ 已更新風格：${customStyle.name}`);
                        }
                    } catch (apiError) {
                        console.error('❌ Backend update failed:', apiError);
                        // Fallback to localStorage
                        const updatedStyles = customStyles.map(s =>
                            s.key === customStyle.key ? customStyle : s
                        );
                        setCustomStyles(updatedStyles);
                        localStorage.setItem('customStyles', JSON.stringify(updatedStyles));
                        toast.warning(`⚠️ 風格已更新（僅本機）`);
                    }
                } else {
                    console.warn('⚠️ No ID for editing style, saving locally only');
                    // No ID means not saved to backend yet, just update locally
                    const updatedStyles = customStyles.map(s =>
                        s.key === customStyle.key ? customStyle : s
                    );
                    setCustomStyles(updatedStyles);
                    localStorage.setItem('customStyles', JSON.stringify(updatedStyles));
                    toast.success(`✨ 已更新風格：${customStyle.name}`);
                }
            } else {
                // Create new style
                const response = await apiClient.post('/custom-styles', customStyle);

                if (response.data.success) {
                    // Use the returned style from backend which includes the database ID
                    const savedStyle = {
                        ...customStyle,
                        id: response.data.data.id // Add database ID from backend response
                    };
                    const updatedStyles = [...customStyles, savedStyle];
                    setCustomStyles(updatedStyles);
                    localStorage.setItem('customStyles', JSON.stringify(updatedStyles));
                    toast.success(`✨ 已新增自訂風格：${customStyle.name}`);
                }
            }

            setEditingStyle(null); // Reset editing state
        } catch (error: any) {
            console.error('Failed to save custom style:', error);
            // Fallback to localStorage only if API fails
            const isEditing = editingStyle !== null;
            let updatedStyles;
            if (isEditing) {
                updatedStyles = customStyles.map(s =>
                    s.key === customStyle.key ? customStyle : s
                );
            } else {
                updatedStyles = [...customStyles, customStyle];
            }
            setCustomStyles(updatedStyles);
            localStorage.setItem('customStyles', JSON.stringify(updatedStyles));
            toast.warning(`⚠️ 風格已儲存至本機（同步失敗）`);
        }
    };

    const handleDeleteCustomStyle = async (styleKey: string) => {
        try {
            // Find the style to delete
            const styleToDelete = customStyles.find(s => s.key === styleKey);
            if (!styleToDelete) return;

            // Update local state immediately for better UX
            const updatedStyles = customStyles.filter(s => s.key !== styleKey);
            setCustomStyles(updatedStyles);
            localStorage.setItem('customStyles', JSON.stringify(updatedStyles));

            // Delete from backend using database ID
            if (styleToDelete.id) {
                try {
                    await apiClient.delete(`/custom-styles/${styleToDelete.id}`);
                    toast.success('✨ 風格已刪除');
                } catch (apiError) {
                    console.error('Backend deletion failed:', apiError);
                    toast.warning('⚠️ 風格已刪除（僅本機）');
                }
            } else {
                // If no ID (newly created, not yet saved to backend), just remove locally
                toast.success('✨ 風格已刪除');
            }
        } catch (error) {
            console.error('Failed to delete custom style:', error);
            toast.error('刪除風格失敗');
        }
    };

    const handleLibrarySelect = (imageUrl: string) => {
        setUploadedImage(imageUrl);
        setEditedImage(null); // Reset edited image
        setGeneratedCaption(null); // Reset caption
        setIsLibraryOpen(false);
        toast.success('已載入雲端圖片');
    };

    const handleRemoveImage = () => {
        setUploadedImage(null);
        setEditedImage(null); // Reset edited image
        setGeneratedCaption(null); // Reset caption
        // setPrompt(''); // Keep prompt? Let's keep it for improved UX if they re-upload similar image.
        toast.info('已移除圖片');
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

    // Helper: Compose image with frame on canvas
    const composeImageWithFrame = async (imageUrl: string, frameUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            const image = new Image();
            image.crossOrigin = 'anonymous';

            image.onload = () => {
                // Set canvas size to match image
                canvas.width = image.width;
                canvas.height = image.height;

                // Draw the base image
                ctx.drawImage(image, 0, 0);

                // Load and draw the frame
                const frame = new Image();
                frame.crossOrigin = 'anonymous';

                frame.onload = () => {
                    // Draw frame on top with object-cover effect
                    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

                    // Convert to base64
                    const composedImage = canvas.toDataURL('image/png');
                    resolve(composedImage);
                };

                frame.onerror = () => {
                    reject(new Error('Failed to load frame'));
                };

                frame.src = frameUrl;
            };

            image.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            image.src = imageUrl;
        });
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

    const handleDownload = async () => {
        // Allow downloading either edited OR uploaded image
        let downloadImage = editedImage || uploadedImage;
        if (!downloadImage) return;

        // Compose frame with image if frame is selected
        if (selectedFrame && selectedFrame.id !== 'none') {
            try {
                downloadImage = await composeImageWithFrame(downloadImage, selectedFrame.url);
            } catch (error) {
                console.error('Frame composition failed:', error);
                toast.error('圖框合成失敗，將下載原圖');
            }
        }

        const link = document.createElement('a');
        link.href = downloadImage;
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

        // Compose frame with image if frame is selected
        if (selectedFrame && selectedFrame.id !== 'none') {
            try {
                const composedImage = await composeImageWithFrame(targetImage, selectedFrame.url);
                targetImage = composedImage;
            } catch (error) {
                console.error('Frame composition failed:', error);
                toast.error('圖框合成失敗，將使用原圖發布');
            }
        }

        // If Base64, try to upload first (redundancy check)
        if (targetImage.startsWith('data:')) {
            const uploadedUrl = await uploadBase64Image(targetImage);
            if (uploadedUrl) targetImage = uploadedUrl;
        }

        // Don't set isProcessing here - ExportControls has its own loading state
        try {
            await apiClient.post('/instagram/publish', {
                imageUrl: targetImage,
                // Use generated/manual caption OR prompt OR default
                caption: generatedCaption || prompt || 'Made with AI Editor'
            });

            toast.success('🎉 發佈成功！已上傳至 Instagram');
        } catch (error: any) {
            console.error(error);
            toast.error(`發佈失敗: ${error.response?.data?.message || error.message}`);
        }
    };

    const handlePublishProduct = async () => {
        let targetImage = editedImage || uploadedImage;
        if (!targetImage) return;

        // Compose frame with image if frame is selected
        if (selectedFrame && selectedFrame.id !== 'none') {
            try {
                targetImage = await composeImageWithFrame(targetImage, selectedFrame.url);
            } catch (error) {
                console.error('Frame composition failed:', error);
                toast.error('圖框合成失敗，將使用原圖上架');
            }
        }

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
        return false;
    };

    // Swipe Handling
    const swipeHandlers = useSwipe({
        onSwipeLeft: () => {
            // Only allow swipe next if allowed (like button)
            // And maybe exclude 'edit' step if it interferes with canvas panning, 
            // but let's try allowing it for now. Canvas panning usually requires 2 fingers or specific drag.
            // If this becomes annoying we can add `if (mobileStep !== 'edit')`
            if (canGoNext()) handleMobileNext();
        },
        onSwipeRight: () => {
            if (mobileStep !== 'edit') handleMobileBack();
        },
    });

    return (
        <div
            className="h-screen overflow-hidden bg-gray-50 dark:bg-[#1e1e1e] transition-colors flex flex-col"
            {...swipeHandlers}
        >
            {/* Header */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    {/* Optional: Add Title or Logo here if needed */}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">

                {/* Library Modal */}
                <LibraryModal
                    isOpen={isLibraryOpen}
                    onClose={() => setIsLibraryOpen(false)}
                    onSelect={handleLibrarySelect}
                />

                {/* Custom Style Modal */}
                <CustomStyleModal
                    isOpen={isCustomStyleModalOpen}
                    onClose={() => {
                        setIsCustomStyleModalOpen(false);
                        setEditingStyle(null); // Reset editing style on close
                    }}
                    onSave={handleSaveCustomStyle}
                    initialStyle={editingStyle}
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
                    <StylePresetGrid
                        selectedStyle={selectedStyle}
                        onSelectStyle={setSelectedStyle}
                        customStyles={customStyles}
                        onAddCustomStyle={() => setIsCustomStyleModalOpen(true)}
                        onEditCustomStyle={(style) => {
                            setEditingStyle(style);
                            setIsCustomStyleModalOpen(true);
                        }}
                        onDeleteCustomStyle={handleDeleteCustomStyle}
                        disabled={isProcessing}
                    />
                </div>

                {/* Center Stage - Canvas */}
                {/* Show on Mobile only if step is 'edit'. Show on Desktop always. */}
                <div className={`
                flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative
                ${mobileStep !== 'edit' ? 'hidden md:flex' : 'flex'}
            `}>
                    {/* Mobile Style Change Button (Top Right on Mobile) */}
                    <button
                        type="button"
                        onClick={() => setIsMobileSheetOpen(true)}
                        className="md:hidden absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#2d2d2d] rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-medium z-30 text-sm"
                    >
                        <Sparkles size={16} className="text-blue-500" />
                        <span>風格</span>
                    </button>

                    <ImageCanvas
                        originalImage={uploadedImage}
                        editedImage={editedImage}
                        isProcessing={isProcessing}
                        onRegenerate={handleGenerate}
                        onImageUpload={handleImageUpload}
                        onOpenLibrary={() => setIsLibraryOpen(true)}
                        onRemove={handleRemoveImage}
                        onSelectFrame={() => setIsFrameSelectorOpen(true)}
                        selectedFrame={selectedFrame}
                    />
                </div>

                {/* Mobile View: Caption Step */}
                <div className={`flex-1 p-6 pb-32 overflow-y-auto ${mobileStep === 'caption' ? 'block md:hidden' : 'hidden'}`}>
                    <h2 className="text-xl font-bold mb-4">AI 文案助手</h2>
                    <CopywritingAssistant
                        instanceId="mobile-caption"
                        imageUrl={editedImage || uploadedImage}
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
                    {/* Preview Image with Frame */}
                    {(editedImage || uploadedImage) && (
                        <div className="mb-6 w-full aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                            <img src={editedImage || uploadedImage || ''} className="w-full h-full object-contain" />
                            {/* Frame Overlay */}
                            {selectedFrame && selectedFrame.id !== 'none' && (
                                <img
                                    src={selectedFrame.url}
                                    alt="Frame"
                                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                />
                            )}
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
                            instanceId="desktop-caption"
                            imageUrl={editedImage || uploadedImage}
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
                    <StylePresetGrid
                        selectedStyle={selectedStyle}
                        onSelectStyle={(s) => {
                            handleStyleSelect(s);
                            setIsMobileSheetOpen(false); // Close sheet after selection for auto-generation
                        }}
                        customStyles={customStyles}
                        onAddCustomStyle={() => setIsCustomStyleModalOpen(true)}
                        onEditCustomStyle={(style) => {
                            setEditingStyle(style);
                            setIsCustomStyleModalOpen(true);
                        }}
                        onDeleteCustomStyle={handleDeleteCustomStyle}
                        disabled={isProcessing}
                    />
                </MobileBottomSheet>

                <MobileWizardNav
                    step={mobileStep}
                    onNext={handleMobileNext}
                    onBack={mobileStep !== 'edit' ? handleMobileBack : undefined}
                    canGoNext={canGoNext()}
                    nextLabel={mobileStep === 'publish' ? '完成' : undefined}
                    isProcessing={isProcessing}
                />
                {/* Close Main Content Area */}
            </div>

            {/* Frame Selection Modal */}
            <FrameSelector
                isOpen={isFrameSelectorOpen}
                onClose={() => setIsFrameSelectorOpen(false)}
                selectedFrame={selectedFrame}
                onSelectFrame={setSelectedFrame}
                customFrames={customFrames}
                onUploadFrame={() => {
                    setIsFrameSelectorOpen(false);
                    setIsFrameUploadOpen(true);
                }}
            />

            {/* Frame Upload Modal */}
            <FrameUploadModal
                isOpen={isFrameUploadOpen}
                onClose={() => setIsFrameUploadOpen(false)}
                onSave={(frame) => {
                    setCustomFrames(prev => [...prev, frame]);
                    localStorage.setItem('customFrames', JSON.stringify([...customFrames, frame]));
                }}
            />
        </div>
    );
}
