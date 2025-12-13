import { motion, AnimatePresence } from 'framer-motion';
import LoadingState from './LoadingState';
import FloatingToolbar from './FloatingToolbar';

interface ImageCanvasProps {
    originalImage: string | null;
    editedImage: string | null;
    isProcessing: boolean;
    onRegenerate: () => void;
}

export default function ImageCanvas({
    originalImage,
    editedImage,
    isProcessing,
    onRegenerate
}: ImageCanvasProps) {
    // 未上傳圖片時的預設骨架
    if (!originalImage) {
        return (
            <div className="w-[500px] h-[500px] bg-gray-100 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <p className="text-gray-400 font-medium">請先在左側上傳圖片</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* 1080x1080 畫布容器 (維持正方形比例) */}
            <div className="relative aspect-square max-h-[85vh] max-w-[85vh] w-full bg-white dark:bg-black shadow-2xl rounded-sm overflow-hidden border border-gray-100 dark:border-gray-800">

                {/* 圖片顯示區域 */}
                <div className="absolute inset-0">
                    <AnimatePresence mode="wait">
                        {editedImage ? (
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
                </div>

                {/* 加載狀態遮罩 */}
                {isProcessing && <LoadingState />}
            </div>

            {/* 浮動工具列 - 只有當有結果圖時才顯示 */}
            {editedImage && !isProcessing && (
                <FloatingToolbar
                    onAddText={() => console.log('Add Text')}
                    onAddWatermark={() => console.log('Add Watermark')}
                    onRegenerate={onRegenerate}
                />
            )}
        </div>
    );
}
