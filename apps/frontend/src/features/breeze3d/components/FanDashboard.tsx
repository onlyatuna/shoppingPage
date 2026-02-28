import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Wind, Leaf, Timer, RotateCw, ArrowLeftRight } from 'lucide-react';

interface FanDashboardProps {
    power: boolean;
    speed: number;
    natureMode: boolean;
    isOscillating: boolean;
    timerMinutes: number | null;
    displayOverride?: string | null;
    onPowerToggle: () => void;
    onSpeedCycle: () => void;
    onNatureToggle: () => void;
    onTimerCycle: () => void;
    onOscillationToggle: () => void;
}

export const FanDashboard: React.FC<FanDashboardProps> = ({
    power,
    speed,
    natureMode,
    isOscillating,
    timerMinutes,
    displayOverride,
    onPowerToggle,
    onSpeedCycle,
    onNatureToggle,
    onTimerCycle,
    onOscillationToggle,
}) => {
    // 顯示內容邏輯
    const mainDisplayText = useMemo(() => {
        if (displayOverride) return displayOverride;
        if (!power) return 'OFF';
        if (natureMode) return 'NAT';
        return speed.toString();
    }, [power, speed, natureMode, displayOverride]);

    // 環狀進度條參數
    const radius = 45; // 進一步縮小以符合 h-24
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="flex flex-col items-center justify-center p-4 sm:p-8 select-none">
            {/* 儀表盤主圓盤 (Dark Mirror Display) */}
            <motion.div
                initial={false}
                animate={{
                    backgroundColor: power ? 'rgba(5, 5, 10, 0.15)' : 'rgba(5, 5, 5, 0.1)',
                    boxShadow: power
                        ? '0 0 30px rgba(59, 130, 246, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.01)'
                        : 'none',
                }}
                className="relative w-auto max-w-3xl h-24 sm:h-28 rounded-full border border-white/5 flex flex-row items-center justify-between px-3 sm:px-4 overflow-hidden backdrop-blur-sm"
            >
                {/* 左側：儀表顯示區 (HUD Row) */}
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <motion.svg
                        initial={false}
                        animate={{ opacity: power ? 1 : 0, scale: power ? 1 : 0.8 }}
                        className="absolute w-full h-full -rotate-90 pointer-events-none"
                        viewBox="0 0 120 120"
                    >
                        {[0, 1, 2, 3].map((i) => {
                            const isActive = power && (natureMode || (speed > i));
                            const startAngle = i * 90;
                            return (
                                <g key={i} transform={`rotate(${startAngle} 60 60)`}>
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r={radius}
                                        fill="none"
                                        stroke="rgba(255, 255, 255, 0.05)"
                                        strokeWidth="3"
                                        strokeDasharray={`${(circumference / 4) - 4} ${circumference}`}
                                    />
                                    <motion.circle
                                        cx="60"
                                        cy="60"
                                        r={radius}
                                        fill="none"
                                        stroke={natureMode ? '#22d3ee' : '#3b82f6'}
                                        strokeWidth="4"
                                        initial={{ opacity: 0 }}
                                        animate={{
                                            opacity: isActive ? 1 : 0,
                                            strokeWidth: isActive ? 4 : 3
                                        }}
                                        transition={{ duration: 0.3 }}
                                        strokeDasharray={`${(circumference / 4) - 4} ${circumference}`}
                                        filter={isActive ? "drop-shadow(0 0 3px rgba(59, 130, 246, 0.4))" : "none"}
                                    />
                                </g>
                            );
                        })}
                    </motion.svg>

                    {/* 中央主顯示區 (Main HUD) */}
                    <div className="flex flex-col items-center justify-center z-10">
                        {/* 自然風狀態文字 */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mainDisplayText}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: power ? 1 : 0.4,
                                    scale: 1,
                                    transition: displayOverride ? {
                                        opacity: { repeat: Infinity, duration: 0.5, repeatType: "reverse" }
                                    } : {}
                                }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                className={`font-digital text-2xl sm:text-3xl tracking-tighter ${!power ? 'text-gray-700' : (natureMode || displayOverride) ? 'text-cyan-400' : 'text-blue-500'
                                    }`}
                                style={{
                                    textShadow: power ? `0 0 20px ${(natureMode || displayOverride) ? 'rgba(34, 211, 238, 0.5)' : 'rgba(59, 130, 246, 0.5)'}` : 'none'
                                }}
                            >
                                {mainDisplayText}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* 附屬說明/狀態圖示 (移至絕對定位以避免推擠中央數字) */}
                    <div className="absolute bottom-4 left-0 w-full flex items-center justify-center gap-2 pointer-events-none">
                        {isOscillating && power && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-blue-400"
                            >
                                <ArrowLeftRight size={12} className="animate-pulse" />
                            </motion.div>
                        )}
                        {timerMinutes !== null && power && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-0.5 font-digital text-[8px] text-amber-500/80 bg-amber-500/5 px-1.5 rounded-full border border-amber-500/10"
                            >
                                <Timer size={8} />
                                <span>{timerMinutes}M</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* 右側區域：按鈕分組佈局 */}
                <div className="flex items-center gap-1 sm:gap-4 ml-4 pr-1 sm:pr-4">
                    {/* 功能組：風速 -> 自然 -> 定時 -> 擺頭 */}
                    <div className="flex items-center gap-1 sm:gap-3">
                        <ControlButton
                            Icon={Wind}
                            active={power && !natureMode}
                            onClick={onSpeedCycle}
                            color="blue"
                            label="風速"
                        />
                        <ControlButton
                            Icon={Leaf}
                            active={power && natureMode}
                            onClick={onNatureToggle}
                            color="cyan"
                            label="自然"
                        />
                        <ControlButton
                            Icon={Timer}
                            active={power && timerMinutes !== null}
                            onClick={onTimerCycle}
                            color="amber"
                            label="定時"
                        />
                        <ControlButton
                            Icon={RotateCw}
                            active={power && isOscillating}
                            onClick={onOscillationToggle}
                            color="emerald"
                            label="擺頭"
                            animated={isOscillating && power}
                        />
                    </div>

                    {/* 分隔線 */}
                    <div className="w-[1px] h-10 bg-white/10 mx-1 sm:mx-2 shrink-0" />

                    {/* 開關組：電源單獨拉開 */}
                    <ControlButton
                        Icon={Power}
                        active={power}
                        onClick={onPowerToggle}
                        color="red"
                        label="電源"
                        large
                    />
                </div>
            </motion.div >
        </div >
    );
};

interface ControlButtonProps {
    Icon: any;
    active: boolean;
    onClick: () => void;
    color: 'red' | 'blue' | 'cyan' | 'amber' | 'emerald';
    label: string;
    animated?: boolean;
    large?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({ Icon, active, onClick, color, label, animated, large }) => {
    const colorMap = {
        red: active ? 'bg-red-500 shadow-red-500/50' : 'bg-white/5 text-white/20',
        blue: active ? 'bg-blue-500 shadow-blue-500/50' : 'bg-white/5 text-white/20',
        cyan: active ? 'bg-cyan-500 shadow-cyan-500/50' : 'bg-white/5 text-white/20',
        amber: active ? 'bg-amber-500 shadow-amber-500/50' : 'bg-white/5 text-white/20',
        emerald: active ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-white/5 text-white/20',
    };

    const iconColor = active ? 'text-white' : 'group-hover:text-white/60';

    return (
        <div className="flex flex-col items-center gap-1 group">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className={`${large ? 'w-14 h-14 sm:w-18 sm:h-18' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center transition-all border border-white/5 ${colorMap[color]} shadow-lg`}
            >
                <Icon size={large ? 24 : 18} className={`${iconColor} ${animated ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </motion.button>
            <span className={`text-[8px] sm:text-[10px] font-medium tracking-tight ${active ? 'text-white' : 'text-white/20'}`}>
                {label}
            </span>
        </div>
    );
};
