import React, { useState, useCallback } from 'react';
import { DEFAULT_INPUTS } from '../utils/constants';
import { UserInputs, SimulationResult, AdvisorResponse } from '../types';
import { InputForm } from '../components/InputForm';
import { ResultsDashboard } from '../components/ResultsDashboard';
import { calculatePensionGap } from '../services/calculationService';
import { generateActionableAdvice } from '../services/geminiService';
import {
    Calculator, ArrowLeft, RefreshCw,
    Key, Lock, Unlock, CheckCircle2
} from 'lucide-react';

const PensionPage: React.FC = () => {
    const [inputs, setInputs] = useState<UserInputs>(DEFAULT_INPUTS);
    const [results, setResults] = useState<SimulationResult | null>(null);
    const [advisorData, setAdvisorData] = useState<AdvisorResponse | null>(null);

    // 狀態管理：API Key 與 UI 控制
    const [apiKey, setApiKey] = useState("");
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);

    const [isCalculating, setIsCalculating] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

    // 處理 API Key 輸入
    const handleKeySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim().length > 10) {
            setIsLiveMode(true);
            setShowKeyInput(false);
        }
    };

    const handleDisconnect = () => {
        setApiKey("");
        setIsLiveMode(false);
        setAdvisorData(null); // 清除之前的即時建議
    };

    const handleInputChange = useCallback(<K extends keyof UserInputs>(name: K, value: UserInputs[K]) => {
        setInputs(prev => ({ ...prev, [name]: value }));
    }, []);

    const runSimulation = async (data: UserInputs) => {
        setIsCalculating(true);
        setResults(null);
        setAdvisorData(null);

        // 模擬計算延遲
        setTimeout(async () => {
            try {
                // 1. 執行數學運算 (Client-side, 永遠是 Live 的)
                const calculatedResults = calculatePensionGap(data);
                setResults(calculatedResults);
                setIsCalculating(false);

                // 2. 執行 AI 顧問 (根據是否有 Key 決定是 Mock 還是 Real)
                setIsThinking(true);
                try {
                    // 將 apiKey 傳入 Service，Service 會自行判斷
                    const advice = await generateActionableAdvice(data, calculatedResults, isLiveMode ? apiKey : undefined);
                    setAdvisorData(advice);
                } catch (e) {
                    console.error("AI advice failed", e);
                } finally {
                    setIsThinking(false);
                }
            } catch (error) {
                console.error("Calculation error:", error);
                setIsCalculating(false);
            }
        }, 800);
    };

    const handleCalculate = () => {
        runSimulation(inputs);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-12">

            {/* --- Header with API Key Control --- */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-sm bg-white/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                    {/* Left: Title & Back */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.close()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-100 p-2 rounded-lg">
                                <Calculator className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-800 hidden md:block">退休金缺口試算器</h1>
                            {/* 模式標籤 */}
                            {isLiveMode ? (
                                <span className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-indigo-200">
                                    <Unlock size={10} /> AI Live Mode
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-gray-200">
                                    <Lock size={10} /> Demo Data
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions & Key Input */}
                    <div className="flex items-center gap-3">

                        {/* API Key Input Area */}
                        <div className="hidden md:flex items-center mr-2">
                            {showKeyInput ? (
                                <form onSubmit={handleKeySubmit} className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                                    <input
                                        type="text"
                                        name="_st_token"
                                        id="_st_token"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="Enter Gemini API Key..."
                                        autoComplete="off"
                                        className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 w-48 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        style={{ WebkitTextSecurity: 'disc' } as any}
                                        autoFocus
                                    />
                                    <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                        <CheckCircle2 size={14} />
                                    </button>
                                </form>
                            ) : (
                                <>
                                    {isLiveMode ? (
                                        <button
                                            onClick={handleDisconnect}
                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            Connected
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowKeyInput(true)}
                                            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors border border-gray-200"
                                        >
                                            <Key size={12} />
                                            Connect AI
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleCalculate}
                            disabled={isCalculating}
                            className={`
                    flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all shadow-md 
                    disabled:opacity-70 disabled:cursor-not-allowed
                    ${isLiveMode
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                }
                `}
                        >
                            {isCalculating ? <RefreshCw className="animate-spin w-4 h-4" /> : <Calculator className="w-4 h-4" />}
                            {isCalculating ? '計算中...' : '開始試算'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Inputs */}
                <div className="lg:col-span-4 space-y-6">
                    <InputForm inputs={inputs} onChange={handleInputChange} />
                </div>

                {/* Right: Results */}
                <div className="lg:col-span-8">
                    {results ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <ResultsDashboard
                                results={results}
                                advisorData={advisorData}
                                isLoadingAdvice={isThinking}
                            />
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border-2 border-dashed border-gray-200 text-gray-400 select-none">
                            <div className="bg-gray-50 p-6 rounded-full mb-4">
                                <Calculator className="w-12 h-12 text-gray-300" />
                            </div>
                            <p className="text-lg font-medium text-gray-500">準備好開始規劃退休生活了嗎？</p>
                            <p className="text-sm mt-2 text-gray-400">
                                {isLiveMode ? "AI 連線中：將為您生成即時客製化建議" : "演示模式：點擊試算查看範例數據"}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PensionPage;