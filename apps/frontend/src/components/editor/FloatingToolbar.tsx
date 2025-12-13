import { RefreshCw, Type, Stamp, Crop, Frame as FrameIcon } from 'lucide-react';

interface FloatingToolbarProps {
    onAddText: () => void;
    onAddWatermark: () => void;
    onCrop: () => void;
    onRegenerate: () => void;
    onSelectFrame: () => void;
    disabled?: boolean;
    className?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export default function FloatingToolbar({
    onAddText,
    onAddWatermark,
    onCrop,
    onRegenerate,
    onSelectFrame,
    disabled,
    className,
    onMouseEnter,
    onMouseLeave
}: FloatingToolbarProps) {
    return (
        <div
            className={`
                fixed md:absolute 
                bottom-20 md:bottom-8 
                left-1/2 -translate-x-1/2 
                flex items-center gap-2 
                bg-white/90 dark:bg-gray-800/90 backdrop-blur-md 
                p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 
                transition-all md:hover:scale-105 z-20
                ${className || ''}
            `}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <button
                onClick={onAddText}
                disabled={disabled}
                className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors tooltip-trigger"
                title="添加文字 (Coming Soon)"
            >
                <Type size={20} />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            <button
                onClick={onCrop}
                disabled={disabled}
                className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors tooltip-trigger"
                title="裁切圖片"
            >
                <Crop size={20} />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:border-gray-600" />

            <button
                onClick={onSelectFrame}
                disabled={disabled}
                className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors tooltip-trigger"
                title="選擇圖框"
            >
                <FrameIcon size={20} />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            <button
                onClick={onAddWatermark}
                disabled={disabled}
                className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors tooltip-trigger"
                title="添加浮水印 (Coming Soon)"
            >
                <Stamp size={20} />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            <button
                onClick={onRegenerate}
                disabled={disabled}
                className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-all hover:shadow-blue-500/30"
                title="不滿意重算"
            >
                <RefreshCw size={20} className={disabled ? 'animate-spin' : ''} />
            </button>
        </div>
    );
}
