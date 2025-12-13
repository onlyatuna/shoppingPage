import { Sparkles, Gem, Leaf, PartyPopper } from 'lucide-react';

export type StylePresetKey = 'minimalist' | 'luxury' | 'organic' | 'festival';

interface StylePresetGridProps {
    selectedStyle: StylePresetKey | null;
    onSelectStyle: (style: StylePresetKey) => void;
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

export default function StylePresetGrid({ selectedStyle, onSelectStyle, disabled }: StylePresetGridProps) {
    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                2. 選擇風格
            </h3>

            <div className="grid grid-cols-2 gap-3">
                {presets.map((preset) => (
                    <button
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
            </div>
        </div>
    );
}
