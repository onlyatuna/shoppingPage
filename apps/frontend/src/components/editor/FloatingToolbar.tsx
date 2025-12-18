import { RefreshCw, Type, Stamp, Crop, Frame as FrameIcon, X } from 'lucide-react';

interface FloatingToolbarProps {
    onAddText: () => void;
    onAddWatermark: () => void;
    onCrop: () => void;
    onRegenerate: () => void;
    onSelectFrame: () => void;
    onRemove?: () => void;
    disabled?: boolean;
    isRegenerateDisabled?: boolean;
    className?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    scale?: number;
    onScaleChange?: (scale: number) => void;
}

export default function FloatingToolbar({
    // onAddText,      // Disabled
    // onAddWatermark, // Disabled
    onCrop,
    onRegenerate,
    onSelectFrame,
    onRemove,
    disabled,
    isRegenerateDisabled,
    className,
    onMouseEnter,
    onMouseLeave,
    scale,
    onScaleChange
}: FloatingToolbarProps) {
    return (
        <div
            className={`
                fixed landscape:absolute 
                bottom-32 landscape:bottom-8 tablet-portrait:bottom-36 
                left-1/2 -translate-x-1/2 
                flex items-center gap-2 tablet-portrait:gap-3 
                bg-white/90 dark:bg-gray-800/90 backdrop-blur-md 
                p-2 tablet-portrait:p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 
                transition-all landscape:hover:scale-105 z-[50]
                ${className || ''}
            `}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {onRemove && (
                <>
                    <button
                        onClick={onRemove}
                        disabled={disabled}
                        className="p-3 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors tooltip-trigger"
                        title="移除圖片"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                </>
            )}

            <button
                type="button"
                disabled={true}
                className="p-3 rounded-full text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                title="添加文字 (Coming Soon)"
            >
                <Type size={20} />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            {/* Scale Control - Only show if onScaleChange is provided (Mockup Mode) */}
            {onScaleChange && typeof scale === 'number' && (
                <>
                    <div className="group relative flex items-center justify-center">
                        <button
                            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                            title="調整大小"
                        >
                            <span className="text-xs font-bold">Size</span>
                        </button>

                        {/* Popup Slider */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 hidden group-hover:block transition-all opactiy-0 group-hover:opacity-100">
                            <input
                                type="range"
                                min="0.1"
                                max="2.0"
                                step="0.05"
                                value={scale}
                                onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="text-center text-xs text-gray-500 mt-1">{Math.round(scale * 100)}%</div>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                </>
            )}

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
                type="button"
                disabled={true}
                className="p-3 rounded-full text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                title="添加浮水印 (Coming Soon)"
            >
                <Stamp size={20} />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            <button
                onClick={onRegenerate}
                disabled={disabled || isRegenerateDisabled}
                className={`p-3 rounded-full shadow-md transition-all 
                    ${disabled || isRegenerateDisabled
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-blue-500/30'
                    }`}
                title="不滿意重算"
            >
                <RefreshCw size={20} className={disabled ? 'animate-spin' : ''} />
            </button>
        </div>
    );
}
