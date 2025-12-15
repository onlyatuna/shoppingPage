import { motion, AnimatePresence } from 'framer-motion';
import LoadingState from './LoadingState';
import FloatingToolbar from './FloatingToolbar';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X, Check, X as CancelIcon, Eye } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import getCroppedImg from '../../utils/canvasUtils';
import { useState, useRef } from 'react';
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
    setIsCropping
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

            const pixelCrop = {
                x: completedCrop.x * scaleX,
                y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX,
                height: completedCrop.height * scaleY,
            };

            const croppedImage = await getCroppedImg(
                sourceImage,
                pixelCrop,
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

    // 未上傳圖片時的預設骨架 -> 轉為上傳區
    if (!originalImage) {
        return (
            <div
                {...getRootProps()}
                className={`w-full max-w-[500px] aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                    }`}
            >
                <input {...getInputProps()} aria-label="上傳圖片" />
                <div className="p-4 rounded-full bg-white dark:bg-gray-700 shadow-sm mb-4">
                    <Upload className="w-8 h-8 text-indigo-500" />
                </div>
                <p className="hidden md:block text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
                    {isDragActive ? '放開以已上傳' : '拖曳圖片至此'}
                </p>
                <p className="text-base md:text-sm font-bold md:font-normal text-gray-700 dark:text-gray-200 md:text-gray-500 md:dark:text-gray-400">
                    <span className="md:hidden">點擊拍照或上傳</span>
                    <span className="hidden md:inline">或點擊選擇檔案</span>
                </p>

                <div className="mt-6 flex items-center gap-2">
                    <span className="text-sm text-gray-400">或</span>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenLibrary();
                        }}
                        className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                        <ImageIcon size={16} />
                        從雲端圖庫選擇
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* 1080x1080 畫布容器 (維持正方形比例) */}
            {/* 1080x1080 畫布容器 (維持正方形比例 - 類似 Instagram 預覽) */}
            <div
                className="group relative aspect-square max-h-[85vh] max-w-[85vh] w-full bg-white dark:bg-black shadow-2xl rounded-sm overflow-hidden border border-gray-100 dark:border-gray-800 flex items-center justify-center bg-checkered"
                onMouseEnter={() => setIsHoveringCanvas(true)}
                onMouseLeave={() => setIsHoveringCanvas(false)}
            >

                {/* Remove Button - Top Right */}
                {onRemove && (editedImage || originalImage) && !isProcessing && !isCropping && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="absolute top-4 right-4 z-20 p-2 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white dark:hover:bg-red-500"
                        title="移除圖片"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Peek Original Button - Bottom Left (Only if edited image exists) */}
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

                {/* 圖片顯示區域 */}
                {/* 圖片顯示區域 - Flex centered */}
                <div className="relative flex items-center justify-center w-full h-full pointer-events-none">
                    <div className="pointer-events-auto"> {/* Wrapper for pointer events */}
                        {isCropping ? (
                            <>
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1} // Fixed 1:1 aspect ratio
                                    minWidth={100} // Minimum size constraint
                                    keepSelection={true} // Prevent clearing selection
                                    className="max-h-full max-w-full"
                                >
                                    <img
                                        ref={imgRef}
                                        src={editedImage || originalImage || ''}
                                        className="max-h-[85vh] max-w-[85vh] w-auto h-auto"
                                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} // Ensure it fits in parent
                                        alt="Crop target"
                                        onLoad={(e) => {
                                            const { width, height } = e.currentTarget;
                                            // Default crop: 90% of smallest dimension, centered square
                                            const size = Math.min(width, height) * 0.9;
                                            const x = (width - size) / 2;
                                            const y = (height - size) / 2;

                                            const newCrop: Crop = {
                                                unit: 'px',
                                                x,
                                                y,
                                                width: size,
                                                height: size,
                                            };

                                            setCrop(newCrop);
                                            setCompletedCrop({ ...newCrop, width: size, height: size } as PixelCrop);
                                        }}
                                    />
                                </ReactCrop>

                            </>
                        ) : (
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
                                        className="max-h-full max-w-full w-auto h-auto"
                                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <motion.img
                                        key="original-image"
                                        src={originalImage}
                                        alt="Original Product"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="max-h-full max-w-full w-auto h-auto filter grayscale-[20%]"
                                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                                    />
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* Frame Overlay - Only show if frame is selected and not showing original AND NOT CROPPING */}
                {selectedFrame && !showOriginal && !isCropping && selectedFrame.id !== 'none' && (
                    <motion.img
                        key={`frame-${selectedFrame.id}`}
                        src={selectedFrame.url}
                        alt="Frame"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{ zIndex: 10 }}
                    />
                )}





                {/* 加載狀態遮罩 */}
                {isProcessing && <LoadingState />}

                {/* 浮動工具列 - 只有當有結果圖時才顯示 */}
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

                        onCrop={() => {
                            // Reset crop state
                            setCrop(undefined); // Start with full image or let user draw
                            setIsCropping(true);
                        }}
                        onRegenerate={onRegenerate}
                        onSelectFrame={onSelectFrame}
                    />
                )}
            </div>

            {/* Crop Floating Controls - Moved to outer wrapper for better mobile positioning (below canvas) */}
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
