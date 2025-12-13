import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import UploadZone from './UploadZone';
import StylePresetGrid, { StylePresetKey } from './StylePresetGrid';
import AdvancedAccordion from './AdvancedAccordion';

interface ControlPanelProps {
    uploadedImage: string | null;
    onImageUpload: (file: File) => void;
    onOpenLibrary: () => void;
    // onImageSelect removed as library is separate
    selectedStyle: StylePresetKey | null;
    onSelectStyle: (style: StylePresetKey) => void;
    prompt: string;
    onPromptChange: (value: string) => void;
    isProcessing: boolean;
    onGenerate: () => void;
}

export default function ControlPanel({
    uploadedImage,
    onImageUpload,
    onOpenLibrary,
    selectedStyle,
    onSelectStyle,
    prompt,
    onPromptChange,
    isProcessing,
    onGenerate
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

                <UploadZone
                    onImageUpload={onImageUpload}
                    onOpenLibrary={onOpenLibrary}
                    uploadedImage={uploadedImage}
                />

                <StylePresetGrid
                    selectedStyle={selectedStyle}
                    onSelectStyle={onSelectStyle}
                    disabled={isProcessing}
                />

                <AdvancedAccordion
                    prompt={prompt}
                    onPromptChange={onPromptChange}
                    disabled={isProcessing}
                />

                <button
                    onClick={onGenerate}
                    disabled={!uploadedImage || !prompt || isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none mb-6 group relative overflow-hidden mt-4"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {isProcessing ? 'AI 設計中...' : '✨ 開始設計'}
                    </span>
                    {!isProcessing && (
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    )}
                </button>
            </div>

            {/* 底部狀態欄或版本號 (可選) */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-center">
                Gemini AI Image Editor v1.1
            </div>
        </div>
    );
}
