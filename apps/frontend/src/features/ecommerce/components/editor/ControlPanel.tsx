
import StylePresetGrid, { StylePresetKey } from './StylePresetGrid';
import { CustomStyle } from './CustomStyleModal';

interface ControlPanelProps {
    selectedStyle: StylePresetKey | string | null;
    onSelectStyle: (style: StylePresetKey | string) => void;
    customStyles?: CustomStyle[];
    onAddCustomStyle?: () => void;
    isProcessing: boolean;
}

export default function ControlPanel({
    selectedStyle,
    onSelectStyle,
    customStyles,
    onAddCustomStyle,
    isProcessing
}: ControlPanelProps) {
    return (
        <div className="w-[300px] h-full flex flex-col bg-white dark:bg-[#2d2d2d] border-r border-gray-200 dark:border-gray-700 transition-colors z-20">


            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background-color: rgba(156, 163, 175, 0.5);
                        border-radius: 20px;
                    }
                `}</style>


                <StylePresetGrid
                    selectedStyle={selectedStyle}
                    onSelectStyle={onSelectStyle}
                    customStyles={customStyles}
                    onAddCustomStyle={onAddCustomStyle}
                    disabled={isProcessing}
                />
            </div>

            {/* 底部狀態欄或版本號 (可選) */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-center">
                Gemini AI Image Editor v1.1
            </div>
        </div>
    );
}
