import { useState, useEffect } from 'react';
import { X, Sparkles, Wand2, Palette, Lightbulb, Zap, Rocket, Hammer, Wrench, Leaf, Coffee, Sun, Gem, BrainCircuit, Bot, FlaskConical, Search, PartyPopper, Trophy, Crown, Medal } from 'lucide-react';

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
    { name: 'Wand2', component: Wand2 },
    { name: 'Palette', component: Palette },
    { name: 'Lightbulb', component: Lightbulb },
    { name: 'Zap', component: Zap },
    { name: 'Rocket', component: Rocket },
    { name: 'Hammer', component: Hammer },
    { name: 'Wrench', component: Wrench },
    { name: 'Leaf', component: Leaf },
    { name: 'Coffee', component: Coffee },
    { name: 'Sun', component: Sun },
    { name: 'Gem', component: Gem },
    { name: 'BrainCircuit', component: BrainCircuit },
    { name: 'Bot', component: Bot },
    { name: 'FlaskConical', component: FlaskConical },
    { name: 'Search', component: Search },
    { name: 'PartyPopper', component: PartyPopper },
    { name: 'Trophy', component: Trophy },
    { name: 'Crown', component: Crown },
    { name: 'Medal', component: Medal },
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
    const [desc, setDesc] = useState('');
    const [prompt, setPrompt] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(availableIcons[0].name);
    const [selectedTheme, setSelectedTheme] = useState(colorThemes[0]);
    const [isIconDrawerOpen, setIsIconDrawerOpen] = useState(false);
    const [isColorDrawerOpen, setIsColorDrawerOpen] = useState(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

    // Load initial values when editing
    useEffect(() => {
        if (initialStyle) {
            setName(initialStyle.name);
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
            setDesc('');
            setPrompt('');
            setSelectedIcon(availableIcons[0].name);
            setSelectedTheme(colorThemes[0]);
        }
    }, [initialStyle, isOpen]);

    const handleSave = () => {
        if (!name || !desc || !prompt) {
            return;
        }

        const customStyle: CustomStyle = {
            id: initialStyle?.id, // Preserve database ID when editing
            key: initialStyle?.key || `custom_${Date.now()}`, // Use existing key if editing, otherwise generate new
            name,
            engName: name, // Use Chinese name as engName
            desc,
            icon: selectedIcon,
            color: selectedTheme.color,
            borderColor: selectedTheme.borderColor,
            prompt,
        };

        onSave(customStyle);
        handleClose();
    };

    const handleGeneratePrompt = async () => {
        if (!name || !desc) {
            return;
        }

        setIsGeneratingPrompt(true);
        try {
            const response = await fetch('/api/v1/gemini/generate-custom-style-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    styleName: name,
                    styleDescription: desc,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate prompt');
            }

            const data = await response.json();
            if (data.prompt) {
                setPrompt(data.prompt);
            }
        } catch (error) {
            console.error('Error generating prompt:', error);
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const handleClose = () => {
        setName('');
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
                {/* Header - Empty for spacing */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-[#2d2d2d] z-10">
                    {/* Empty header area */}
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Column - Input Fields */}
                        <div className="space-y-6">
                            {/* Name Field */}
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

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    簡短描述 *
                                </label>
                                <input
                                    type="text"
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                    placeholder="例：懷舊、溫暖"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />

                                {/* Generate Prompt Button */}
                                <button
                                    type="button"
                                    onClick={handleGeneratePrompt}
                                    disabled={!name || !desc || isGeneratingPrompt}
                                    className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={18} />
                                    {isGeneratingPrompt ? '生成中...' : '一鍵提示詞'}
                                </button>
                            </div>
                        </div>

                        {/* Right Column - Style Preview */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                風格樣式預覽
                            </label>

                            {/* Combined Preview + Change Buttons */}
                            <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                {/* Button Preview - Matches style preset button appearance */}
                                <div className={`
                                    max-w-[150px] mx-auto aspect-[5/4] relative p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between
                                    ${selectedTheme.color}
                                    ${selectedTheme.borderColor}
                                    opacity-80 hover:opacity-100
                                `}>
                                    <div className="flex items-start justify-between mb-1">
                                        <span className="text-sm font-bold">自訂風格</span>
                                        {(() => {
                                            const SelectedIconComponent = availableIcons.find(i => i.name === selectedIcon)?.component || Sparkles;
                                            return <SelectedIconComponent size={16} />;
                                        })()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium opacity-80">Custom Style</p>
                                        <p className="text-[10px] mt-1 opacity-70 leading-tight">
                                            按鈕預覽樣式
                                        </p>
                                    </div>
                                </div>

                                {/* Change Buttons */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsIconDrawerOpen(true)}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                        更換圖示
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsColorDrawerOpen(true)}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                        更換主題
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Icon Drawer */}
                    {isIconDrawerOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[60]" onClick={() => setIsIconDrawerOpen(false)}>
                            <div
                                className="bg-white dark:bg-[#2d2d2d] rounded-t-2xl w-full max-w-2xl max-h-[70vh] overflow-y-auto animate-slide-up"
                                onClick={(e) => e.stopPropagation()}>
                                <div className="sticky top-0 bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">選擇圖示</h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsIconDrawerOpen(false)}
                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-4 grid grid-cols-4 gap-3">
                                    {availableIcons.map((icon) => {
                                        const IconComponent = icon.component;
                                        return (
                                            <button
                                                type="button"
                                                key={icon.name}
                                                onClick={() => {
                                                    setSelectedIcon(icon.name);
                                                    setIsIconDrawerOpen(false);
                                                }}
                                                className={`p-4 rounded-lg border-2 transition-all ${selectedIcon === icon.name
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 hover:scale-105'
                                                    }`}>
                                                <IconComponent size={24} className="text-gray-700 dark:text-gray-300 mx-auto" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Color Theme Drawer */}
                    {isColorDrawerOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[60]" onClick={() => setIsColorDrawerOpen(false)}>
                            <div
                                className="bg-white dark:bg-[#2d2d2d] rounded-t-2xl w-full max-w-2xl max-h-[70vh] overflow-y-auto animate-slide-up"
                                onClick={(e) => e.stopPropagation()}>
                                <div className="sticky top-0 bg-white dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">選擇顏色主題</h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsColorDrawerOpen(false)}
                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-4 grid grid-cols-3 gap-3">
                                    {colorThemes.map((theme, index) => (
                                        <button
                                            type="button"
                                            key={index}
                                            onClick={() => {
                                                setSelectedTheme(theme);
                                                setIsColorDrawerOpen(false);
                                            }}
                                            className={`p-4 rounded-lg border-2 transition-all ${theme.color} ${selectedTheme === theme
                                                ? 'ring-2 ring-blue-500 scale-105'
                                                : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                                                }`}>
                                            <span className="text-sm font-medium">{theme.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Prompt */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            AI 設計提示詞 *
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onClick={(e) => {
                                // On mobile, scroll this element into view when clicked/focused
                                setTimeout(() => {
                                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 300);
                            }}
                            onFocus={(e) => {
                                // On mobile, scroll this element into view when clicked/focused
                                setTimeout(() => {
                                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 300);
                            }}
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
                        disabled={!name || !desc || !prompt}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {initialStyle ? '💾 更新風格' : '💾 儲存'}
                    </button>
                </div>
            </div>
        </div>
    );
}
