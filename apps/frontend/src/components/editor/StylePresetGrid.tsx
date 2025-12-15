import { useState } from 'react';
import { Sparkles, Gem, Leaf, PartyPopper, Plus, Palette, Pencil, Trash2 } from 'lucide-react';
import { CustomStyle } from './CustomStyleModal';

export type StylePresetKey = 'minimalist' | 'luxury' | 'organic' | 'festival';

interface StylePresetGridProps {
    selectedStyle: StylePresetKey | string | null;
    onSelectStyle: (style: StylePresetKey | string) => void;
    customStyles?: CustomStyle[];
    onAddCustomStyle?: () => void;
    onEditCustomStyle?: (style: CustomStyle) => void;
    onDeleteCustomStyle?: (styleKey: string) => void;
    disabled?: boolean;
}

export const presets = [
    {
        key: 'minimalist' as const,
        name: '極簡白',
        engName: 'Minimalist',
        desc: '乾淨、高冷、Muji風',
        icon: Sparkles,
        color: 'bg-gray-100 text-gray-800',
        borderColor: 'border-gray-200 hover:border-gray-400',
        prompt: 'Place the product on a clean, matte white podium. The background is a soft, abstract geometry with minimal details. Soft, diffused daylight coming from the left window. High-key lighting, airy atmosphere, clean lines. Style reference: Muji, Apple, Kinfolk magazine.'
    },
    {
        key: 'luxury' as const,
        name: '輕奢黑',
        engName: 'Luxury',
        desc: '大理石、高級質感',
        icon: Gem,
        color: 'bg-slate-900 text-slate-100',
        borderColor: 'border-slate-800 hover:border-slate-600',
        prompt: 'Place the product on a polished black marble surface with gold veining. The background is dark and moody with soft bokeh lights. Dramatic studio lighting, rim lighting highlighting the edges of the product. Elegant, expensive, premium look. Style reference: Chanel, high-end cosmetics advertisement.'
    },
    {
        key: 'organic' as const,
        name: '自然風',
        engName: 'Organic',
        desc: '植物、木質、清新',
        icon: Leaf,
        color: 'bg-green-50 text-green-800',
        borderColor: 'border-green-200 hover:border-green-400',
        prompt: 'Place the product on a rustic light oak wooden table. Surround the product with blurred green leaves and natural elements like stones or dried flowers in the background. Dappled sunlight filtering through trees (Gobo light effect). Warm, organic, fresh atmosphere. Style reference: Aesop, lifestyle photography.'
    },
    {
        key: 'festival' as const,
        name: '節慶感',
        engName: 'Festival',
        desc: '聖誕燈飾、歡樂氛圍',
        icon: PartyPopper,
        color: 'bg-red-50 text-red-800',
        borderColor: 'border-red-200 hover:border-red-400',
        prompt: 'Place the product in a festive setting. Background features soft, out-of-focus warm fairy lights and colorful holiday decorations (but not overwhelming). Warm color palette (red, gold, orange). Joyful, inviting, celebration atmosphere. Perfect for a holiday sale poster.'
    }
];

export default function StylePresetGrid({ selectedStyle, onSelectStyle, customStyles = [], onAddCustomStyle, onEditCustomStyle, onDeleteCustomStyle, disabled }: StylePresetGridProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    // Icon mapping for custom styles
    const iconMap: Record<string, any> = {
        Sparkles,
        Gem,
        Leaf,
        PartyPopper,
        Palette,
    };

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
                {customStyles.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`p-1.5 rounded-lg transition-all ${isEditMode
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                            }`}
                        title={isEditMode ? "完成編輯" : "編輯風格"}
                    >
                        <Pencil size={16} />
                    </button>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1 text-center">
                    選擇風格
                </h3>
                {/* Spacer to balance the edit button and center the title */}
                {customStyles.length > 0 && <div className="w-[34px]"></div>}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Default Presets */}
                {presets.map((preset) => (
                    <button
                        type="button"
                        key={preset.key}
                        onClick={() => onSelectStyle(preset.key)}
                        disabled={disabled}
                        className={`
                            relative p-3 rounded-xl border-2 text-left transition-all
                            ${preset.color}
                            ${selectedStyle === preset.key
                                ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#2d2d2d] border-transparent scale-[1.02] shadow-md'
                                : `${preset.borderColor} opacity-80 hover:opacity-100 hover:scale-[1.01]`
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-sm font-bold">{preset.name}</span>
                            <preset.icon size={16} />
                        </div>
                        <p className="text-xs font-medium opacity-80">{preset.engName}</p>
                        <p className="text-[10px] mt-1 opacity-70 leading-tight">
                            {preset.desc}
                        </p>

                        {selectedStyle === preset.key && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white dark:border-gray-800" />
                        )}
                    </button>
                ))}

                {/* Custom Styles */}
                {customStyles.map((customStyle) => {
                    const IconComponent = iconMap[customStyle.icon] || Palette;
                    return (
                        <div key={customStyle.key} className="relative group">
                            <button
                                type="button"
                                onClick={() => !isEditMode && onSelectStyle(customStyle.key)}
                                disabled={disabled}
                                className={`
                                    w-full relative p-3 rounded-xl border-2 text-left transition-all
                                    ${customStyle.color}
                                    ${selectedStyle === customStyle.key
                                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#2d2d2d] border-transparent scale-[1.02] shadow-md'
                                        : `${customStyle.borderColor} opacity-80 hover:opacity-100 hover:scale-[1.01]`
                                    }
                                    ${disabled ? 'opacity-50 cursor-not-allowed' : isEditMode ? 'cursor-default' : 'cursor-pointer'}
                                `}
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <span className="text-sm font-bold">{customStyle.name}</span>
                                    <IconComponent size={16} />
                                </div>
                                <p className="text-xs font-medium opacity-80">{customStyle.engName}</p>
                                <p className="text-[10px] mt-1 opacity-70 leading-tight">
                                    {customStyle.desc}
                                </p>

                                {selectedStyle === customStyle.key && !isEditMode && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white dark:border-gray-800" />
                                )}
                            </button>

                            {/* Edit/Delete buttons - Show only in edit mode on hover */}
                            {isEditMode && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    {onEditCustomStyle && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditCustomStyle(customStyle);
                                            }}
                                            className="p-1.5 bg-blue-500 hover:bg-blue-600 rounded-md shadow-lg transition-all hover:scale-110"
                                            title="編輯風格"
                                        >
                                            <Pencil size={12} className="text-white" />
                                        </button>
                                    )}
                                    {onDeleteCustomStyle && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`確定要刪除「${customStyle.name}」風格嗎？`)) {
                                                    onDeleteCustomStyle(customStyle.key);
                                                }
                                            }}
                                            className="p-1.5 bg-red-500 hover:bg-red-600 rounded-md shadow-lg transition-all hover:scale-110"
                                            title="刪除風格"
                                        >
                                            <Trash2 size={12} className="text-white" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add Custom Style Button */}
                {onAddCustomStyle && (
                    <button
                        type="button"
                        onClick={onAddCustomStyle}
                        // Always allow adding styles
                        className={`
                            relative p-3 rounded-xl border-2 border-dashed text-left transition-all
                            bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400
                            border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500
                            hover:bg-gray-100 dark:hover:bg-gray-800
                            cursor-pointer
                            flex items-center justify-center
                        `}
                    >
                        <div className="flex flex-col items-center justify-center gap-1">
                            <Plus size={24} className="text-gray-500 dark:text-gray-400" />
                            <span className="text-xs font-medium">新增風格</span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
