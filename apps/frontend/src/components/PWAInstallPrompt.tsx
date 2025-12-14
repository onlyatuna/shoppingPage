import { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // 1. Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isIosDevice && !isStandalone) {
            setIsIOS(true);
            // Show prompt after a delay for iOS users
            setTimeout(() => setShowPrompt(true), 3000);
        }

        // 2. Handle standard 'beforeinstallprompt' (Android/Desktop)
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault(); // Prevent automatic mini-infobar
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[100] animate-in slide-in-from-bottom duration-300">
            <button
                onClick={() => setShowPrompt(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
                <X size={20} />
            </button>

            <div className="flex items-start gap-4">
                <div className="bg-black text-white p-3 rounded-xl">
                    <Download size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">安裝 App</h3>

                    {isIOS ? (
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                            <p>在 iOS 上安裝請依下列步驟：</p>
                            <ol className="list-decimal list-inside space-y-1 ml-1">
                                <li>點擊瀏覽器下方的 <Share className="inline w-4 h-4 mx-1" /> 分享按鈕</li>
                                <li>往下滑找到並點選「加入主畫面」</li>
                            </ol>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                安裝到您的裝置以獲得更好的體驗。
                            </p>
                            <button
                                onClick={handleInstallClick}
                                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-gray-800 transition-colors"
                            >
                                立即安裝
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
