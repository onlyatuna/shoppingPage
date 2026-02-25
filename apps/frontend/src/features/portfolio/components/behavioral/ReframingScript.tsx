import React from 'react';
import { MessageSquare, XCircle, CheckCircle2, Sparkles, Quote } from 'lucide-react';

// 定義資料介面
export interface ReframingScriptData {
    traditional: string;
    behavioral: string;
    principle: string;
}

interface ReframingScriptProps {
    script: ReframingScriptData;
}

export const ReframingScript: React.FC<ReframingScriptProps> = ({ script }) => {
    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-800">Reframing Script</h3>
                </div>
                <div className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    AI Generated
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Behavioral (Good) - 放在上面強調 */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-wide">
                        <CheckCircle2 className="w-4 h-4" />
                        Behavioral Nudge (Recommended)
                    </div>
                    <div className="relative p-5 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-xl border border-blue-200 shadow-sm">
                        <Quote className="absolute top-4 left-4 text-blue-200 w-8 h-8 -z-0 opacity-50" />
                        <p className="text-gray-800 font-medium leading-relaxed relative z-10 text-[15px]">
                            "{script.behavioral}"
                        </p>
                    </div>
                </div>

                {/* Traditional (Bad) */}
                <div className="space-y-2 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wide">
                        <XCircle className="w-4 h-4" />
                        Traditional Logic (Ineffective)
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-gray-500 italic leading-relaxed text-sm">
                        "{script.traditional}"
                    </div>
                </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-start gap-2">
                <span className="font-bold text-blue-600 whitespace-nowrap">💡 Principle:</span>
                <span>{script.principle}</span>
            </div>
        </div>
    );
};