import { X, Plus } from 'lucide-react';
import { Frame, BUILT_IN_FRAMES } from '../../types/frame';

/**
 * Sanitize URL to prevent XSS via javascript: protocol
 * Uses strict allowlist approach for safe protocols
 */
function sanitizeImageUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';

    const trimmed = url.trim();
    if (!trimmed) return '';

    // Allow data:image/ URLs (base64 images)
    if (trimmed.toLowerCase().startsWith('data:image/')) {
        return trimmed;
    }

    // Validate URL structure and protocol
    try {
        const parsed = new URL(trimmed, window.location.origin);
        // Only allow http and https protocols
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch {
        // If it's a relative path, allow it (will be resolved against origin)
        if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
            return trimmed;
        }
    }

    return '';
}

interface FrameSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    selectedFrame: Frame | null;
    onSelectFrame: (frame: Frame | null) => void;
    customFrames: Frame[];
    onUploadFrame: () => void;
}

export default function FrameSelector({
    isOpen,
    onClose,
    selectedFrame,
    onSelectFrame,
    customFrames,
    onUploadFrame
}: FrameSelectorProps) {
    if (!isOpen) return null;

    const allFrames = [...BUILT_IN_FRAMES, ...customFrames];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-[#2d2d2d] z-10">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">選擇圖框</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                        {allFrames.map((frame) => (
                            <button
                                key={frame.id}
                                onClick={() => {
                                    if (frame.id === 'none') {
                                        onSelectFrame(null);
                                    } else {
                                        onSelectFrame(frame);
                                    }
                                    onClose();
                                }}
                                className={`
                                    relative aspect-square rounded-lg border-2 transition-all overflow-hidden
                                    ${selectedFrame?.id === frame.id || (frame.id === 'none' && !selectedFrame)
                                        ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                                    }
                                `}
                            >
                                {frame.id === 'none' ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                            無圖框
                                        </span>
                                    </div>
                                ) : (
                                    <img
                                        src={sanitizeImageUrl(frame.preview)}
                                        alt={frame.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                    <p className="text-xs font-medium text-white truncate">{frame.name}</p>
                                </div>
                            </button>
                        ))}

                        {/* Upload Custom Frame Button */}
                        <button
                            onClick={() => {
                                onClose();
                                onUploadFrame();
                            }}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex flex-col items-center justify-center gap-2"
                        >
                            <Plus size={24} className="text-gray-400" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                上傳圖框
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
