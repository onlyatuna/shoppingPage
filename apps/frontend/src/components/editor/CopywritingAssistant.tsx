import { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopywritingAssistantProps {
    generatedCaption: string | null;
    onCaptionChange?: (value: string) => void;
    captionPrompt: string;
    onCaptionPromptChange: (value: string) => void;
    isGenerating: boolean;
    onGenerate: () => void;
    disabled?: boolean;
}

export default function CopywritingAssistant({
    generatedCaption,
    onCaptionChange,
    captionPrompt,
    onCaptionPromptChange,
    isGenerating,
    onGenerate,
    disabled
}: CopywritingAssistantProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (generatedCaption) {
            navigator.clipboard.writeText(generatedCaption);
            setCopied(true);
            toast.success('文案已複製！');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    AI 文案助理
                </h3>
                <button
                    onClick={onGenerate}
                    disabled={disabled || isGenerating}
                    className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                    <Sparkles size={12} />
                    {generatedCaption ? '重新生成' : '自動生成'}
                </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 relative transition-colors flex flex-col gap-4">
                {/* 參數輸入：文案提示 */}
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                        💡 文案提示 (例如：母親節優惠、針對上班族)
                    </label>
                    <input
                        type="text"
                        value={captionPrompt}
                        onChange={(e) => onCaptionPromptChange(e.target.value)}
                        placeholder="輸入提示讓 AI 更精準..."
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                        disabled={isGenerating}
                    />
                </div>

                {/* 結果/編輯區 */}
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                        📝 貼文內容
                    </label>
                    {isGenerating ? (
                        <div className="h-[200px] bg-white dark:bg-gray-700/30 rounded-lg flex flex-col items-center justify-center text-center border border-gray-200 dark:border-gray-600 border-dashed">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs text-gray-500">正在撰寫貼文...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <textarea
                                value={generatedCaption || ''}
                                onChange={(e) => onCaptionChange?.(e.target.value)}
                                placeholder="在此輸入貼文內容，或點擊上方「自動生成」由 AI 幫您撰寫..."
                                className="w-full h-[200px] bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 leading-relaxed font-sans"
                            />
                            {generatedCaption && (
                                <button
                                    onClick={handleCopy}
                                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white dark:bg-gray-700 shadow-sm hover:shadow text-gray-500 hover:text-blue-500 transition-all z-10 border border-gray-100 dark:border-gray-600"
                                    title="複製文案"
                                >
                                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
