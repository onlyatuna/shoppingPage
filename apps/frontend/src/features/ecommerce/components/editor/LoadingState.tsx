import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
    '正在佈置攝影棚...',
    '正在調整柔光箱...',
    '正在設定相機參數...',
    '正在調整背景布幕...',
    '正在安排燈光角度...',
    '正在微調色溫...',
    '正在優化構圖...',
    '正在渲染畫面...',
];

export default function LoadingState() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 3000); // Change message every 3 seconds (slower)

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center z-30">
            {/* Shimmer Background Effect */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="shimmer-gradient" />
            </div>

            {/* Main Loading Content */}
            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Animated Spinner */}
                <div className="relative">
                    {/* Outer Ring */}
                    <motion.div
                        className="w-24 h-24 rounded-full border-4 border-blue-500/30"
                        animate={{
                            rotate: 360,
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                            scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
                        }}
                    />

                    {/* Inner Ring */}
                    <motion.div
                        className="absolute inset-0 w-24 h-24 rounded-full border-t-4 border-blue-500"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* Center Dot */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                    </motion.div>
                </div>

                {/* Dynamic Message */}
                <div className="h-8 flex items-center justify-center">
                    <motion.p
                        key={messageIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="text-lg font-medium text-white text-center px-4"
                    >
                        {LOADING_MESSAGES[messageIndex]}
                    </motion.p>
                </div>

                {/* Progress Dots */}
                <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-blue-400"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Shimmer CSS */}
            <style>{`
                .shimmer-gradient {
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(59, 130, 246, 0.1) 50%,
                        transparent 100%
                    );
                    animation: shimmer 3s infinite;
                }

                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%) translateY(-100%) rotate(45deg);
                    }
                    100% {
                        transform: translateX(100%) translateY(100%) rotate(45deg);
                    }
                }
            `}</style>
        </div>
    );
}
