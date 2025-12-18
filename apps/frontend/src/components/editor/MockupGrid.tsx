import { UniversalMockup, MOCKUP_TEMPLATES } from '../../types/mockup';

interface MockupGridProps {
    selectedMockup: UniversalMockup | null;
    onSelect: (mockup: UniversalMockup) => void;
    mockups?: UniversalMockup[];
    disabled?: boolean;
}

export default function MockupGrid({
    selectedMockup,
    onSelect,
    mockups = MOCKUP_TEMPLATES,
    disabled
}: MockupGridProps) {
    return (
        <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                選擇場景
            </h3>

            <div className="grid grid-cols-2 gap-3">
                {mockups.map((mockup) => (
                    <button
                        type="button"
                        key={mockup.id}
                        onClick={() => onSelect(mockup)}
                        disabled={disabled}
                        className={`
                            relative rounded-xl border-2 overflow-hidden text-left transition-all
                            ${selectedMockup?.id === mockup.id
                                ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#2d2d2d] border-transparent scale-[1.02] shadow-md'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 opacity-80 hover:opacity-100 hover:scale-[1.01]'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {/* Mockup 缩图 */}
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                            <img
                                src={mockup.thumbnail}
                                alt={mockup.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>

                        {/* Mockup 名称 */}
                        <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">
                                {mockup.name}
                            </span>
                            {mockup.category && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {mockup.category}
                                </span>
                            )}
                        </div>

                        {/* 选中指示器 */}
                        {selectedMockup?.id === mockup.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* 提示文案 */}
            {mockups.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">暫無可用場景</p>
                </div>
            )}
        </div>
    );
}
