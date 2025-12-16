import { useState } from 'react';
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface CopywritingAssistantProps {
    generatedCaption: string | null;
    onCaptionChange?: (value: string) => void;
    captionPrompt: string;
    onCaptionPromptChange: (value: string) => void;
    isGenerating: boolean;
    onGenerate: () => void;
    disabled?: boolean;
    instanceId?: string; // Unique identifier for this instance (e.g., 'desktop' or 'mobile')
}

export default function CopywritingAssistant({
    generatedCaption,
    onCaptionChange,
    captionPrompt,
    onCaptionPromptChange,
    isGenerating,
    instanceId = 'default',
    onGenerate,
    disabled
}: CopywritingAssistantProps) {
    const [copied, setCopied] = useState(false);
    const [isPromptExpanded, setIsPromptExpanded] = useState(false);

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




            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 relative transition-colors flex flex-col gap-4">
                {/* 結果/編輯區 - 放在最上面 */}
                <div>
                    <label htmlFor={`caption-input-${instanceId}`} className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
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
                                id={`caption-input-${instanceId}`}
                                value={generatedCaption || ''}
                                onChange={(e) => onCaptionChange?.(e.target.value)}
                                placeholder="在此輸入貼文內容，或點擊上方「自動生成」由 AI 幫您撰寫..."
                                className="w-full h-[200px] bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 leading-relaxed font-sans"
                            />
                            {generatedCaption && (
                                <button
                                    type="button"
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



                {/* Collapsible Prompt Input Section - 可折叠的文案提示输入框 */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                            <Lightbulb size={14} className="text-yellow-600" />
                            💡 文案提示
                        </div>
                        {isPromptExpanded ? (
                            <ChevronUp size={16} className="text-gray-500" />
                        ) : (
                            <ChevronDown size={16} className="text-gray-500" />
                        )}
                    </button>

                    {isPromptExpanded && (
                        <div className="px-3 py-3 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-700">
                            <input
                                type="text"
                                value={captionPrompt}
                                onChange={(e) => onCaptionPromptChange(e.target.value)}
                                placeholder="例如：母親節優惠、針對上班族"
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                                disabled={isGenerating}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                輸入具體要求，例如：「適合 IG 貼文」、「輕鬆活潑的語氣」、「針對年輕族群」
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Auto Generate Button - Moved outside content box */}
            <div className="flex justify-end mt-2">
                <button
                    type="button"
                    onClick={onGenerate}
                    disabled={disabled || isGenerating}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                    <Sparkles size={18} />
                    {generatedCaption ? '重新生成文案' : '自動生成文案'}
                </button>
            </div>
        </div>
    );
}
