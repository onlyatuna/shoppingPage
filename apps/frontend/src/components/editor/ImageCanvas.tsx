import { motion, AnimatePresence } from 'framer-motion';
import LoadingState from './LoadingState';
import FloatingToolbar from './FloatingToolbar';
import { useDropzone } from 'react-dropzone';
import { Upload, Cloud, Check, X as CancelIcon, Eye } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import getCroppedImg from '../../utils/canvasUtils';
import { useState, useRef, useEffect } from 'react';
import { Frame } from '../../types/frame';

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
    isCropping: boolean;
    setIsCropping: (value: boolean) => void;
    isRegenerateDisabled?: boolean;
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
    isCropping,
    setIsCropping,
    isRegenerateDisabled
}: ImageCanvasProps) {
    // Cropping State - Lifted to parent
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);

    // Peek Original State
    const [showOriginal, setShowOriginal] = useState(false);

    // Toolbar Visibility State
    const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
    const [isHoveringToolbar, setIsHoveringToolbar] = useState(false);

    // Zoom State
    const [scale, setScale] = useState(1);
    const [startDist, setStartDist] = useState(0);
    const [startScale, setStartScale] = useState(1);

    // Pan State
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Reset zoom/pan when image changes or cropping starts
    if (isCropping && (scale !== 1 || position.x !== 0 || position.y !== 0)) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }

    // Reset zoom/pan when original image changes (new upload)
    useEffect(() => {
        if (originalImage) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [originalImage]);

    // Refs for native event listeners

    const canvasRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef({
        scale,
        position,
        isDragging,
        dragStart,
        startDist,
        startScale,
        isCropping
    });

    // Update ref when state changes
    useEffect(() => {
        stateRef.current = {
            scale,
            position,
            isDragging,
            dragStart,
            startDist,
            startScale,
            isCropping
        };
    }, [scale, position, isDragging, dragStart, startDist, startScale, isCropping]);

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
            const newScale = Math.min(Math.max(1, scale + delta * 0.001), 3);
            setScale(newScale);
            if (newScale === 1) {
                setPosition({ x: 0, y: 0 });
            }
        };

        const onTouchStart = (e: TouchEvent) => {
            const { isCropping, scale, position } = stateRef.current;
            if (isCropping) return;

            if (e.touches.length === 2) {
                // Pinch Zoom
                setIsDragging(false);
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                setStartDist(dist);
                setStartScale(scale);
            } else if (e.touches.length === 1 && scale > 1) {
                // Pan
                const touch = e.touches[0];
                setIsDragging(true);
                setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            const { isCropping, startDist, startScale, isDragging, scale, dragStart } = stateRef.current;
            if (isCropping) return;

            if (e.touches.length === 2 && startDist > 0) {
                // Pinch Zoom
                e.preventDefault(); // Critical: prevent browser zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                const ratio = dist / startDist;
                const newScale = Math.min(Math.max(1, startScale * ratio), 3);
                setScale(newScale);
                if (newScale === 1) {
                    setPosition({ x: 0, y: 0 });
                }
            } else if (e.touches.length === 1 && isDragging && scale > 1) {
                // Pan
                e.preventDefault(); // Critical: prevent browser scroll
                const touch = e.touches[0];
                setPosition({
                    x: touch.clientX - dragStart.x,
                    y: touch.clientY - dragStart.y
                });
            }
        };

        const onTouchEnd = () => {
            setStartDist(0);
            setIsDragging(false);
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

    // Upload UI (when no image uploaded yet)
    if (!originalImage) {
        return (
            <div className="w-full h-full relative flex items-center justify-center p-4 md:p-8">
                {/* Centered upload container */}
                <div className="flex items-center justify-center w-full h-full">
                    <div
                        {...getRootProps()}
                        className={`
                            flex flex-col items-center justify-center gap-4 p-8 md:p-12
                            border-2 border-dashed rounded-2xl cursor-pointer
                            transition-all duration-200
                            ${isDragActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-105'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }
                            max-w-md w-full
                        `}
                    >
                        <input {...getInputProps()} />
                        <Upload size={48} className={isDragActive ? 'text-blue-500' : 'text-gray-400'} />
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-1">
                                {isDragActive ? '放開以已上傳' : '拖曳圖片至此'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                或點擊選擇檔案
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></div>
                            <span className="text-xs">或</span>
                            <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenLibrary();
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                        >
                            <Cloud size={18} />
                            從雲端圖庫選擇
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        // 1. 最外層容器：負責 Padding 與邊界 (不參與動畫)
        <div className="w-full h-full relative flex items-center justify-center p-4 md:p-8">

            {/* ================================================================================== */}
            {/* 模式 A: 裁切模式 (Cropping Mode) */}
            {/* 這裡是一個【完全獨立】的靜止容器，沒有任何 transform 或 transition */}
            {/* ================================================================================== */}
            {isCropping ? (
                <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
                    {/* Constrained wrapper for ReactCrop to prevent overflow */}
                    <div className="max-w-full max-h-full flex items-center justify-center">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            minWidth={100}
                            keepSelection={true}
                            // 確保裁切工具不會撐開容器
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                        >
                            <img
                                ref={imgRef}
                                src={editedImage || originalImage || ''}
                                // 關鍵：強制圖片適應容器，絕不溢出
                                style={{
                                    display: 'block',
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain'
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
                    className="group relative w-full h-full flex items-center justify-center"
                >
                    <div
                        className={`relative flex items-center justify-center origin-center
                            ${scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}
                        `}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            // 只有這個模式會有位移和縮放
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            // 優化：拖曳時關閉過渡效果以求流暢，放開後開啟過渡效果以求平滑
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                            touchAction: 'none'
                        }}
                        onMouseEnter={() => setIsHoveringCanvas(true)}
                        onMouseLeave={() => {
                            setIsHoveringCanvas(false);
                            setIsDragging(false);
                        }}
                        onMouseDown={(e) => {
                            if (scale <= 1) return;
                            e.preventDefault();
                            setIsDragging(true);
                            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
                        }}
                        onMouseMove={(e) => {
                            if (isDragging && scale > 1) {
                                e.preventDefault();
                                setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                            }
                        }}
                        onMouseUp={() => setIsDragging(false)}
                    >
                        <AnimatePresence mode="wait">
                            {editedImage && !showOriginal ? (
                                <motion.img
                                    key="edited-image"
                                    src={editedImage}
                                    alt="Edited Product"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="block max-w-full max-h-full w-auto h-auto object-contain select-none shadow-sm"
                                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                                />
                            ) : (
                                <motion.img
                                    key="original-image"
                                    src={originalImage}
                                    alt="Original Product"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="block max-w-full max-h-full w-auto h-auto object-contain select-none shadow-sm filter grayscale-[20%]"
                                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Frame Overlay */}
                        {selectedFrame && !showOriginal && selectedFrame.id !== 'none' && (
                            <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center">
                                <motion.img
                                    key={`frame-${selectedFrame.id}`}
                                    src={selectedFrame.url}
                                    alt="Frame"
                                    className="max-w-full max-h-full w-auto h-auto object-contain"
                                    style={{ zIndex: 10 }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================================================================================== */}
            {/* 懸浮 UI (Toolbar, Buttons) - 保持在最上層 */}
            {/* ================================================================================== */}

            {/* Peek Original Button */}
            {editedImage && !isProcessing && !isCropping && (
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
            )}

            {/* Loading State */}
            {isProcessing && <LoadingState />}

            {/* Floating Toolbar */}
            {(editedImage || originalImage) && !isProcessing && !isCropping && (
                <FloatingToolbar
                    className={`
                        transition-opacity duration-300 ease-in-out
                        ${!isHoveringCanvas && !isHoveringToolbar ? 'md:opacity-0 md:pointer-events-none' :
                            isHoveringToolbar ? 'md:opacity-100' : 'md:opacity-40'
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
                />
            )}

            {/* Crop Controls */}
            {isCropping && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10 pointer-events-auto w-max max-w-[90vw]">
                    <button
                        onClick={() => setIsCropping(false)}
                        className="text-white/90 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <CancelIcon size={18} />
                        取消
                    </button>
                    <div className="w-px h-4 bg-white/20"></div>
                    <span className="text-white/50 text-xs font-medium whitespace-nowrap hidden md:block">拖曳以裁切</span>
                    <div className="w-px h-4 bg-white/20 hidden md:block"></div>
                    <button
                        onClick={handleSaveCrop}
                        className="text-white hover:text-blue-400 flex items-center gap-2 text-sm font-bold transition-colors"
                    >
                        <Check size={18} />
                        完成
                    </button>
                </div>
            )}
        </div>
    );
}
