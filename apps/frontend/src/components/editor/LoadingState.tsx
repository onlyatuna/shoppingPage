import { ComponentProps } from 'react';
import { motion } from 'framer-motion';

interface LoadingStateProps extends ComponentProps<'div'> {
    message?: string;
}

export default function LoadingState({ message = "AI 設計師正在構圖中..." }: LoadingStateProps) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-30 rounded-xl overflow-hidden">
            <div className="relative w-full max-w-md p-8">
                {/* 掃光動畫 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent skew-x-12 translate-x-[-150%] animate-shimmer" />

                <div className="flex flex-col items-center gap-4">
                    {/* 旋轉的 AI 核心 */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[2px]"
                    >
                        <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-600/20 shadow-inner" />
                        </div>
                    </motion.div>

                    {/* 文字動畫 */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-center"
                    >
                        {message}
                    </motion.p>

                    <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                        這可能需要 15-20 秒，請稍候...
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-150%) skewX(-12deg); }
                    100% { transform: translateX(150%) skewX(-12deg); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}
