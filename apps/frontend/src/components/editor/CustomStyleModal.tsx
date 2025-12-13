import { useState, useEffect } from 'react';
import { X, Sparkles, Gem, Leaf, PartyPopper, Palette } from 'lucide-react';

interface CustomStyleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (style: CustomStyle) => void;
    initialStyle?: CustomStyle | null;
}

export interface CustomStyle {
    id?: number; // Database ID for deletion
    key: string;
    name: string;
    engName: string;
    desc: string;
    icon: string;
    color: string;
    borderColor: string;
    prompt: string;
}

const availableIcons = [
    { name: 'Sparkles', component: Sparkles },
    { name: 'Gem', component: Gem },
    { name: 'Leaf', component: Leaf },
    { name: 'PartyPopper', component: PartyPopper },
    { name: 'Palette', component: Palette },
];

const colorThemes = [
    { name: '灰色', color: 'bg-gray-100 text-gray-800', borderColor: 'border-gray-200 hover:border-gray-400' },
    { name: '藍色', color: 'bg-blue-50 text-blue-800', borderColor: 'border-blue-200 hover:border-blue-400' },
    { name: '紫色', color: 'bg-purple-50 text-purple-800', borderColor: 'border-purple-200 hover:border-purple-400' },
    { name: '粉色', color: 'bg-pink-50 text-pink-800', borderColor: 'border-pink-200 hover:border-pink-400' },
    { name: '橘色', color: 'bg-orange-50 text-orange-800', borderColor: 'border-orange-200 hover:border-orange-400' },
    { name: '青色', color: 'bg-cyan-50 text-cyan-800', borderColor: 'border-cyan-200 hover:border-cyan-400' },
];

export default function CustomStyleModal({ isOpen, onClose, onSave, initialStyle }: CustomStyleModalProps) {
    const [name, setName] = useState('');
    const [engName, setEngName] = useState('');
    const [desc, setDesc] = useState('');
    const [prompt, setPrompt] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(availableIcons[0].name);
    const [selectedTheme, setSelectedTheme] = useState(colorThemes[0]);
    const [isIconDrawerOpen, setIsIconDrawerOpen] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    // Load initial values when editing
    useEffect(() => {
        if (initialStyle) {
            setName(initialStyle.name);
            setEngName(initialStyle.engName || '');
            setDesc(initialStyle.desc || '');
            setPrompt(initialStyle.prompt);
            setSelectedIcon(initialStyle.icon || availableIcons[0].name);
            // Find matching theme based on color
            const matchingTheme = colorThemes.find(t => t.color === initialStyle.color);
            if (matchingTheme) {
                setSelectedTheme(matchingTheme);
            }
        } else {
            // Reset for new style
            setName('');
            setEngName('');
            setDesc('');
            setPrompt('');
            setSelectedIcon(availableIcons[0].name);
            setSelectedTheme(colorThemes[0]);
        }
    }, [initialStyle, isOpen]);

    const handleSave = () => {
        if (!name || !engName || !desc || !prompt) {
            return;
        }

        const customStyle: CustomStyle = {
            id: initialStyle?.id, // Preserve database ID when editing
            key: initialStyle?.key || `custom_${Date.now()}`, // Use existing key if editing, otherwise generate new
            name,
            engName,
            desc,
            icon: selectedIcon,
            color: selectedTheme.color,
            borderColor: selectedTheme.borderColor,
            prompt,
        };

        onSave(customStyle);
        handleClose();
    };

    const handleClose = () => {
        setName('');
        setEngName('');
        setDesc('');
        setPrompt('');
        setSelectedIcon(availableIcons[0].name);
        setSelectedTheme(colorThemes[0]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-[#2d2d2d] z-10">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {initialStyle ? '✏️ 編輯自訂風格' : '✨ 新增自訂風格'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                風格名稱 *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例：復古風"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                英文名稱 *
                            </label>
                            <input
                                type="text"
                                value={engName}
                                onChange={(e) => setEngName(e.target.value)}
                                placeholder="例：Vintage"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            簡短描述 *
                        </label>
                        <input
                            type="text"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="例：懷舊、溫暖、底片感"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            選擇圖示
                        </label>
                        <div className="flex gap-2">
                            {availableIcons.map((icon) => {
                                const IconComponent = icon.component;
                                return (
                                    <button
                                        type="button"
                                        key={icon.name}
                                        onClick={() => setSelectedIcon(icon.name)}
                                        className={`p-3 rounded-lg border-2 transition-all ${selectedIcon === icon.name
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                            }`}
                                    >
                                        <IconComponent size={20} className="text-gray-700 dark:text-gray-300" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Color Theme Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            選擇顏色主題
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {colorThemes.map((theme, index) => (
                                <button
                                    type="button"
                                    key={index}
                                    onClick={() => setSelectedTheme(theme)}
                                    className={`p-3 rounded-lg border-2 transition-all ${theme.color} ${selectedTheme === theme
                                        ? 'ring-2 ring-blue-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                >
                                    <span className="text-sm font-medium">{theme.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Prompt */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            AI 設計提示詞 *
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="詳細描述你想要的場景、氛圍、燈光等... 例：將產品放在復古木質桌面上，背景有溫暖的黃色調光線..."
                            rows={6}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            提示：描述越詳細，AI 生成的效果越好
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name || !engName || !desc || !prompt}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {initialStyle ? '💾 更新風格' : '💾 儲存'}
                    </button>
                </div>
            </div>
        </div>
    );
}
