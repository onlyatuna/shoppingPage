import { ChevronRight, Check } from 'lucide-react';
import clsx from 'clsx';

interface CheckoutProgressProps {
    step: 1 | 2 | 3;
}

export default function CheckoutProgress({ step }: CheckoutProgressProps) {
    const steps = [
        { num: 1, label: '購物車' },
        { num: 2, label: '填寫資料' },
        { num: 3, label: '訂單確認' },
    ];

    return (
        <div className="flex items-center justify-center gap-4 mb-8">
            {steps.map((s, index) => {
                const isActive = s.num === step;
                const isCompleted = s.num < step;

                return (
                    <div key={s.num} className="flex items-center gap-2">
                        {/* Circle */}
                        <div
                            className={clsx(
                                "flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm transition-colors",
                                isCompleted ? "bg-black border-black text-white" :
                                    isActive ? "bg-black border-black text-white" :
                                        "bg-transparent border-gray-300 text-gray-400"
                            )}
                        >
                            {isCompleted ? <Check size={16} /> : s.num}
                        </div>

                        {/* Label */}
                        <span
                            className={clsx(
                                "font-medium text-sm md:text-base",
                                isActive || isCompleted ? "text-black" : "text-gray-400"
                            )}
                        >
                            {s.label}
                        </span>

                        {/* Connector (if not last) */}
                        {index < steps.length - 1 && (
                            <div className="mx-2 md:mx-4 text-gray-300">
                                <ChevronRight size={20} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
