// src/features/diagnosis/pages/DiagnosisPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Components
import { LandingPage } from '@/features/diagnosis/components/LandingPage';
import { QuizPage, DiagnosisResult } from '@/features/diagnosis/components/QuizPage';
import { ResultPage } from '@/features/diagnosis/components/ResultPage';

export const DiagnosisPage = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'landing' | 'quiz' | 'result'>('landing');
    const [result, setResult] = useState<DiagnosisResult | null>(null);

    // --- Actions ---

    const handleStart = () => {
        setView('quiz');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleComplete = (data: DiagnosisResult) => {
        setResult(data);
        setView('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRetake = () => {
        setResult(null);
        setView('quiz'); // 或者 setView('landing') 視你的 UX 偏好而定
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleExit = () => {
        navigate('/');
    };

    // Google Fonts Injection
    useEffect(() => {
        if (!document.querySelector('link[href*="Material+Symbols+Outlined"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
            document.head.appendChild(link);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#111417] overflow-x-hidden">
            <AnimatePresence mode='wait'>

                {view === 'landing' && (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* 這裡只剩下 onStart */}
                        <LandingPage onStart={handleStart} />
                    </motion.div>
                )}

                {view === 'quiz' && (
                    <motion.div
                        key="quiz"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <QuizPage
                            onComplete={handleComplete}
                            onExit={handleExit}
                        />
                    </motion.div>
                )}

                {view === 'result' && result && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <ResultPage
                            result={result}
                            onRetake={handleRetake}
                        // 這裡確認也沒有 onGoToAdvisor
                        />
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};

export default DiagnosisPage;