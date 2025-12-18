import { useState, useEffect } from 'react';

export function useImagePreloader(urls: (string | undefined)[]) {
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const validUrls = urls.filter(Boolean) as string[];

        if (validUrls.length === 0) {
            setImagesLoaded(true);
            return;
        }

        setImagesLoaded(false);
        setError(null);

        let mounted = true;

        const loadPromises = validUrls.map(url => {
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
    }, [JSON.stringify(urls)]);

    return { imagesLoaded, error };
}
