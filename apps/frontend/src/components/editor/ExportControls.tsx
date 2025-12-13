import { useState } from 'react';
import { Download, Instagram, PackagePlus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExportControlsProps {
    onDownload: () => void;
    onPublishInstagram: () => void;
    onPublishProduct: () => void;
    disabled?: boolean;
}

export default function ExportControls({
    onDownload,
    onPublishInstagram,
    onPublishProduct,
    disabled
}: ExportControlsProps) {
    const [isPublishing, setIsPublishing] = useState(false);

    const handlePublish = async () => {
        if (disabled) return;

        setIsPublishing(true);
        try {
            await onPublishInstagram();

            // Success Animation
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 9999
            });

        } catch (error) {
            console.error(error);
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="mt-auto">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                匯出與發佈
            </h3>

            <div className="flex flex-col gap-3">
                {/* 主按鈕：下載圖片 */}
                <button
                    onClick={onDownload}
                    disabled={disabled}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                    <Download size={18} />
                    下載圖片 (JPG)
                </button>

                <button
                    onClick={onPublishProduct}
                    disabled={disabled}
                    className="w-full py-3 px-4 bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                    <PackagePlus size={18} />
                    上架為商品
                </button>

                {/* 次按鈕：發佈到 IG */}
                <button
                    onClick={handlePublish}
                    disabled={disabled || isPublishing}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                    {isPublishing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Instagram size={18} />
                    )}
                    一鍵發佈到 IG
                </button>
            </div>

            {/* 商業變現提示 */}
            <p className="text-xs text-center text-gray-400 mt-4">
                升級 Pro 版可解鎖自動排程功能
            </p>
        </div>
    );
}
