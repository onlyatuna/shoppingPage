import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Undo2, Loader2, Camera, Upload, Cloud } from 'lucide-react';
import { toast } from 'sonner';
import EditorLayout from '../components/layouts/EditorLayout';
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

import CustomStyleModal, { CustomStyle } from '../components/editor/CustomStyleModal';
import FrameSelector from '../components/editor/FrameSelector';
import FrameUploadModal from '../components/editor/FrameUploadModal';
import { Frame } from '../types/frame';
import MockupGrid from '../components/editor/MockupGrid';
import { UniversalMockup, Mockup, PrintableMockup } from '../types/mockup';

export default function EditorPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Canvas container ref and dynamic height
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [canvasHeight, setCanvasHeight] = useState('100%');

    // Editor State
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<StylePresetKey | string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isCropping, setIsCropping] = useState(false); // Cropping state lifted up

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
    const [isMobileCaptionExpanded, setIsMobileCaptionExpanded] = useState(false);
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
    const [mobileTab, setMobileTab] = useState<'style' | 'mockup' | 'upload'>('style'); // Tab 切换状态

    // Mockup State
    const [selectedMockup, setSelectedMockup] = useState<UniversalMockup | null>(null);
    const [isAIBlending, setIsAIBlending] = useState(false); // AI Blend 加载状态
    const [beforeBlendImage, setBeforeBlendImage] = useState<string | null>(null); // 用于 Undo
    const [isMockupLoading, setIsMockupLoading] = useState(false); // Mockup 图片预加载状态

    // [NEW] 新增商品位置狀態
    // 預設值：x, y 居中 (0.5), scale 0.6
    const [productPosition, setProductPosition] = useState({ x: 0.5, y: 0.5, scale: 0.6 });

    // Draggable style button state
    const [styleButtonPosition, setStyleButtonPosition] = useState({ x: window.innerWidth - 120, y: 72 }); // y: 72 避免被 header 遮住
    const [isDraggingStyleButton, setIsDraggingStyleButton] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const dragMoveDistance = useRef(0);

    // Panel collapse state
    const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
    const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

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

    // Draggable style button logic
    const handleStyleButtonDragStart = (e: React.TouchEvent | React.MouseEvent) => {
        e.stopPropagation();
        setIsDraggingStyleButton(true);
        dragMoveDistance.current = 0;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragStart({
            x: clientX - styleButtonPosition.x,
            y: clientY - styleButtonPosition.y
        });
    };

    useEffect(() => {
        if (!isDraggingStyleButton) return;

        const handleMove = (e: TouchEvent | MouseEvent) => {
            e.preventDefault();
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

            const newX = clientX - dragStart.x;
            const newY = clientY - dragStart.y;

            // Calculate move distance for click detection
            const moveDistance = Math.sqrt(
                Math.pow(newX - styleButtonPosition.x, 2) +
                Math.pow(newY - styleButtonPosition.y, 2)
            );
            dragMoveDistance.current = Math.max(dragMoveDistance.current, moveDistance);

            // Boundary limits (根据屏幕尺寸动态调整)
            const isTabletPortrait = window.innerWidth >= 640;
            const buttonWidth = isTabletPortrait ? 100 : 50;  // 平板更大
            const buttonHeight = isTabletPortrait ? 100 : 50; // 平板更大
            const headerHeight = isTabletPortrait ? 80 : 56; // 平板 header 80px (h-20), 手机 56px (h-14)
            const maxX = window.innerWidth - buttonWidth;
            const maxY = window.innerHeight - buttonHeight - 80; // Leave space for bottom nav

            setStyleButtonPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(headerHeight, Math.min(newY, maxY)) // 最小 y 为 header 高度
            });
        };

        const handleEnd = () => {
            setIsDraggingStyleButton(false);
            // Save position to localStorage
            localStorage.setItem('styleButtonPosition', JSON.stringify(styleButtonPosition));
        };

        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('mouseup', handleEnd);

        return () => {
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('mouseup', handleEnd);
        };
    }, [isDraggingStyleButton, dragStart, styleButtonPosition]);

    // Load saved position on mount
    useEffect(() => {
        const saved = localStorage.getItem('styleButtonPosition');
        if (saved) {
            try {
                const position = JSON.parse(saved);
                // Validate position is within current screen bounds (根据屏幕尺寸动态调整)
                const isTabletPortrait = window.innerWidth >= 640;
                const buttonWidth = isTabletPortrait ? 80 : 57;  // 平板更大
                const buttonHeight = isTabletPortrait ? 80 : 57; // 平板更大
                const headerHeight = isTabletPortrait ? 80 : 56; // 平板 header 80px (h-20), 手机 56px (h-14)
                const maxX = window.innerWidth - buttonWidth;
                const maxY = window.innerHeight - buttonHeight - 80;

                setStyleButtonPosition({
                    x: Math.max(0, Math.min(position.x, maxX)),
                    y: Math.max(headerHeight, Math.min(position.y, maxY)) // 确保不被 header 遮住
                });
            } catch (e) {
                console.error('Failed to parse saved position');
            }
        }
    }, []);

    // Reset zoom and pan on new upload
    useEffect(() => {
        // This effect is handled by ImageCanvas internally
    }, [uploadedImage]);

    // Dynamic canvas height calculation
    useEffect(() => {
        const calculateHeight = () => {
            if (canvasContainerRef.current) {
                const topOffset = canvasContainerRef.current.getBoundingClientRect().top;
                const windowHeight = window.innerHeight;
                const availableHeight = windowHeight - topOffset;
                setCanvasHeight(`${availableHeight}px`);
            }
        };

        calculateHeight();
        window.addEventListener('resize', calculateHeight);
        return () => window.removeEventListener('resize', calculateHeight);
    }, []);

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

    // Helper: Check if user has unsaved changes
    const hasUnsavedChanges = () => {
        return !!(uploadedImage || editedImage || generatedCaption);
    };

    // Warn user before leaving page with unsaved changes (Desktop Refresh/Close)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = ''; // Required for Chrome
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [uploadedImage, editedImage, generatedCaption]);

    // Prevent accidental exit (popstate) for mobile
    // Track if we have pushed a history state for the current dirty session
    const historyPushed = useRef(false);

    // Prevent accidental exit (popstate) for mobile
    useEffect(() => {
        const handlePopState = () => {
            // Prevent default behavior implies we handle the state
            if (hasUnsavedChanges()) {
                // We are here because the user pressed Back.
                // The history has already popped (we are at length-1).

                const confirmLeave = window.confirm('確定要離開嗎？您的編輯內容將會遺失。');

                if (!confirmLeave) {
                    // User stays. We need to push the state BACK to restore the "trap".
                    window.history.pushState(null, '', window.location.href);
                } else {
                    // User wants to leave.
                    // We are ALREADY at the previous state (because popstate happened).
                    // So we just need to let it be.
                    // BUT: if we want to force go back further (e.g. to home), we might need navigate(-1).
                    // Typically, pressing back once is enough if we don't interfere.

                    // Ideally, we should clean up.
                    setUploadedImage(null); // Clear dirty state so any subsequent leave is clean
                    historyPushed.current = false;
                    // Force navigation to home to break loop
                    setTimeout(() => navigate('/'), 0);
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [uploadedImage, editedImage, generatedCaption]);

    // Separate effect to push state ONCE when becoming dirty
    useEffect(() => {
        const isDirty = hasUnsavedChanges();

        if (isDirty && !historyPushed.current) {
            window.history.pushState(null, '', window.location.href);
            historyPushed.current = true;
        } else if (!isDirty) {
            // If we become clean (e.g. saved or cleared), reset the tracking
            // Note: we don't pop state here automatically because that might be confusing.
            // We just reset internal tracking. 
            // BUT: if we are "forward" in the trap state, and user saves, we are still "forward".
            // Ideally we shouldn't mess with it too much.
            // Just reset ref so if they dirty it again, we push again? 
            // No, if we are still on the "pushed" state, pushing again would stack.
            // Let's keep it simple: Only push if we transitioned from clean -> dirty.
            // If we save, we might want to clear historyPushed? 
            // For now, let's just handle the loop fix.
            historyPushed.current = false;
        }
    }, [!!uploadedImage, !!editedImage, !!generatedCaption]);

    // Handlers
    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setUploadedImage(e.target.result as string);
                setEditedImage(null);
                setGeneratedCaption(null);
                setSelectedMockup(null);
                setBeforeBlendImage(null); // [Reset]
            }
        };
        reader.readAsDataURL(file);
    };

    const handleStyleSelect = (style: StylePresetKey | string) => {
        setSelectedStyle(style);

        // Find preset in default or custom styles
        const preset = presets.find(p => p.key === style);
        const customPreset = customStyles.find(c => c.key === style);

        let newPrompt = '';
        if (preset) {
            newPrompt = preset.prompt;
        } else if (customPreset) {
            newPrompt = customPreset.prompt;
        }

        setPrompt(newPrompt);

        // Auto-generate if image is uploaded
        if (uploadedImage && !isProcessing) {
            handleGenerate(newPrompt);
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
        setSelectedMockup(null); // Reset mockup selection
        setIsLibraryOpen(false);
        toast.success('已載入雲端圖片');
    };

    const handleRemoveImage = () => {
        setUploadedImage(null);
        setEditedImage(null);
        setGeneratedCaption(null);
        setSelectedMockup(null);
        setBeforeBlendImage(null); // [Reset]
        toast.info('已移除圖片');
    };

    // Helper: Preload Mockup Images
    const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };

    const preloadMockupImages = async (mockup: UniversalMockup): Promise<void> => {
        const urlsToLoad: string[] = [];
        if (mockup.type === 'scene') {
            const m = mockup as Mockup;
            if (m.backgroundUrl) urlsToLoad.push(m.backgroundUrl);
            if (m.overlayUrl) urlsToLoad.push(m.overlayUrl);
            if (m.maskUrl) urlsToLoad.push(m.maskUrl);
        } else { // 'printable'
            const m = mockup as PrintableMockup;
            if (m.blankObjectUrl) urlsToLoad.push(m.blankObjectUrl);
            if (m.printableAreaMaskUrl) urlsToLoad.push(m.printableAreaMaskUrl);
        }

        try {
            await Promise.all(urlsToLoad.map(url => loadImage(url)));
            console.log('✅ Mockup images preloaded:', mockup.name);
        } catch (error) {
            console.warn('⚠️ Failed to preload some mockup images:', error);
            // 不抛出错误，允许继续使用
        }
    };

    // Helper: Upload Base64 to Cloudinary
    const uploadBase64Image = async (base64Str: string, type: string = 'product', subfolder: string = ''): Promise<string | null> => {
        try {
            const res = await fetch(base64Str);
            const blob = await res.blob();
            const file = new File([blob], "image.png", { type: "image/png" });
            const formData = new FormData();
            formData.append('image', file);
            formData.append('type', type);
            if (subfolder) {
                formData.append('subfolder', subfolder);
            }

            const uploadRes = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return uploadRes.data.data.url;
        } catch (error) {
            console.error('Upload failed', error);
            return null;
        }
    };

    // [NEW] Helper: Configure mockup defaults
    const configureMockupDefaults = (mockup: UniversalMockup | null) => {
        if (!mockup) {
            // No mockup, reset to center
            setProductPosition({ x: 0.5, y: 0.5, scale: 0.6 });
            return;
        }

        // Use placement from mockup config if available
        if (mockup.placement) {
            setProductPosition({
                x: mockup.placement.x,
                y: mockup.placement.y,
                scale: mockup.placement.scale
            });
            console.log('📍 Applied mockup placement defaults:', mockup.placement);
        } else {
            // Default fallbacks based on type
            if (mockup.type === 'printable') {
                setProductPosition({ x: 0.5, y: 0.5, scale: 0.4 }); // Smaller default for logos
            } else {
                setProductPosition({ x: 0.5, y: 0.5, scale: 0.6 });
            }
        }
    };

    // [NEW] Effect: Apply defaults when mockup changes
    useEffect(() => {
        configureMockupDefaults(selectedMockup);
    }, [selectedMockup?.id]); // Only run when ID changes to avoid reset during dragging

    // Helper: Compose image with frame on canvas
    const composeImageWithFrame = async (imageUrl: string, frameUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            // Enable anti-aliasing from the start
            const ctx = canvas.getContext('2d', {
                alpha: true,
                willReadFrequently: false // Optimizing for export
            });

            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // Enable high-quality image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

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

    // [NEW] Helper: Compose image with Mockup (Background + Product + Overlay)
    const composeImageWithMockup = (productUrl: string, mockup: UniversalMockup): Promise<string> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            // Dimensions will be set on image load
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No context');

            const isPrintable = mockup.type === 'printable';
            const bgImg = new Image();
            bgImg.crossOrigin = "anonymous";
            bgImg.src = isPrintable
                ? (mockup as PrintableMockup).blankObjectUrl
                : (mockup as Mockup).backgroundUrl!; // Background is required for scene mockup

            bgImg.onload = () => {
                // [FIX] Use natural dimensions or scaled ratio
                let finalWidth = bgImg.naturalWidth;
                let finalHeight = bgImg.naturalHeight;

                // Limit max size for export
                const MAX_EXPORT = 2048; // Higher quality for export
                if (finalWidth > MAX_EXPORT || finalHeight > MAX_EXPORT) {
                    const ratio = Math.min(MAX_EXPORT / finalWidth, MAX_EXPORT / finalHeight);
                    finalWidth = Math.round(finalWidth * ratio);
                    finalHeight = Math.round(finalHeight * ratio);
                }

                canvas.width = finalWidth;
                canvas.height = finalHeight;
                ctx.drawImage(bgImg, 0, 0, finalWidth, finalHeight);

                const productImg = new Image();
                productImg.crossOrigin = "anonymous";
                productImg.src = productUrl;

                productImg.onload = () => {
                    const placement = productPosition;
                    const aspect = productImg.width / productImg.height;
                    const w = finalWidth * placement.scale;
                    const h = w / aspect;
                    const x = (finalWidth * placement.x) - (w / 2);
                    const y = (finalHeight * placement.y) - (h / 2);

                    if (isPrintable) {
                        ctx.globalAlpha = 0.9;
                        ctx.globalCompositeOperation = 'multiply';
                    }
                    ctx.drawImage(productImg, x, y, w, h);

                    if (isPrintable) {
                        ctx.globalAlpha = 1.0;
                        ctx.globalCompositeOperation = 'source-over';
                        resolve(canvas.toDataURL('image/png'));
                    } else {
                        const m = mockup as Mockup;
                        if (m.overlayUrl) {
                            const overImg = new Image();
                            overImg.crossOrigin = "anonymous";
                            overImg.src = m.overlayUrl;
                            overImg.onload = () => {
                                ctx.globalCompositeOperation = 'multiply';
                                ctx.drawImage(overImg, 0, 0, 1080, 1080);
                                resolve(canvas.toDataURL('image/png'));
                            };
                            overImg.onerror = () => resolve(canvas.toDataURL('image/png'));
                        } else {
                            resolve(canvas.toDataURL('image/png'));
                        }
                    }
                };
                productImg.onerror = reject;
            };
            bgImg.onerror = reject;
        });
    };

    // [NEW] 輔助介面：合成結果包含遮罩
    interface CompositeResult {
        image: string; // 合成圖 Base64
        mask: string;  // 遮罩圖 Base64 (白底黑商品 或 黑底白商品，視後端模型需求，通常 Inpainting 需遮罩區域)
    }

    // [MODIFIED] 輔助函式：合成暫存圖與遮罩給 AI
    // 修正策略：同時產出「合成圖」與「遮罩圖」
    // [MODIFIED] 輔助函式：合成暫存圖與遮罩給 AI
    // [MODIFIED] 輔助函式：合成暫存圖與遮罩給 AI
    const composeTempImageForAI = (productUrl: string, mockup: UniversalMockup, position: { x: number, y: number, scale: number }): Promise<CompositeResult> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maskCanvas = document.createElement('canvas');
            const maskCtx = maskCanvas.getContext('2d');

            if (!ctx || !maskCtx) {
                reject(new Error('Canvas context failed'));
                return;
            }

            const isPrintable = mockup.type === 'printable';
            const bgImgUrl = isPrintable
                ? (mockup as PrintableMockup).blankObjectUrl
                : (mockup as Mockup).backgroundUrl;

            // Load Mask URL
            // [FIX] More robust check: try both properties regardless of strict type, to catch data inconsistencies
            const maskSourceUrl = (mockup as any).printableAreaMaskUrl || (mockup as any).maskUrl;

            // [FIX] REMOVED fallback to bgImgUrl. 
            // If background is a Photo (Opaque), using it as a mask prevents clipping ("Floating Logo").
            // We only clip if we have a specific valid mask.

            if (!bgImgUrl) {
                reject(new Error('Background image not found'));
                return;
            }

            const loadImage = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => res(img);
                img.onerror = rej;
                img.src = src;
            });

            Promise.all([
                loadImage(bgImgUrl),
                loadImage(productUrl),
                maskSourceUrl ? loadImage(maskSourceUrl) : Promise.resolve(null)
            ]).then(([bgImg, productImg, loadedMaskImg]) => {

                // [NEW] Smart Auto-Mask Generation Logic
                // Change type: mask can be Image (from URL) or Canvas (Generated)
                // [NEW] Smart Mask Processing Logic

                // Helper: Convert any mask (JPG/PNG) to pure Alpha Mask
                const ensureAlphaMask = (img: HTMLImageElement | HTMLCanvasElement, w: number, h: number) => {
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return img;

                    ctx.drawImage(img, 0, 0, w, h);
                    const imageData = ctx.getImageData(0, 0, w, h);
                    const data = imageData.data;

                    // Check if image is fully opaque (likely JPG)
                    let isOpaque = true;
                    for (let i = 3; i < data.length; i += 4) {
                        if (data[i] < 250) { // Tolerance
                            isOpaque = false;
                            break;
                        }
                    }

                    // If Opaque, assume it's a B/W mask -> Convert Black to Alpha
                    if (isOpaque) {
                        console.log('🌑 Detected Opaque Mask (JPG) -> Converting Black to Alpha');
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            // [FIX] Shadow Preservation:
                            // 100 was still too high, cutting off the "Shadow Side" of the mug (creating a vertical cut).
                            // 40 is low enough to keep dark shadows (RGB~50) but high enough to cut Black Background (RGB~0-20).
                            if (r > 40) {
                                data[i + 3] = 255; // Keep Mug (even shadows)
                            } else {
                                data[i + 3] = 0;   // Cut Background
                            }
                        }
                        ctx.putImageData(imageData, 0, 0);
                        return canvas;
                    }

                    return img; // Return original if it has alpha
                };

                // Helper: Generate Auto-Mask from Background (for Photos)
                const generateAutoMask = (sourceImg: HTMLImageElement, w: number, h: number) => {
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return null;

                    ctx.drawImage(sourceImg, 0, 0, w, h);
                    const imageData = ctx.getImageData(0, 0, w, h);
                    const data = imageData.data;
                    let hasAlpha = false;

                    for (let i = 3; i < data.length; i += 4) {
                        if (data[i] < 255) {
                            hasAlpha = true;
                            break;
                        }
                    }

                    if (!hasAlpha) {
                        // White Removal Logic
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            if (r > 240 && g > 240 && b > 240) {
                                data[i + 3] = 0;
                            } else {
                                data[i + 3] = 255;
                            }
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);
                    return canvas;
                };

                // Setup Dimensions
                let finalWidth = bgImg.naturalWidth || bgImg.width;
                let finalHeight = bgImg.naturalHeight || bgImg.height;
                const MAX_DIM = 1080;

                if (finalWidth > MAX_DIM || finalHeight > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / finalWidth, MAX_DIM / finalHeight);
                    try {
                        finalWidth = Math.round(finalWidth * ratio);
                        finalHeight = Math.round(finalHeight * ratio);
                    } catch (e) {
                        // ignore
                    }
                }

                // 1. Determine Base Mask
                let maskImg: HTMLImageElement | HTMLCanvasElement | null = loadedMaskImg;

                // 2. If no mask, try Auto-Generate
                if (!maskImg && isPrintable) {
                    const autoMask = generateAutoMask(bgImg, finalWidth, finalHeight);
                    if (autoMask) {
                        console.log('🤖 Auto-generated Smart Mask from Background');
                        maskImg = autoMask;
                    }
                }

                // 3. [CRITICAL FIX] Ensure Mask has Alpha Channel (Convert JPG Black -> Alpha)
                if (maskImg) {
                    maskImg = ensureAlphaMask(maskImg, finalWidth, finalHeight);
                }

                canvas.width = finalWidth;
                canvas.height = finalHeight;
                maskCanvas.width = finalWidth;
                maskCanvas.height = finalHeight;

                const placement = position;
                // [FIX] Use natural dimensions to prevent distortion/squeezing
                const productAspect = (productImg.naturalWidth || productImg.width) / (productImg.naturalHeight || productImg.height);
                const targetW = finalWidth * placement.scale;
                const targetH = targetW / productAspect;
                const drawX = (finalWidth * placement.x) - (targetW / 2);
                const drawY = (finalHeight * placement.y) - (targetH / 2);

                // --- 0. Pre-calculate Clipped Logo (Intersection) ---
                // [CRITICAL] 為了符合使用者需求，圖片在馬克杯旁應該要找 logo 與馬克杯的交集
                // 我們先算出這個 "交集" (Clipped Logo)，然後用它來畫主圖和遮罩

                let logoToDraw: HTMLCanvasElement | HTMLImageElement = productImg;

                if (isPrintable && maskImg) {
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = finalWidth;
                    tempCanvas.height = finalHeight;
                    const tempCtx = tempCanvas.getContext('2d');
                    if (tempCtx) {
                        // 1. 畫 Mask defined area
                        tempCtx.drawImage(maskImg, 0, 0, finalWidth, finalHeight);
                        // 2. Source-In (Keep Intersection only)
                        tempCtx.globalCompositeOperation = 'source-in';
                        // 3. Draw Logo 
                        tempCtx.drawImage(productImg, drawX, drawY, targetW, targetH);

                        logoToDraw = tempCanvas;
                    }
                }

                // --- 1. Draw Main Composite Image (For AI) ---
                // 背景 + 已經裁切過的 Logo (不會有溢出到背景的部分)
                ctx.drawImage(bgImg, 0, 0, finalWidth, finalHeight);

                if (isPrintable) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'multiply'; // 模擬印刷疊色
                    ctx.globalAlpha = 0.9;
                    if (logoToDraw instanceof HTMLCanvasElement) {
                        // 如果是 Canvas (Clipped)，已經有座標了，直接畫 0,0
                        ctx.drawImage(logoToDraw, 0, 0);
                    } else {
                        // 如果是 Img (Fallback)，畫在計算位置
                        ctx.drawImage(logoToDraw, drawX, drawY, targetW, targetH);
                    }
                    ctx.restore();
                } else {
                    if (logoToDraw instanceof HTMLCanvasElement) {
                        ctx.drawImage(logoToDraw, 0, 0);
                    } else {
                        ctx.drawImage(logoToDraw, drawX, drawY, targetW, targetH);
                    }
                }

                // --- 2. Draw Mask (AI Instruction Layer) ---

                if (isPrintable && maskImg) {
                    // [CRITICAL FIX] Printable Mode:
                    // 我們要讓 AI 編輯 Logo (White)，保護背景 (Black)

                    // [CRITICAL FIX] Intersection Mask Strategy
                    // Generates a mask that is strictly: MugMask (Printable Area) ∩ LogoBox (Current Position)

                    // 1. Fill Background with Black (Protected)
                    maskCtx.globalCompositeOperation = 'source-over';
                    maskCtx.fillStyle = '#000000';
                    maskCtx.fillRect(0, 0, finalWidth, finalHeight);

                    // 2. Draw the Mug Mask (The allowed area)
                    const tempMask = document.createElement('canvas');
                    tempMask.width = finalWidth;
                    tempMask.height = finalHeight;
                    const tmCtx = tempMask.getContext('2d');

                    if (tmCtx) {
                        // 1. Prepare Mug Mask Layer (Canvas A)
                        // Expecting PNG/JPG Mask (White Mug, Black BG)
                        tmCtx.drawImage(maskImg, 0, 0, finalWidth, finalHeight);
                        const mugData = tmCtx.getImageData(0, 0, finalWidth, finalHeight).data;

                        // 2. Prepare Logo Mask Layer (Canvas B - Dilated)
                        const logoCanvas = document.createElement('canvas');
                        logoCanvas.width = finalWidth;
                        logoCanvas.height = finalHeight;
                        const logoCtx = logoCanvas.getContext('2d');

                        if (logoCtx) {
                            // Draw Logo with Glow (Dilation) to create "Warp Space"
                            logoCtx.shadowColor = '#FFFFFF';
                            logoCtx.shadowBlur = 15;
                            logoCtx.fillStyle = '#FFFFFF';
                            logoCtx.drawImage(productImg, drawX, drawY, targetW, targetH);
                            logoCtx.drawImage(productImg, drawX, drawY, targetW, targetH); // Strengthen alpha

                            const logoData = logoCtx.getImageData(0, 0, finalWidth, finalHeight).data;

                            // 3. Manual Pixel Intersection (The "Bulletproof" Method)
                            // We combine Mug Luma (from A) AND Logo Alpha (from B)
                            const finalData = maskCtx.createImageData(finalWidth, finalHeight);
                            const d = finalData.data;

                            for (let i = 0; i < d.length; i += 4) {
                                const mugLuma = mugData[i]; // R channel
                                const logoAlpha = logoData[i + 3];

                                // Mask = Mug Area (White) INTERSECT Logo Area (White)
                                // [ADJUSTMENT] Lower threshold to 10 to capture anti-aliased edges (Gray pixels).
                                // This fixes "Top Edge Cut Off" issues where the mask was being eroded.
                                if (mugLuma > 10 && logoAlpha > 50) {
                                    d[i] = 255;     // R
                                    d[i + 1] = 255; // G
                                    d[i + 2] = 255; // B
                                    d[i + 3] = 255; // Alpha (Solid White)
                                } else {
                                    d[i] = 0;       // R
                                    d[i + 1] = 0;   // G
                                    d[i + 2] = 0;   // B
                                    d[i + 3] = 255; // Alpha (Solid Black for background)
                                }
                            }

                            // 4. Output Result
                            maskCtx.putImageData(finalData, 0, 0);
                        }

                        // E. Fill the rest with Black
                        maskCtx.globalCompositeOperation = 'destination-over';
                        maskCtx.fillStyle = '#000000';
                        maskCtx.fillRect(0, 0, finalWidth, finalHeight);
                    }

                    // Reset op
                    maskCtx.globalCompositeOperation = 'source-over';

                } else {
                    // [Scene Mode] (保持原樣：White = Product/Keep)
                    // Scene Mode 指令通常是 "Don't change White area"，所以 White = Product
                    maskCtx.clearRect(0, 0, finalWidth, finalHeight);
                    maskCtx.drawImage(productImg, drawX, drawY, targetW, targetH);

                    maskCtx.globalCompositeOperation = 'source-in';
                    maskCtx.fillStyle = '#FFFFFF'; // Product -> White
                    maskCtx.fillRect(0, 0, finalWidth, finalHeight);

                    maskCtx.globalCompositeOperation = 'destination-over';
                    maskCtx.fillStyle = '#000000'; // Background -> Black
                    maskCtx.fillRect(0, 0, finalWidth, finalHeight);

                    maskCtx.globalCompositeOperation = 'source-over';
                }

                resolve({
                    image: canvas.toDataURL('image/png'),
                    mask: maskCanvas.toDataURL('image/png')
                });

            }).catch(err => {
                reject(err);
            });
        });
    };

    const handleGenerate = async (overridePrompt?: string) => {
        const activePrompt = overridePrompt || prompt;
        if (!uploadedImage || !activePrompt) return;

        setIsProcessing(true);
        try {
            const response = await apiClient.post('/gemini/edit-image', {
                imageUrl: uploadedImage,
                prompt: activePrompt
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

    // Unified Mockup Selection Handler with Preloading
    const handleMockupSelect = async (mockup: UniversalMockup) => {
        setIsMockupLoading(true);
        try {
            console.log('🔄 Preloading mockup assets for:', mockup.name);
            // 1. Preload images
            await preloadMockupImages(mockup);

            // 2. Update state only after loading finishes
            setSelectedMockup(mockup);
            setSelectedFrame(null); // Mutually exclusive with frames
            setBeforeBlendImage(null); // [Reset] 切換場景時重置融合狀態

            // [NEW] 重置/讀取位置
            // 如果 Mockup 有定義 placement 就用，沒有就用預設值 
            const defaultPlacement = mockup.placement || { x: 0.5, y: 0.5, scale: 0.6 };
            setProductPosition(defaultPlacement);

            setIsMobileSheetOpen(false); // Close mobile sheet if open

            // Optional: Auto-generate if image exists? 
            // Better not to auto-generate for Mockups as it might consume quota or need adjustment.

            toast.success(`已切換至場景：${mockup.name}`);
        } catch (error) {
            console.warn('⚠️ Mockup preloading failed, switching anyway:', error);
            setSelectedMockup(mockup);
            setSelectedFrame(null);
            setBeforeBlendImage(null); // [Reset]
            setEditedImage(null); // [FIX] Clear previous AI result to prevent "Stuck State"
            setIsMobileSheetOpen(false);
        } finally {
            setIsMockupLoading(false);
        }
    };

    // [MODIFIED] AI Smart Blend Handler
    const handleAIBlend = async () => {
        if (!selectedMockup) {
            toast.error('無法進行 AI 融合');
            return;
        }

        const isPrintable = selectedMockup.type === 'printable';
        const hasPrompt = isPrintable
            ? !!(selectedMockup as PrintableMockup).aiPrintPrompt
            : !!(selectedMockup as Mockup).aiBlendPrompt;

        if (!hasPrompt) {
            toast.error('此場景尚未配置 AI 提示詞');
            return;
        }

        const sourceImage = editedImage || uploadedImage;
        if (!sourceImage) return;

        setBeforeBlendImage(sourceImage); // Undo 存原圖
        setIsAIBlending(true);
        const toastId = toast.loading('AI 正在進行光影融合 (不含 Strength 參數)...');

        try {
            // 1. 準備合成圖與遮罩
            // 1. 準備合成圖與遮罩
            // [FIX] Explicitly pass current productPosition to avoid stale state
            const compositeData = await composeTempImageForAI(sourceImage, selectedMockup, productPosition);
            if (!compositeData) throw new Error('合成失敗');

            // [DEBUG REMOVED] Restoring AI functionality

            // const isPrintable = selectedMockup.type === 'printable';

            // 2. 構建 Prompt & Instruction
            let systemInstruction = '';
            let finalPrompt = '';

            if (isPrintable) {
                const m = selectedMockup as PrintableMockup;
                systemInstruction = `
1. **TASK SCOPE**: You are a **Geometry & Lighting Engine**.
2. **POSITION & MASK (ABSOLUTE)**:
   - The **WHITE AREA** of the mask is the **ONLY** place you can draw.
   - The **BLACK AREA** is **PROTECTED**. DO NOT TOUCH IT.
   - **STRICTLY MAINTAIN POSITION.** Do not move the logo to the center.
3. **CROPPING IS ALLOWED**: 
   - If the logo is cut off by the edge of the white mask, **LEAVE IT CUT OFF**.
   - **DO NOT** attempt to "fix" or "complete" the logo by moving it.
   - **DO NOT** reconstruct missing parts.
4. **CONTENT (SACRED)**: **DO NOT HALLUCINATE.**
   - Do not turn the logo into something else (e.g. no owls).
   - Treat the logo as a fixed TEXTURE.
5. **LIGHTING**: Multiply mug shadows onto the logo.
`.trim();
                finalPrompt = `
Context: ${m.aiPrintPrompt}.
Action: **WARP LOCALLY**. **ALLOW CROPPING**. **DO NOT RECENTER**.
`.trim();
            } else {
                systemInstruction = `
You are an expert product photography editor using an inpainting model.
STRICT RULE: The white area in the mask represents the PRODUCT.The black area is the BACKGROUND.
YOUR TASK:
                1. DO NOT change, redraw, or modify the product pixels(the white masked area) AT ALL.
2. ONLY generate realistic shadows and reflections ON THE BACKGROUND / SURFACE relative to the product.
3. Blend the product edges naturally into the background.
4. Keep the product's original resolution and text clarity 100% intact.
                    `.trim();
                finalPrompt = `
Context: ${selectedMockup.aiBlendPrompt}
Action: Add realistic contact shadows and environmental lighting interactions to the product.
                    Constraint: The product image provided MUST remain pixel - perfect.Do not hallucinate new details on the product.
`.trim();
            }

            // 3. 呼叫後端
            const response = await apiClient.post('/gemini/edit-image', {
                imageBase64: compositeData.image,
                maskBase64: compositeData.mask, // 一律傳送 Mask！
                prompt: finalPrompt,
                systemInstruction: systemInstruction
            });

            if (response.data?.data?.imageBase64) {
                const resultUrl = response.data.data.imageBase64;
                const fullBase64 = resultUrl.startsWith('data:image') ? resultUrl : `data:image/jpeg;base64,${resultUrl}`;

                setEditedImage(fullBase64);
                toast.dismiss(toastId);
                toast.success(isPrintable ? 'AI 印刷融合完成！' : 'AI 光影融合完成！');

                // 自動備份到雲端
                uploadBase64Image(fullBase64).then((url) => {
                    if (url) {
                        console.log('Auto-uploaded blended image:', url);
                        setEditedImage(url);
                    }
                });
            } else {
                throw new Error('回傳資料格式錯誤');
            }

        } catch (error: any) {
            console.error('AI Blend Failed:', error);
            toast.dismiss(toastId);

            if (error.response?.status === 429) {
                toast.error('今日 AI 額度已用完，請明天再來！');
            } else {
                toast.error(error.response?.data?.message || 'AI 融合失敗，請稍後再試');
            }

            // 恢復原圖
            if (beforeBlendImage) {
                setEditedImage(beforeBlendImage);
            }
        } finally {
            setIsAIBlending(false);
        }
    };

    // Undo AI Blend
    const handleUndoBlend = () => {
        if (beforeBlendImage) {
            setEditedImage(beforeBlendImage);
            setBeforeBlendImage(null);
            toast.success('已恢復融合前的圖片');
        } else {
            toast.error('沒有可恢復的圖片');
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
            setGeneratedCaption(`${data.caption} \n\n${data.hashtags.join(' ')} `);
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

        // 如果「有選 Mockup」且「尚未融合 (beforeBlendImage 為 null)」，才需要前端合成
        // 如果已經融合 (beforeBlendImage 有值)，downloadImage 已經是完整的圖了
        if (selectedMockup && !beforeBlendImage) {
            // [New] Compose with Mockup
            try {
                downloadImage = await composeImageWithMockup(downloadImage, selectedMockup);
            } catch (error) {
                console.error('Mockup composition failed:', error);
                toast.error('場景合成失敗，將下載原圖');
            }
        } else if (selectedFrame && selectedFrame.id !== 'none') {
            // Compose frame with image if frame is selected
            try {
                downloadImage = await composeImageWithFrame(downloadImage, selectedFrame.url);
            } catch (error) {
                console.error('Frame composition failed:', error);
                toast.error('圖框合成失敗，將下載原圖');
            }
        }

        try {
            const toastId = toast.loading('正在準備下載...');

            // If it's a remote URL, fetch it as a blob first to force download
            // (Browser ignores 'download' attribute for cross-origin URLs)
            let href = downloadImage;
            if (downloadImage.startsWith('http')) {
                const response = await fetch(downloadImage);
                const blob = await response.blob();
                href = URL.createObjectURL(blob);
            }

            const link = document.createElement('a');
            link.href = href;
            link.download = `edited - product - ${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up blob URL
            if (href.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(href), 100);
            }

            toast.success('已開始下載', { id: toastId });
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('下載失敗，請稍後再試');
        }
    };

    const handlePublish = async () => {
        // Allow publishing either edited OR original image
        let targetImage = editedImage || uploadedImage;
        if (!targetImage) return;

        // 邏輯同上：僅在「未融合」時進行合成
        if (selectedMockup && !beforeBlendImage) {
            try {
                targetImage = await composeImageWithMockup(targetImage, selectedMockup);
            } catch (error) {
                toast.error('場景合成失敗');
                return;
            }
        } else if (selectedFrame && selectedFrame.id !== 'none') {
            try { targetImage = await composeImageWithFrame(targetImage, selectedFrame.url); } catch (e) { return; }
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
            toast.error(`發佈失敗: ${error.response?.data?.message || error.message} `);
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
        } else if (selectedMockup) {
            try {
                targetImage = await composeImageWithMockup(targetImage, selectedMockup);
            } catch (error) {
                console.error('Mockup composition failed:', error);
                toast.error('場景合成失敗，將使用原圖上架');
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



    return (
        <EditorLayout hasUnsavedChanges={hasUnsavedChanges()}>

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
            <div className={`hidden landscape:block flex - shrink - 0 bg - white dark: bg - [#2d2d2d] border - r border - gray - 200 dark: border - gray - 700 h - full transition - all duration - 300 ${isLeftPanelCollapsed ? 'w-12' : 'w-96'
                } `}>
                {isLeftPanelCollapsed ? (
                    // Collapsed state - show only toggle button
                    <div className="h-full flex items-start justify-center pt-6">
                        <button
                            type="button"
                            onClick={() => setIsLeftPanelCollapsed(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                            aria-label="展開選擇風格面板"
                            title="展開"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                ) : (
                    // Expanded state - show full content with collapse button
                    <div className="p-6 h-full overflow-y-auto custom-scrollbar relative">
                        <button
                            type="button"
                            onClick={() => setIsLeftPanelCollapsed(true)}
                            className="absolute top-6 right-6 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors z-10"
                            aria-label="收折選擇風格面板"
                            title="收折"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <StylePresetGrid
                            selectedStyle={selectedStyle}
                            onSelectStyle={handleStyleSelect}
                            customStyles={customStyles}
                            onAddCustomStyle={() => setIsCustomStyleModalOpen(true)}
                            onEditCustomStyle={(style) => {
                                setEditingStyle(style);
                                setIsCustomStyleModalOpen(true);
                            }}
                            onDeleteCustomStyle={handleDeleteCustomStyle}
                            disabled={isProcessing || !uploadedImage}
                        />

                        {/* 分隔线 */}
                        <div className="my-6 border-t border-gray-200 dark:border-gray-700" />

                        {/* Mockup 场景区域 */}
                        <div className="relative">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <span>🎭</span>
                                <span>商品場景 Mockup</span>
                            </h3>

                            {/* Loading Skeleton */}
                            {isMockupLoading && (
                                <div className="absolute inset-0 bg-white/90 dark:bg-[#2d2d2d]/90 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        <p className="text-sm text-gray-600 dark:text-gray-400">載入場景中...</p>
                                    </div>
                                </div>
                            )}

                            <MockupGrid
                                selectedMockup={selectedMockup}
                                onSelect={handleMockupSelect}
                                disabled={isProcessing || !uploadedImage || isMockupLoading}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* 🔥 Center Stage - Canvas (JS 動態計算高度版) 🔥 */}
            {/* ========================================================= */}
            <div
                ref={canvasContainerRef}
                style={{ height: canvasHeight }}
                className={`
                    w-full relative bg-gray-50 dark:bg-[#121212] overflow-hidden
                    ${mobileStep !== 'edit' ? 'hidden landscape:block' : 'block'}
                `}
            >

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
                    selectedMockup={selectedMockup}
                    // [NEW] 傳遞位置與更新函式
                    productPosition={productPosition}
                    onProductPositionChange={setProductPosition}
                    isCropping={isCropping}
                    setIsCropping={setIsCropping}
                    isRegenerateDisabled={!selectedStyle}
                    // [KEY FIX] 傳入融合狀態，告訴 ImageCanvas 這是 "結果圖" 還是 "預覽圖"
                    isBlended={!!beforeBlendImage}
                    isAIBlending={isAIBlending}
                />

                {/* Center Canvas overlay buttons */}
                {selectedMockup && (uploadedImage || editedImage) && !isProcessing && !isCropping && (
                    <div className="absolute top-4 right-4 z-[50] flex gap-2">
                        {beforeBlendImage && (
                            <button
                                type="button"
                                onClick={handleUndoBlend}
                                className="px-3 py-2 bg-gray-700 text-white rounded-lg shadow-lg hover:bg-gray-600 transition-all flex items-center gap-2"
                                title="恢復融合前的圖片"
                            >
                                <Undo2 className="w-4 h-4" />
                                <span className="hidden sm:inline">撤銷</span>
                            </button>
                        )}

                        {/* AI Blend Button */}
                        <button
                            type="button"
                            onClick={handleAIBlend}
                            disabled={isAIBlending}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isAIBlending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>處理中...</span>
                                </>
                            ) : (
                                <>
                                    <span>✨</span>
                                    <span>AI 智能融合</span>
                                </>
                            )}
                        </button>

                    </div>
                )}

                {/* Mobile Style Change Button (可拖動浮動按鈕) */}
                <button
                    type="button"
                    onTouchStart={handleStyleButtonDragStart}
                    onMouseDown={handleStyleButtonDragStart}
                    onClick={() => {
                        // Only trigger click if not dragging (moved less than 5px)
                        if (dragMoveDistance.current < 5) {
                            if (!uploadedImage && !editedImage) {
                                setMobileTab('upload');
                            }
                            setIsMobileSheetOpen(true);
                        }
                    }}
                    style={{
                        transform: `translate(${styleButtonPosition.x}px, ${styleButtonPosition.y}px) ${isDraggingStyleButton ? 'scale(1.1)' : 'scale(1)'} `,
                        cursor: isDraggingStyleButton ? 'grabbing' : 'grab',
                        opacity: isDraggingStyleButton ? 0.7 : 0.4,
                        touchAction: 'none'
                    }}
                    className="landscape:hidden fixed top-0 left-0 flex items-center gap-2 px-5 py-5 tablet-portrait:!px-8 tablet-portrait:!py-8 bg-gradient-to-r from-blue-400 to-cyan-400 dark:from-blue-500 dark:to-cyan-500 rounded-full shadow-lg border border-blue-300 dark:border-blue-600 text-white font-medium z-30 text-sm tablet-portrait:text-base transition-opacity"
                >
                    <Sparkles className="w-4 h-4 tablet-portrait:!w-10 tablet-portrait:!h-10" />

                </button>
            </div>
            {/* ========================================================= */}


            {/* Mobile View: Caption Step */}
            <div className={`flex - 1 flex flex - col h - full overflow - hidden pb - 24 ${mobileStep === 'caption' ? 'block landscape:hidden' : 'hidden'} `}>

                {!isMobileCaptionExpanded && (
                    <div className="flex items-center justify-center p-6 pb-2 transition-all duration-300">
                        {(editedImage || uploadedImage) && (
                            <div className="w-[90%] aspect-square rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md shrink-0 bg-gray-100">
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
                                    selectedMockup={selectedMockup}
                                    isCropping={isCropping}
                                    setIsCropping={setIsCropping}
                                    isRegenerateDisabled={!uploadedImage}
                                    isBlended={!!editedImage && isAIBlending} // 簡單判斷：如果有編輯圖且正在 Blend
                                    productPosition={productPosition}
                                    onProductPositionChange={setProductPosition}
                                />
                            </div>
                        )}
                    </div>
                )}

                <CopywritingAssistant
                    instanceId="mobile-caption"
                    generatedCaption={generatedCaption}
                    onCaptionChange={setGeneratedCaption}
                    captionPrompt={captionPrompt}
                    onCaptionPromptChange={setCaptionPrompt}
                    isGenerating={isGeneratingCaption}
                    onGenerate={handleGenerateCaption}
                    disabled={(!uploadedImage && !editedImage) || isProcessing}
                    onToggleExpand={() => setIsMobileCaptionExpanded(!isMobileCaptionExpanded)}
                    isExpanded={isMobileCaptionExpanded}
                />
            </div>

            {/* Mobile View: Publish Step */}
            <div className={`flex - 1 p - 6 pb - 32 overflow - y - auto ${mobileStep === 'publish' ? 'block landscape:hidden' : 'hidden'} `}>
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

            {/* Right Panel (Desktop Only) - Action Panel */}
            <div className={`hidden landscape:flex landscape: flex - col flex - shrink - 0 h - full border - l border - gray - 200 dark: border - gray - 800 bg - white dark: bg - [#1e1e1e] overflow - hidden transition - all duration - 300 ${isRightPanelCollapsed ? 'w-12' : 'w-96'
                } `}>
                {isRightPanelCollapsed ? (
                    // Collapsed state - show only toggle button
                    <div className="h-full flex items-start justify-center pt-6">
                        <button
                            type="button"
                            onClick={() => setIsRightPanelCollapsed(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                            aria-label="展開操作面板"
                            title="展開"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    </div>
                ) : (
                    // Expanded state - show full content with collapse button
                    <div className="p-6 flex-1 overflow-y-auto flex flex-col custom-scrollbar relative">
                        <div className="flex items-center justify-between mb-6">
                            <button
                                type="button"
                                onClick={() => setIsRightPanelCollapsed(true)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                                aria-label="收折操作面板"
                                title="收折"
                            >
                                <ChevronRight size={16} />
                            </button>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex-1 text-center">
                                操作面板
                            </h2>
                            <div className="w-8"></div> {/* Spacer for balance */}
                        </div>

                        <CopywritingAssistant
                            instanceId="desktop-caption"
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
                )}
            </div>

            {/* Mobile Components */}
            <MobileBottomSheet
                isOpen={isMobileSheetOpen}
                onClose={() => setIsMobileSheetOpen(false)}
                title="編輯設定"
            >
                {/* Tab Header */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 -mx-6 px-6 -mt-6 mb-6">
                    <button
                        type="button"
                        onClick={() => setMobileTab('style')}
                        className={`flex - 1 py - 3 text - sm font - medium transition - colors ${mobileTab === 'style'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            } `}
                    >
                        ✨ AI 風格
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileTab('mockup')}
                        className={`flex - 1 py - 3 text - sm font - medium transition - colors ${mobileTab === 'mockup'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            } `}
                    >
                        🎭 場景 Mockup
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileTab('upload')}
                        className={`flex - 1 py - 3 text - sm font - medium transition - colors ${mobileTab === 'upload'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            } `}
                    >
                        📷 上傳
                    </button>
                </div>

                {/* Tab Content */}
                {mobileTab === 'style' ? (
                    <StylePresetGrid
                        selectedStyle={selectedStyle}
                        onSelectStyle={(s) => {
                            handleStyleSelect(s);
                            setIsMobileSheetOpen(false); // Close sheet after selection for auto-generation
                        }}
                        customStyles={customStyles}
                        onAddCustomStyle={() => {
                            setIsCustomStyleModalOpen(true);
                            setIsMobileSheetOpen(false); // Close bottom sheet
                        }}
                        onEditCustomStyle={(style) => {
                            setEditingStyle(style);
                            setIsCustomStyleModalOpen(true);
                            setIsMobileSheetOpen(false); // Close bottom sheet
                        }}
                        onDeleteCustomStyle={handleDeleteCustomStyle}
                        disabled={isProcessing}
                    />
                ) : mobileTab === 'mockup' ? (
                    <div className="relative">
                        {/* Loading Skeleton */}
                        {isMockupLoading && (
                            <div className="absolute inset-0 bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">載入場景中...</p>
                                </div>
                            </div>
                        )}

                        <MockupGrid
                            selectedMockup={selectedMockup}
                            onSelect={handleMockupSelect}
                            disabled={isProcessing || isMockupLoading}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 py-4">
                        <label className="flex items-center justify-center gap-3 p-6 bg-blue-600 text-white rounded-2xl cursor-pointer active:scale-95 transition-all shadow-lg">
                            <Camera size={28} />
                            <div className="flex flex-col">
                                <span className="text-lg font-bold">開啟相機拍照</span>
                                <span className="text-xs opacity-80 text-white/80">拍照並自動去除背景</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleImageUpload(file);
                                        setIsMobileSheetOpen(false);
                                    }
                                }}
                            />
                        </label>

                        <label className="flex items-center justify-center gap-3 p-6 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl cursor-pointer active:scale-95 transition-all border border-gray-200 dark:border-gray-700">
                            <Upload size={28} />
                            <div className="flex flex-col">
                                <span className="text-lg font-bold">從相簿選擇圖片</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">上傳手機內存或相簿照片</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleImageUpload(file);
                                        setIsMobileSheetOpen(false);
                                    }
                                }}
                            />
                        </label>

                        <button
                            onClick={() => {
                                setIsLibraryOpen(true);
                                setIsMobileSheetOpen(false);
                            }}
                            className="flex items-center justify-center gap-3 p-4 bg-transparent text-blue-600 dark:text-blue-400 rounded-2xl active:scale-95 transition-all text-sm font-medium"
                        >
                            <Cloud size={20} />
                            從雲端圖庫選擇
                        </button>
                    </div>
                )}
            </MobileBottomSheet>

            <MobileWizardNav
                step={mobileStep}

                onBack={mobileStep !== 'edit' ? handleMobileBack : undefined}
                canGoNext={canGoNext()}
                nextLabel={mobileStep === 'publish' ? '完成' : undefined}
                isProcessing={isProcessing}
                // Disable next button if cropping
                onNext={() => {
                    if (isCropping) {
                        toast.warning('請先完成或取消裁切');
                        return;
                    }
                    handleMobileNext();
                }}
            />
            {/* Close Main Content Area */}

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
                onSave={async (frame) => {
                    const toastId = toast.loading('正在上傳圖框...');
                    try {
                        // Upload frame to Cloudinary (folder: ecommerce-canvas/frames)
                        const cloudUrl = await uploadBase64Image(frame.url, 'canvas', 'frames');

                        if (cloudUrl) {
                            const updatedFrame = {
                                ...frame,
                                url: cloudUrl,
                                preview: cloudUrl
                            };

                            setCustomFrames(prev => [...prev, updatedFrame]);
                            localStorage.setItem('customFrames', JSON.stringify([...customFrames, updatedFrame]));
                            toast.success('圖框已上傳並儲存', { id: toastId });
                        } else {
                            // Fallback to local if upload fails (though rare)
                            setCustomFrames(prev => [...prev, frame]);
                            localStorage.setItem('customFrames', JSON.stringify([...customFrames, frame]));
                            toast.warning('圖框上傳失敗，已儲存為本機暫存', { id: toastId });
                        }
                    } catch (error) {
                        console.error('Frame upload error:', error);
                        toast.error('儲存圖框時發生錯誤', { id: toastId });
                    }
                }}
            />
        </EditorLayout >
    );
}
