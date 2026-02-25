// src/features/portfolio/components/behavioral/BiasScanner.tsx
import React from 'react';
import { Tag, AlertTriangle, BookOpen, CheckCircle2 } from 'lucide-react';

export interface Bias {
    name: string;
    severity: 'High' | 'Medium' | 'Low';
    pageRef: string;
}

interface BiasScannerProps {
    biases: Bias[];
}

export const BiasScanner: React.FC<BiasScannerProps> = ({ biases }) => {
    const getSeverityLabel = (severity: string) => {
        switch (severity) {
            case 'High': return '高度影響 (High)';
            case 'Medium': return '中度影響 (Medium)';
            case 'Low': return '輕微影響 (Low)';
            default: return severity;
        }
    };

    return (
        // 修改 1: 移除 h-full, 加上 min-h, 改為 w-full
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 w-full flex flex-col min-h-[180px]">
            <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-gray-800">Bias Scanner</h3>
            </div>

            {/* 修改 2: 移除 flex-1 overflow-y-auto, 讓內容自然撐開 */}
            <div className="space-y-2 w-full">
                {biases.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-gray-400 italic text-xs gap-2">
                        <CheckCircle2 size={20} className="text-green-500 opacity-50" />
                        <p>No significant biases detected.</p>
                    </div>
                ) : (
                    biases.map((bias, index) => (
                        <div key={index} className="flex flex-col xl:flex-row xl:items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${bias.severity === 'High' ? 'text-red-500' : bias.severity === 'Medium' ? 'text-amber-500' : 'text-blue-400'
                                    }`} />
                                <div>
                                    <h4 className="font-bold text-gray-800 text-xs leading-tight">{bias.name}</h4>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${bias.severity === 'High'
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : bias.severity === 'Medium'
                                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                            {getSeverityLabel(bias.severity)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ref Tag 縮小 */}
                            <div className="mt-2 xl:mt-0 flex items-center gap-1 text-[9px] text-gray-400 font-medium bg-white px-1.5 py-0.5 rounded border border-gray-100 w-fit">
                                <BookOpen className="w-3 h-3" />
                                <span>{bias.pageRef}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};