import { useState, useEffect } from 'react';

export function useImagePreloader(urls: (string | undefined)[]) {
    const validUrls = urls.filter(Boolean) as string[];
    const [imagesLoaded, setImagesLoaded] = useState(validUrls.length === 0);
    const [error, setError] = useState<Error | null>(null);

    // Track URLs to reset state when they change
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
                img.src = url;
                img.onload = resolve;
                img.onerror = reject;
            });
        });

        Promise.all(loadPromises)
            .then(() => {
                if (mounted) setImagesLoaded(true);
            })
            .catch(err => {
                if (mounted) {
                    console.warn('Failed to preload some images', err);
                    // Still set loaded to true so UI shows (maybe partially)
                    setImagesLoaded(true);
                    setError(err);
                }
            });

        return () => {
            mounted = false;
        };
    }, [trackedUrls]);

    return { imagesLoaded, error };
}
