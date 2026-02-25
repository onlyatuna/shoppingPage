import React from 'react';
import { Brain } from 'lucide-react';

export interface NeuroMeterData {
    status: 'Rational' | 'Emotional' | 'Mixed';
    score: number;
    mechanism: string;
}

interface NeuroMeterProps {
    data: NeuroMeterData;
}

export const NeuroMeter: React.FC<NeuroMeterProps> = ({ data }) => {
    const isRational = data.status === 'Rational';
    const isEmotional = data.status === 'Emotional';

    // 色碼設定
    const statusColor = isRational
        ? 'text-[#81C784]' // 綠色
        : isEmotional
            ? 'text-[#FF8A80]' // 紅色
            : 'text-[#F1C40F]'; // 黃色

    // 計算指針角度
    const clampedScore = Math.max(0, Math.min(100, data.score));
    const rotation = (clampedScore / 100) * 180 - 90;

    const statusText = isRational
        ? '大腦皮質模式 (理性)'
        : isEmotional
            ? '邊緣系統警報 (感性)'
            : '混合狀態';

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col h-full min-h-[220px]">

            {/* 1. Header (固定頂部) */}
            <div className="flex items-center gap-2 mb-4 shrink-0">
                <Brain className="w-5 h-5 text-[#2C3E50]" />
                <h3 className="text-lg font-serif font-bold text-[#2C3E50]">Neuro-Meter</h3>
            </div>

            {/* 2. Visual Zone (佔據剩餘空間，確保儀表板位置穩定) */}
            <div className="flex-1 flex flex-col items-center justify-start pt-2">

                {/* --- Gauge Graphic --- */}
                <div className="relative w-48 h-24 overflow-hidden mb-4 scale-90 sm:scale-100 origin-bottom shrink-0">
                    {/* Background Arc */}
                    <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-gray-100 box-border"></div>

                    {/* Colored Segments */}
                    <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-transparent border-t-[#FF8A80] border-l-[#FF8A80] rotate-[-45deg] opacity-30"></div>
                    <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-transparent border-t-[#81C784] border-r-[#81C784] rotate-[45deg] opacity-30"></div>

                    {/* Needle */}
                    <div
                        className="absolute bottom-0 left-1/2 w-1 h-24 bg-[#2C3E50] origin-bottom transition-transform duration-1000 ease-out z-10"
                        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                    >
                        <div className="w-4 h-4 bg-[#2C3E50] rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-2 border-white shadow-sm"></div>
                    </div>
                </div>

                {/* Text Group */}
                <div className="text-center w-full">
                    {/* 關鍵修復：設定 min-h (如 3.5rem) 以容納兩行文字，防止單行/雙行切換時跳動 */}
                    <div className={`text-xl font-bold ${statusColor} mb-1 min-h-[3.5rem] flex items-center justify-center leading-tight`}>
                        {statusText}
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">系統活躍度 (System Activity)</p>
                </div>
            </div>

            {/* 3. Mechanism Footer (推到底部，不影響上方佈局) */}
            <div className="mt-auto pt-4 w-full">
                <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 leading-relaxed border-l-4 border-[#2C3E50] text-left">
                    <span className="font-semibold block mb-1 text-[#2C3E50]">生理機制：</span>
                    {/* 限制行數 (選用)，避免極端長的文字撐開卡片 */}
                    <div className="line-clamp-3">
                        {data.mechanism}
                    </div>
                </div>
            </div>
        </div>
    );
};