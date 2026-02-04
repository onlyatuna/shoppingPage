import { useState, useEffect } from 'react';
import { Download, Instagram, PackagePlus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExportControlsProps {
    onDownload: () => void;
    onPublishInstagram: () => void;
    onPublishProduct: () => void;
    disabled?: boolean;
}

const PUBLISHING_MESSAGES = [
    '正在連接 Instagram...',
    '正在準備圖片...',
    '正在優化尺寸...',
    '正在上傳至雲端...',
    '正在設定發布參數...',
    '正在同步資料...',
];

export default function ExportControls({
    onDownload,
    onPublishInstagram,
    onPublishProduct,
    disabled
}: ExportControlsProps) {
    const [isPublishing, setIsPublishing] = useState(false);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (!isPublishing) return;

        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % PUBLISHING_MESSAGES.length);
        }, 3000); // Change message every 3 seconds (slower)

        return () => clearInterval(interval);
    }, [isPublishing]);

    const handlePublish = async () => {
        if (disabled) return;

        setIsPublishing(true);
        setMessageIndex(0);
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

            {/* Publishing Loading Overlay */}
            {isPublishing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl p-8 shadow-2xl max-w-md mx-4">
                        <div className="flex flex-col items-center gap-4">
                            {/* Instagram Icon with Animation */}
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 p-[3px] animate-spin-slow">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-[#2d2d2d] flex items-center justify-center">
                                        <Instagram size={36} className="text-pink-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Message */}
                            <div className="h-6 flex items-center justify-center">
                                <p
                                    key={messageIndex}
                                    className="text-base font-medium text-gray-900 dark:text-white text-center animate-fade-in"
                                >
                                    {PUBLISHING_MESSAGES[messageIndex]}
                                </p>
                            </div>

                            {/* Progress Dots */}
                            <div className="flex gap-2">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="w-2 h-2 rounded-full bg-pink-500 animate-pulse-delay"
                                        style={{ animationDelay: `${i * 0.2}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <style>{`
                        @keyframes spin-slow {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                        .animate-spin-slow {
                            animation: spin-slow 3s linear infinite;
                        }
                        @keyframes fade-in {
                            from { opacity: 0; transform: translateY(10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .animate-fade-in {
                            animation: fade-in 0.5s ease-in-out;
                        }
                        @keyframes pulse-delay {
                            0%, 100% { opacity: 0.3; transform: scale(1); }
                            50% { opacity: 1; transform: scale(1.5); }
                        }
                        .animate-pulse-delay {
                            animation: pulse-delay 1.5s ease-in-out infinite;
                        }
                    `}</style>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {/* 主按鈕：下載圖片 */}
                <button
                    type="button"
                    onClick={onDownload}
                    disabled={disabled}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                    <Download size={18} />
                    下載圖片 (JPG)
                </button>

                <button
                    type="button"
                    onClick={onPublishProduct}
                    disabled={disabled}
                    className="w-full py-3 px-4 bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                    <PackagePlus size={18} />
                    上架為商品
                </button>

                {/* 次按鈕：發佈到 IG */}
                <button
                    type="button"
                    onClick={handlePublish}
                    disabled={disabled || isPublishing}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                    {isPublishing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Instagram size={18} />
                            發佈到 Instagram
                        </>
                    )}
                </button>
            </div>

            {/* 商業變現提示 */}
            <p className="text-xs text-center text-gray-400 mt-4">
                升級 Pro 版可解鎖自動排程功能
            </p>
        </div>
    );
}
