import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import LoadingState from './LoadingState';
import FloatingToolbar from './FloatingToolbar';
import { useDropzone } from 'react-dropzone';
import { Upload, Cloud, Check, X as CancelIcon, Eye, Camera } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import getCroppedImg from '../../utils/canvasUtils';
import { useState, useRef, useEffect } from 'react';
import { Frame } from '../../types/frame';
import { Mockup, PrintableMockup, UniversalMockup } from '../../types/mockup';
import { useImagePreloader } from '../../hooks/useImagePreloader';

interface ImageCanvasProps {
    originalImage: string | null;
    editedImage: string | null;
    isProcessing: boolean;
    onRegenerate: () => void;
    onImageUpload: (file: File) => void;
    onOpenLibrary: () => void;
    onRemove?: () => void;
    onSelectFrame: () => void;
    selectedFrame: Frame | null;
    selectedMockup?: UniversalMockup | null; // [UPDATED]
    mockupOpacity?: number;
    isCropping: boolean;
    setIsCropping: (value: boolean) => void;
    isRegenerateDisabled?: boolean;
    isBlended?: boolean; // [NEW] 新增：是否已經過 AI 融合
    isAIBlending?: boolean; // [NEW] 是否正在 AI 融合中

    // [NEW] 新增座標控制 Props
    productPosition?: { x: number, y: number, scale: number }; // 目前位置 (百分比)
    onProductPositionChange?: (pos: { x: number, y: number, scale: number }) => void; // 更新 callback
}

export default function ImageCanvas({
    originalImage,
    editedImage,
    isProcessing,
    onRegenerate,
    onImageUpload,
    onOpenLibrary,
    onRemove,
    onSelectFrame,
    selectedFrame,
    selectedMockup, // [NEW]
    mockupOpacity,
    isCropping,
    setIsCropping,
    isRegenerateDisabled,
    isBlended = false, // [NEW] 預設為 false
    productPosition = { x: 0.5, y: 0.5, scale: 0.6 }, // [NEW] 預設值
    onProductPositionChange, // [NEW]
    isAIBlending = false // [NEW]
}: ImageCanvasProps) {
    // Cropping State - Lifted to parent
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);
    const [cropScale, setCropScale] = useState(1); // Zoom level for crop mode

    // Peek Original State
    const [showOriginal, setShowOriginal] = useState(false);

    // Toolbar Visibility State
    const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
    const [isHoveringToolbar, setIsHoveringToolbar] = useState(false);

    // Zoom State
    const [scale, setScale] = useState(1);
    const [startDist, setStartDist] = useState(0);
    const [startScale, setStartScale] = useState(1);

    const bgImageRef = useRef<HTMLImageElement>(null); // [NEW] 用來獲取底圖實際寬高

    // [FIXED] 使用 onPan 代替 drag，解決縮放時的位移誤差
    const handlePan = (_: any, info: PanInfo) => {
        if (!bgImageRef.current || !onProductPositionChange) return;

        const bgRect = bgImageRef.current.getBoundingClientRect();
        if (bgRect.width === 0 || bgRect.height === 0) return;

        // info.delta 是滑鼠移動的像素距離 (Screen Pixels)
        // bgRect 是底圖當下顯示的像素大小 (Scaled Pixels)
        // 兩者相除，剛好抵銷縮放係數，得到正確的「百分比位移」
        const deltaX = info.delta.x / bgRect.width;
        const deltaY = info.delta.y / bgRect.height;

        onProductPositionChange({
            ...productPosition,
            x: productPosition.x + deltaX,
            y: productPosition.y + deltaY
        });
    };

    // [New] Preload Mockup Assets
    const { imagesLoaded } = useImagePreloader([
        selectedMockup?.type === 'scene' ? (selectedMockup as Mockup).backgroundUrl : (selectedMockup as any)?.blankObjectUrl,
        selectedMockup?.type === 'scene' ? (selectedMockup as Mockup).overlayUrl : undefined,
        selectedMockup?.type === 'scene' ? (selectedMockup as Mockup).maskUrl : (selectedMockup as any)?.printableAreaMaskUrl
    ]);

    // Reset zoom when image changes or cropping starts
    if (isCropping && scale !== 1) {
        setScale(1);
    }

    // Reset zoom when original image changes (new upload)
    useEffect(() => {
        if (originalImage) {
            setScale(1);
        }
    }, [originalImage]);

    // Refs for native event listeners

    const canvasRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef({
        scale,
        startDist,
        startScale,
        isCropping
    });

    // Update ref when state changes
    useEffect(() => {
        stateRef.current = {
            scale,
            startDist,
            startScale,
            isCropping
        };
    }, [scale, startDist, startScale, isCropping]);

    // Attach native event listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e: WheelEvent) => {
            const { isCropping, scale } = stateRef.current;
            if (isCropping) return;
            e.preventDefault();
            e.stopPropagation();
            const delta = -e.deltaY;
            const newScale = Math.min(Math.max(0.5, scale + delta * 0.001), 3);
            setScale(newScale);
        };

        const onTouchStart = (e: TouchEvent) => {
            const { isCropping, scale } = stateRef.current;
            if (isCropping) return;

            if (e.touches.length === 2) {
                // Pinch Zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                setStartDist(dist);
                setStartScale(scale);
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            const { isCropping, startDist, startScale } = stateRef.current;
            if (isCropping) return;

            if (e.touches.length === 2 && startDist > 0) {
                // Pinch Zoom
                e.preventDefault(); // Critical: prevent browser zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                const ratio = dist / startDist;
                const newScale = Math.min(Math.max(0.5, startScale * ratio), 3);
                setScale(newScale);
            }
        };

        const onTouchEnd = () => {
            setStartDist(0);
        };

        // Passive: false is crucial for preventing default behavior
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);
        canvas.addEventListener('touchcancel', onTouchEnd);

        return () => {
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
            canvas.removeEventListener('touchcancel', onTouchEnd);
        };
    }, [originalImage, editedImage]); // Re-bind when image state changes (and canvas renders)

    const handleSaveCrop = async () => {
        if (!originalImage && !editedImage) return;

        const sourceImage = editedImage || originalImage;
        if (!sourceImage) return;

        if (!completedCrop || !imgRef.current) return;

        try {
            // Calculate scale factors
            const image = imgRef.current;

            // Safety check to prevent division by zero or invalid dimensions
            if (!image.width || !image.height || !image.naturalWidth || !image.naturalHeight) {
                console.error('Image dimensions invalid', image);
                return;
            }

            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            // Use the smaller scale to ensure we stay within image bounds
            const scale = Math.min(scaleX, scaleY);

            // Calculate pixel coordinates for crop
            const pixelCrop = {
                x: completedCrop.x * scale,
                y: completedCrop.y * scale,
                width: completedCrop.width * scale,
                height: completedCrop.height * scale,
            };

            // Enforce 1:1 aspect ratio - use the smaller dimension
            const size = Math.min(pixelCrop.width, pixelCrop.height);
            const squareCrop = {
                x: pixelCrop.x,
                y: pixelCrop.y,
                width: size,
                height: size,
            };

            const croppedImage = await getCroppedImg(
                sourceImage,
                squareCrop,
                0 // rotation always 0
            );

            if (croppedImage) {
                const res = await fetch(croppedImage);
                const blob = await res.blob();
                const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });

                onImageUpload(file);
                setIsCropping(false);
            }
        } catch (e) {
            console.error('Crop failed:', e);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles?.[0]) {
                onImageUpload(acceptedFiles[0]);
            }
        },
        accept: {
            'image/*': []
        },
        multiple: false
    });

    // Upload UI (when no image uploaded yet and no mockup selected)
    if (!originalImage && !selectedMockup) {
        return (
            <div className="w-full h-full relative flex items-center justify-center p-4 tablet-portrait:p-8 landscape:p-8">
                {/* Centered upload container */}
                <div className="flex items-center justify-center w-full h-full">
                    <div
                        {...getRootProps()}
                        className={`
                            flex flex-col items-center justify-center gap-4 tablet-portrait:gap-6 p-8 tablet-portrait:p-16 landscape:p-12
                            border-2 tablet-portrait:border-4 border-dashed rounded-2xl tablet-portrait:rounded-3xl cursor-pointer
                            transition-all duration-200
                            ${isDragActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }
                            max-w-md tablet-portrait:max-w-xl w-full
                        `}
                    >
                        <input {...getInputProps()} />
                        <Upload size={48} className={`tablet-portrait:w-20 tablet-portrait:h-20 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                        <div className="text-center">
                            <p className="text-lg tablet-portrait:text-2xl font-medium text-gray-700 dark:text-gray-200 mb-1 tablet-portrait:mb-2">
                                {isDragActive ? '放開以已上傳' : '拖曳圖片至此'}
                            </p>
                            <p className="text-sm tablet-portrait:text-lg text-gray-500 dark:text-gray-400">
                                或點擊選擇檔案
                            </p>
                        </div>

                        {/* [NEW] Mobile-Specific Quick Upload Actions */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2 landscape:hidden">
                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer w-full transition-colors active:scale-95 shadow-md">
                                <Camera size={20} />
                                <span className="text-sm font-bold">拍照上傳</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) onImageUpload(file);
                                    }}
                                />
                            </label>
                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl cursor-pointer w-full transition-colors active:scale-95 border border-gray-200 dark:border-gray-700">
                                <Upload size={20} />
                                <span className="text-sm font-bold">傳送檔案</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) onImageUpload(file);
                                    }}
                                />
                            </label>
                        </div>

                        <div className="flex items-center gap-2 tablet-portrait:gap-3 text-gray-400 w-full">
                            <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></div>
                            <span className="text-xs tablet-portrait:text-sm">或</span>
                            <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenLibrary();
                            }}
                            className="flex items-center gap-2 px-4 tablet-portrait:px-6 py-2 tablet-portrait:py-3 text-sm tablet-portrait:text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg tablet-portrait:rounded-xl transition-colors"
                        >
                            <Cloud size={18} className="tablet-portrait:w-6 tablet-portrait:h-6" />
                            從雲端圖庫選擇
                        </button>
                    </div>
                </div>
            </div >
        );
    }

    return (
        // 1. 最外層容器：負責 Padding 與邊界 (不參與動畫)
        <div className="w-full h-full relative flex items-center justify-center p-4 landscape:p-8">

            {/* ================================================================================== */}
            {/* 模式 A: 裁切模式 (Cropping Mode) */}
            {/* 這裡是一個【完全獨立】的靜止容器，沒有任何 transform 或 transition */}
            {/* ================================================================================== */}
            {isCropping ? (
                <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
                    {/* Constrained wrapper for ReactCrop to prevent overflow */}
                    <div
                        className="max-w-full max-h-full flex items-center justify-center"
                        onWheel={(e) => {
                            e.preventDefault();
                            const delta = -e.deltaY;
                            const newScale = Math.min(Math.max(0.5, cropScale + delta * 0.001), 3);
                            setCropScale(newScale);
                        }}
                    >
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            minWidth={100}
                            keepSelection={true}
                            ruleOfThirds={true}
                            circularCrop={false}
                            locked={false}
                            // 確保裁切工具不會撐開容器
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                        >
                            <img
                                ref={imgRef}
                                src={editedImage || originalImage || ''}
                                // 關鍵：將縮放應用在圖片本身，而非外層容器
                                style={{
                                    display: 'block',
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    transform: `scale(${cropScale})`,
                                    transformOrigin: 'center',
                                    transition: 'transform 0.1s ease-out'
                                }}
                                alt="Crop target"
                                onLoad={(e) => {
                                    const { width, height } = e.currentTarget;
                                    if (width === 0 || height === 0) return;
                                    const size = Math.min(width, height) * 0.9;
                                    const x = (width - size) / 2;
                                    const y = (height - size) / 2;
                                    const newCrop: Crop = { unit: 'px', x, y, width: size, height: size };
                                    setCrop(newCrop);
                                    setCompletedCrop({ ...newCrop, width: size, height: size } as PixelCrop);
                                }}
                            />
                        </ReactCrop>
                    </div>
                </div>
            ) : (
                // ================================================================================== */}
                // 模式 B: 檢視模式 (View / Zoom / Pan Mode)
                // 這裡才有 transform 縮放功能，跟上面的裁切模式完全分開
                // ================================================================================== */}
                <div
                    ref={canvasRef}
                    className="group relative w-full h-full flex items-center justify-center bg-gray-50/50 overflow-hidden"
                    onMouseEnter={() => setIsHoveringCanvas(true)}
                    onMouseLeave={() => setIsHoveringCanvas(false)}
                >
                    <div className="relative flex items-center justify-center origin-center shadow-2xl" style={{ transform: `scale(${scale})`, transition: 'transform 0.1s ease-out' }}>

                        {/* ================================================== */}
                        {/* 統一渲染邏輯：底圖 + 可拖曳層 (商品/Logo) */}
                        {/* ================================================== */}
                        {selectedMockup && (!isBlended || isAIBlending) ? (() => {
                            const isPrintableMode = selectedMockup.type === 'printable';
                            const isSceneMode = selectedMockup.type === 'scene';

                            const baseImageUrl = isPrintableMode
                                ? (selectedMockup as PrintableMockup).blankObjectUrl
                                : (selectedMockup as Mockup).backgroundUrl;

                            const draggableImageUrl = isAIBlending ? originalImage : (editedImage || originalImage || '');

                            // [FIX] 自動 Mask 邏輯：優先順序 專用 Mask > (如果是 Printable) 底圖 > 無
                            const activeMaskUrl = (selectedMockup as any).maskUrl ||
                                (selectedMockup as any).printableAreaMaskUrl ||
                                (isPrintableMode ? baseImageUrl : null);

                            if (!baseImageUrl) return null;

                            return (
                                <div className="relative inline-block">
                                    {/* Layer 1: 底圖 (Reference) */}
                                    <img
                                        ref={bgImageRef}
                                        src={baseImageUrl}
                                        alt="background"
                                        className="block max-w-[90vw] max-h-[85vh] w-auto h-auto select-none z-0"
                                        draggable={false}
                                    />

                                    {/* Layer 2: 互動層 (Interaction - Invisible but Draggable) */}
                                    {/* [FIX] 分身術：不套用 Mask，覆蓋全螢幕，確保任何地方都能拖動 */}
                                    {/* [FIXED] 使用 z-[30] 確保在視覺層之上，且為標準/強制語法 */}
                                    <motion.div
                                        className="absolute inset-0 z-[30] cursor-move"
                                        onPan={handlePan}
                                        style={{ touchAction: "none" }}
                                    >
                                        <div className="w-full h-full opacity-0" />
                                    </motion.div>

                                    {/* Layer 3: 視覺層 (Visual - Masked) */}
                                    {/* [FIX] 只負責顯示，套用 Mask 裁切，z-10 低於交互層 */}
                                    <div
                                        className="absolute inset-0 z-10 pointer-events-none"
                                        style={{
                                            ...(activeMaskUrl ? {
                                                maskImage: `url(${activeMaskUrl})`,
                                                WebkitMaskImage: `url(${activeMaskUrl})`,
                                                maskSize: '100% 100%',
                                                WebkitMaskSize: '100% 100%',
                                                maskPosition: 'center',
                                                WebkitMaskPosition: 'center',
                                                maskRepeat: 'no-repeat',
                                                WebkitMaskRepeat: 'no-repeat'
                                            } : {})
                                        }}
                                    >
                                        {/* Logo 視覺顯示 */}
                                        <div
                                            className="absolute flex items-center justify-center select-none"
                                            style={{
                                                left: `${productPosition.x * 100}%`,
                                                top: `${productPosition.y * 100}%`,
                                                width: `${productPosition.scale * 100}%`,
                                                height: 'auto',
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                        >
                                            <div className="relative w-full flex items-center justify-center">
                                                {draggableImageUrl ? (
                                                    <img
                                                        src={draggableImageUrl}
                                                        className="w-full h-auto object-contain"
                                                        style={isPrintableMode ? { opacity: 0.95, mixBlendMode: 'multiply' } : {}}
                                                    />
                                                ) : (
                                                    <div className="w-full aspect-square border-2 border-dashed border-white/30 rounded-lg bg-white/5 backdrop-blur-sm p-4 text-center flex flex-col items-center justify-center">
                                                        <p className="text-white/60 text-[10px] font-bold mb-1">
                                                            {isPrintableMode ? '放置 Logo 處' : '商品放置處'}
                                                        </p>
                                                        <div {...getRootProps()} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[9px] text-white/80 cursor-pointer pointer-events-auto transition-colors">
                                                            <input {...getInputProps()} />
                                                            上傳
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Layer 4: 前景 Overlay (僅 Scene 模式需要) */}
                                    {isSceneMode && (selectedMockup as Mockup).overlayUrl && !showOriginal && (
                                        <img
                                            src={(selectedMockup as Mockup).overlayUrl}
                                            className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none mix-blend-multiply"
                                            style={{ opacity: mockupOpacity ?? 1 }}
                                        />
                                    )}
                                </div>
                            );
                        })() : (
                            // 非 Mockup 模式或已融合模式
                            <>
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key="main-product-view"
                                        src={editedImage || originalImage || ''}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`block max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain select-none shadow-sm z-10 ${!editedImage && showOriginal ? 'filter grayscale-[20%]' : ''}`}
                                    />
                                </AnimatePresence>
                                {/* Frame Overlay 僅在非 Mockup 模式下顯示 */}
                                {selectedFrame && !showOriginal && selectedFrame.id !== 'none' && !selectedMockup && (
                                    <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                        <img src={selectedFrame.url} className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ================================================================================== */}
            {/* 懸浮 UI (Toolbar, Buttons) - 保持在最上層 */}
            {/* ================================================================================== */}

            {/* Peek Original Button */}
            {
                editedImage && !isProcessing && !isCropping && (
                    <button
                        onMouseDown={() => setShowOriginal(true)}
                        onMouseUp={() => setShowOriginal(false)}
                        onMouseLeave={() => setShowOriginal(false)}
                        onTouchStart={() => setShowOriginal(true)}
                        onTouchEnd={() => setShowOriginal(false)}
                        className="absolute bottom-4 left-4 z-20 p-2 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                        title="按住查看原圖"
                    >
                        <Eye size={20} />
                    </button>
                )
            }

            {/* Loading State */}
            {(isProcessing || (selectedMockup && !imagesLoaded)) && <LoadingState />}

            {/* Floating Toolbar */}
            {
                (editedImage || originalImage) && !isProcessing && !isCropping && (
                    <FloatingToolbar
                        className={`
                        transition-opacity duration-300 ease-in-out
                        ${!isHoveringCanvas && !isHoveringToolbar ? 'landscape:opacity-0 landscape:pointer-events-none' :
                                isHoveringToolbar ? 'landscape:opacity-100' : 'landscape:opacity-40'
                            }
                    `}
                        onMouseEnter={() => setIsHoveringToolbar(true)}
                        onMouseLeave={() => setIsHoveringToolbar(false)}
                        onAddText={() => console.log('Add Text')}
                        onAddWatermark={() => console.log('Add Watermark')}
                        onRemove={onRemove}
                        onCrop={() => {
                            setCrop(undefined);
                            setIsCropping(true);
                        }}
                        onRegenerate={onRegenerate}
                        onSelectFrame={onSelectFrame}
                        isRegenerateDisabled={isRegenerateDisabled}
                        // [NEW] Pass scale control
                        scale={productPosition.scale}
                        onScaleChange={(newScale) => {
                            if (onProductPositionChange) {
                                onProductPositionChange({ ...productPosition, scale: newScale });
                            }
                        }}
                    />
                )
            }

            {/* Crop Controls */}
            {
                isCropping && (
                    <div className="absolute bottom-20 tablet-portrait:bottom-24 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-4 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10 pointer-events-auto w-max max-w-[90vw]">
                        <button
                            onClick={() => setIsCropping(false)}
                            className="text-white/90 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                            <CancelIcon size={18} />
                            取消
                        </button>
                        <div className="w-px h-4 bg-white/20"></div>
                        <span className="text-white/50 text-xs font-medium whitespace-nowrap hidden landscape:block">拖曳以裁切</span>
                        <div className="w-px h-4 bg-white/20 hidden landscape:block"></div>
                        <button
                            onClick={handleSaveCrop}
                            className="text-white hover:text-blue-400 flex items-center gap-2 text-sm font-bold transition-colors"
                        >
                            <Check size={18} />
                            完成
                        </button>
                    </div>
                )
            }
        </div >
    );
}
