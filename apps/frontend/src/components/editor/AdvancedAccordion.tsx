import { useState } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';

interface AdvancedAccordionProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    disabled?: boolean;
}

export default function AdvancedAccordion({ prompt, onPromptChange, disabled }: AdvancedAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                disabled={disabled}
            >
                <div className="flex items-center gap-2">
                    <Settings size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        2. 魔法參數
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp size={16} className="text-gray-500" />
                ) : (
                    <ChevronDown size={16} className="text-gray-500" />
                )}
            </button>

            {isOpen && (
                <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                    <div className="mt-3">
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                            自訂編輯指令 (Prompt)
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => onPromptChange(e.target.value)}
                            placeholder="例如：將背景改為星空，增加夢幻感..."
                            className="w-full h-24 p-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            disabled={disabled}
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            * 此處內容會覆蓋風格預設的指令
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
