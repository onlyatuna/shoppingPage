import { motion, AnimatePresence } from 'framer-motion';
import LoadingState from './LoadingState';
import FloatingToolbar from './FloatingToolbar';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X, Check, X as CancelIcon, Eye } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/canvasUtils';
import { useState, useCallback, useEffect, useRef } from 'react';

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
}

import { Frame } from '../../types/frame';

export default function ImageCanvas({
    originalImage,
    editedImage,
    isProcessing,
    onRegenerate,
    onImageUpload,
    onOpenLibrary,
    onRemove,
    onSelectFrame,
    selectedFrame
}: ImageCanvasProps) {
    // Cropping State
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    // Peek Original State
    const [showOriginal, setShowOriginal] = useState(false);

    // Toolbar Visibility State
    const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
    const [isHoveringToolbar, setIsHoveringToolbar] = useState(false);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        console.log(croppedArea, croppedAreaPixels);
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSaveCrop = async () => {
        if (!originalImage && !editedImage) return;

        const sourceImage = editedImage || originalImage;
        if (!sourceImage) return;

        try {
            const croppedImage = await getCroppedImg(
                sourceImage,
                croppedAreaPixels,
                rotation
            );

            if (croppedImage) {
                // Determine if we are cropping the original or the edited one
                // Logic: If there is an edited image, we usually want to continue from there.
                // But the user might want to re-crop the original.
                // For simplicity, we treat the result as a new "uploaded" image (resetting edits) 
                // OR we just update the current view.

                // Let's treat it as a new upload so it resets the flow (simplest consistent state)
                // Convert base64 to File object to reuse onImageUpload logic?
                // Or just call a prop to update the current image state directly.

                // Since onImageUpload expects a File, let's create one.
                const res = await fetch(croppedImage);
                const blob = await res.blob();
                const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });

                onImageUpload(file);
                setIsCropping(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles?.[0]) {
                onImageUpload(acceptedFiles[0]);
            }
        },
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        multiple: false
    });
    // 未上傳圖片時的預設骨架 -> 轉為上傳區
    if (!originalImage) {
        return (
            <div
                {...getRootProps()}
                className={`w-[500px] h-[500px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
                    ${isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750'
                    }`}
            >
                <input {...getInputProps()} aria-label="上傳圖片" />
                <div className="p-4 rounded-full bg-white dark:bg-gray-700 shadow-sm mb-4">
                    <Upload className="w-8 h-8 text-indigo-500" />
                </div>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
                    {isDragActive ? '放開以已上傳' : '拖曳圖片至此'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    或點擊選擇檔案
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
            <div
                className="group relative aspect-square max-h-[85vh] max-w-[85vh] w-full bg-white dark:bg-black shadow-2xl rounded-sm overflow-hidden border border-gray-100 dark:border-gray-800"
                onMouseEnter={() => setIsHoveringCanvas(true)}
                onMouseLeave={() => setIsHoveringCanvas(false)}
            >

                {/* Remove Button - Top Right */}
                {onRemove && (editedImage || originalImage) && !isProcessing && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="absolute top-4 right-4 z-20 p-2 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white dark:hover:bg-red-500"
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
                <div className="absolute inset-0">
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
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <motion.img
                                key="original-image"
                                src={originalImage}
                                alt="Original Product"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full object-contain filter grayscale-[20%]"
                            />
                        )}
                    </AnimatePresence>

                    {/* Frame Overlay - Only show if frame is selected and not showing original */}
                    {selectedFrame && !showOriginal && selectedFrame.id !== 'none' && (
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
                </div>

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
                            setZoom(1);
                            setRotation(0);
                            setCrop({ x: 0, y: 0 });
                            setIsCropping(true);
                        }}
                        onRegenerate={onRegenerate}
                        onSelectFrame={onSelectFrame}
                    />
                )}
            </div>

            {/* Cropping UI Overlay */}
            {isCropping && (editedImage || originalImage) && (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col">
                    <div className="relative flex-1 w-full">
                        <Cropper
                            image={editedImage || originalImage || ''}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            rotation={rotation}
                            onRotationChange={setRotation}
                        />
                    </div>
                    <div className="h-16 flex items-center justify-between px-8 bg-black">
                        <button
                            onClick={() => setIsCropping(false)}
                            className="text-white flex items-center gap-2 hover:text-gray-300"
                        >
                            <CancelIcon size={24} />
                            取消
                        </button>
                        <span className="text-white font-medium">拖曳調整 (1:1)</span>
                        <button
                            onClick={handleSaveCrop}
                            className="bg-white text-black px-4 py-1.5 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200"
                        >
                            <Check size={20} />
                            完成
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
