import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileWizardNavProps {
    step: 'edit' | 'caption' | 'publish';
    onNext: () => void;
    onBack?: () => void;
    canGoNext: boolean;
    nextLabel?: string;
    isProcessing?: boolean;
}

export default function MobileWizardNav({
    step,
    onNext,
    onBack,
    canGoNext,
    nextLabel,
    isProcessing
}: MobileWizardNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-700 p-4 tablet-portrait:p-6 pb-safe z-40 landscape:hidden flex items-center justify-between gap-4 shadow-lg-up">
            <style>{`.shadow-lg-up { box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1); }`}</style>

            {onBack ? (
                <button
                    type="button"
                    onClick={onBack}
                    className="p-3 tablet-portrait:p-4 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <ChevronLeft size={24} className="tablet-portrait:w-7 tablet-portrait:h-7" />
                </button>
            ) : (
                <div className="w-12" /> // Spacer
            )}

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 tablet-portrait:w-3 tablet-portrait:h-3 rounded-full ${step === 'edit' ? 'bg-blue-600 scale-125' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <div className={`w-2 h-2 tablet-portrait:w-3 tablet-portrait:h-3 rounded-full ${step === 'caption' ? 'bg-blue-600 scale-125' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <div className={`w-2 h-2 tablet-portrait:w-3 tablet-portrait:h-3 rounded-full ${step === 'publish' ? 'bg-blue-600 scale-125' : 'bg-gray-300 dark:bg-gray-600'}`} />
            </div>

            <button
                type="button"
                onClick={onNext}
                disabled={!canGoNext || isProcessing}
                aria-label={step === 'edit' ? '下一步：文案' : step === 'caption' ? '下一步：發佈' : '完成'}
                className={`
                    p-3 tablet-portrait:p-4 rounded-full transition-colors
                    ${canGoNext && !isProcessing
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }
                `}
            >
                {isProcessing ? (
                    <div className="w-6 h-6 tablet-portrait:w-7 tablet-portrait:h-7 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : step !== 'publish' ? (
                    <ChevronRight size={24} className="tablet-portrait:w-7 tablet-portrait:h-7" />
                ) : null}
            </button>
        </div>
    );
}
