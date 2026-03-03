// src/hooks/useImagePreloader.ts
import { useState, useEffect } from 'react';

export function useImagePreloader(urls: (string | undefined)[]) {
    const validUrls = urls.filter(Boolean) as string[];
    const [imagesLoaded, setImagesLoaded] = useState(validUrls.length === 0);
    const [error, setError] = useState<Error | null>(null);

    const [trackedUrls, setTrackedUrls] = useState(JSON.stringify(urls));
    if (JSON.stringify(urls) !== trackedUrls) {
        setTrackedUrls(JSON.stringify(urls));
        setImagesLoaded(validUrls.length === 0);
        setError(null);
    }

    useEffect(() => {
        const currentUrls = JSON.parse(trackedUrls) as (string | undefined)[];
        const currentValidUrls = currentUrls.filter(Boolean) as string[];
        if (currentValidUrls.length === 0) return;

        let mounted = true;

        const loadPromises = currentValidUrls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                // [FIX 1] 解決 Canvas 跨域污染問題
                img.crossOrigin = 'anonymous';

                // [FIX 2] 設立 5 秒超時機制，防止瀏覽器 Intervention 導致 Promise 永遠掛起
                const timer = setTimeout(() => {
                    console.warn(`⏳ Image preload timed out (bypassing): ${url}`);
                    resolve(null); // 強制解除阻塞
                }, 5000);

                img.onload = () => {
                    clearTimeout(timer);
                    resolve(img);
                };

                img.onerror = (err) => {
                    clearTimeout(timer);
                    reject(err);
                };

                img.src = url;
            });
        });

        Promise.all(loadPromises)
            .then(() => {
                if (mounted) setImagesLoaded(true);
            })
            .catch(err => {
                if (mounted) {
                    console.warn('⚠️ Failed to preload some images', err);
                    // [FIX 3] 就算報錯也強制解開 Loading UI
                    setImagesLoaded(true);
                    setError(err as Error);
                }
            });

        return () => {
            mounted = false;
        };
    }, [trackedUrls]);

    return { imagesLoaded, error };
}
