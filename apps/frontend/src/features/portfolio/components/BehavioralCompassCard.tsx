import React, { useState } from 'react';
import {
    Brain, Play, RefreshCw, User,
    MessageSquare, AlertTriangle,
    Sparkles, Lightbulb,
    ChevronLeft, ChevronRight, ChevronDown, Compass
} from 'lucide-react';
import { analyzeScenario, AnalysisResult } from '@/api/geminiService';

import { NeuroMeter } from '@/features/portfolio/components/behavioral/NeuroMeter';
import { BiasScanner } from '@/features/portfolio/components/behavioral/BiasScanner';
import { ActionPlan } from '@/features/portfolio/components/behavioral/ActionPlan';
import { ReframingScript } from '@/features/portfolio/components/behavioral/ReframingScript';

interface BehavioralCompassCardProps {
    isLiveMode: boolean;
    apiKey?: string;
    className?: string;
}

// === 🤖 可用模型清單 ===
const AVAILABLE_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Paid Tier Only)' },
];

// === 💀 骨架屏組件 (Skeleton) ===
const SkeletonDashboard = () => (
    <div className="col-span-1 lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 animate-pulse">
        {/* Column 2: AI Analysis Skeleton */}
        <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-200"></div>
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] gap-4">
                <div className="w-48 h-24 bg-slate-200 rounded-t-full opacity-50"></div>
                <div className="h-6 w-32 bg-slate-200 rounded"></div>
                <div className="h-20 w-full bg-slate-100 rounded-xl mt-2"></div>
            </div>
            <div className="h-px bg-slate-100 w-full"></div>
            <div className="flex flex-col gap-3">
                <div className="h-12 w-full bg-slate-100 rounded-lg"></div>
                <div className="h-12 w-full bg-slate-100 rounded-lg"></div>
            </div>
        </div>
        {/* Column 3: Advisor Copilot Skeleton */}
        <div className="p-6 bg-slate-50/50 flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-200"></div>
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
            </div>
            <div className="flex-1 flex flex-col gap-3">
                <div className="h-32 w-full bg-slate-200 rounded-xl"></div>
                <div className="h-24 w-full bg-slate-200 rounded-xl opacity-50"></div>
            </div>
            <div className="flex-1 flex flex-col gap-3 mt-4">
                <div className="h-6 w-1/2 bg-slate-200 rounded"></div>
                <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
                <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
                <div className="h-10 w-full bg-slate-200 rounded-lg"></div>
            </div>
        </div>
    </div>
);

// === 🚀 準備導航畫面 (Ready State) ===
const ReadyState = () => (
    <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center p-12 bg-slate-50/30 text-center h-full min-h-[400px]">
        <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20 duration-1000"></div>
            <div className="p-6 bg-white rounded-full shadow-lg border border-slate-100 relative z-10">
                <Compass size={48} className="text-blue-600" strokeWidth={1.5} />
            </div>
            {/* 裝飾性粒子 */}
            <div className="absolute -top-2 -right-2 text-yellow-400 animate-bounce delay-100"><Sparkles size={16} fill="currentColor" /></div>
        </div>

        <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">準備導航</h3>
        <p className="text-slate-500 max-w-sm leading-relaxed">
            請在左側輸入客戶情境，或選擇快速範例，<br />啟動 <span className="font-semibold text-blue-600">行為財務診斷引擎</span>。
        </p>

        <div className="mt-8 flex gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
        </div>
    </div>
);

// === 🎭 多重 Mock Data (對應 Persona) ===
const MOCK_RESULTS_BY_PERSONA: AnalysisResult[] = [
    // 1. 王先生 (退休/恐慌)
    {
        neuroMeter: {
            status: 'Emotional',
            score: 25,
            mechanism: '杏仁核 (Amygdala) 劫持前額葉，引發典型的戰或逃反應，導致對損失的過度敏感。'
        },
        biases: [
            { name: 'Loss Aversion (損失厭惡)', severity: 'High', pageRef: 'Page 12' },
            { name: 'Myopic Loss Aversion (短視損失厭惡)', severity: 'Medium', pageRef: 'Page 24' }
        ],
        actionPlan: {
            advisorMindset: '同理但不認同 (Validate but don\'t Validate) - 先安撫恐慌，再導入數據。',
            actions: ['暫停客戶的贖回請求，避免實現永久損失', '展示 10 年期市場回測數據圖表', '區分「未實現損益」與「實際損失」']
        },
        reframing: {
            traditional: '別擔心，市場長期是看漲的，現在賣很不划算。',
            behavioral: '我完全理解這種焦慮感。但如果現在賣出，等於是我們主動把「暫時的波動」變成了「永久的損失」，這正是我們最想避免的...',
            principle: '利用認知重構 (Cognitive Reframing)'
        }
    },

    // 2. 陳小姐 (年輕/FOMO)
    {
        neuroMeter: {
            status: 'Emotional',
            score: 35,
            mechanism: '多巴胺 (Dopamine) 迴路過度活躍，強化了對潛在獎勵的預期，抑制了風險評估能力。'
        },
        biases: [
            { name: 'Herding (羊群效應)', severity: 'High', pageRef: 'Page 15' },
            { name: 'Overconfidence (過度自信)', severity: 'Medium', pageRef: 'Page 9' }
        ],
        actionPlan: {
            advisorMindset: '設置減速帶 (Create Speed Bumps) - 增加交易摩擦力，延緩衝動決策。',
            actions: ['要求填寫「投資策略偏離聲明書」', '展示單一產業集中投資的歷史波動率', '建立「核心-衛星」配置，限制投機比例']
        },
        reframing: {
            traditional: '這個風險太高了，妳不應該把雞蛋放在同一個籃子裡。',
            behavioral: '這波漲勢確實誘人。為了保護既有獲利，我們不如先用 10% 的資金參與，保留 90% 的安全氣囊？這樣既能參與行情，又不會翻車。',
            principle: '利用心理帳戶 (Mental Accounting)'
        }
    },

    // 3. 李醫師 (高資產/惜售)
    {
        neuroMeter: {
            status: 'Mixed',
            score: 55,
            mechanism: '腦島 (Insula) 的疼痛中樞在面對「實現虧損」時被活化，導致迴避行為。'
        },
        biases: [
            { name: 'Disposition Effect (處置效應)', severity: 'High', pageRef: 'Page 13' },
            { name: 'Sunk Cost Fallacy (沈沒成本謬誤)', severity: 'Medium', pageRef: 'Page 11' }
        ],
        actionPlan: {
            advisorMindset: '重新定義輸贏 (Redefine Winning) - 將停損轉化為「資產優化」的機會。',
            actions: ['計算換股後的潛在稅務優勢 (Tax Loss Harvesting)', '將焦點從「過去的買入價」轉移到「未來的機會成本」', '設定自動化的汰弱留強機制']
        },
        reframing: {
            traditional: '這檔股票基本面已經壞了，一定要現在停損。',
            behavioral: '我們現在不是在「認賠」，而是在「換取更好的機會」。這筆資金如果繼續卡在這裡，就像是把優秀的球員放在板凳上，我們應該讓他上場得分...',
            principle: '利用機會成本 (Opportunity Cost Framing)'
        }
    }
];

// === 👥 多重客戶角色資料 (Personas) ===
const PERSONAS = [
    {
        id: 1,
        name: '王先生 (Retiree)',
        tags: '55歲 / 退休規劃 / 保守型',
        avatarColor: 'bg-slate-100 text-slate-400',
        defaultScenario: '客戶看到昨晚美股大跌，加上 CPI 數據不佳，覺得非常恐慌，想要解約全部的退休金信託...'
    },
    {
        id: 2,
        name: '陳小姐 (Young Pro)',
        tags: '28歲 / 資產累積 / 積極型',
        avatarColor: 'bg-blue-50 text-blue-500',
        defaultScenario: '看到最近 AI 概念股大漲，覺得隔壁同事都賺翻了，想要解定存 All-in 買進科技股...'
    },
    {
        id: 3,
        name: '李醫師 (HNW)',
        tags: '45歲 / 稅務規劃 / 穩健型',
        avatarColor: 'bg-purple-50 text-purple-500',
        defaultScenario: '手上的傳產股虧損 30% 了，但我建議停損換股，他卻堅持要等到回本才肯賣，說不賣就不算賠...'
    }
];

// === 📝 快速情境資料 (Quick Scenarios - 中文版) ===
const QUICK_SCENARIOS = [
    {
        id: 'panic',
        label: '📉 恐慌拋售',
        text: '客戶看到昨晚美股大跌，加上 CPI 數據不佳，覺得非常恐慌，想要把帳戶裡的科技股基金全部贖回，轉持有現金...'
    },
    {
        id: 'fomo',
        label: '🚀 追高 (FOMO)',
        text: '客戶看到最近 AI 概念股大漲，覺得隔壁鄰居都賺翻了，想要把原本規劃好的保守型債券基金全部賣掉，All-in 去買科技股...'
    },
    {
        id: 'loss',
        label: '🏚️ 惜售心態',
        text: '客戶手上的傳產股已經虧損 30% 了，但我建議他停損換股，他卻堅持要等到回本才肯賣，說現在賣就是真的賠了...'
    }
];

const BehavioralCompassCard: React.FC<BehavioralCompassCardProps> = ({ isLiveMode, apiKey, className }) => {
    const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
    const [input, setInput] = useState(PERSONAS[0].defaultScenario);

    // ✅ 模型選擇 State
    const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);

    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorType, setErrorType] = useState<string | null>(null);

    // 切換 Persona
    const handlePersonaChange = (direction: 'prev' | 'next') => {
        let newIndex = direction === 'next' ? currentPersonaIndex + 1 : currentPersonaIndex - 1;
        if (newIndex >= PERSONAS.length) newIndex = 0;
        if (newIndex < 0) newIndex = PERSONAS.length - 1;

        setCurrentPersonaIndex(newIndex);
        setInput(PERSONAS[newIndex].defaultScenario);

        if (isLiveMode) {
            setResult(null);
        }
    };

    const currentPersona = PERSONAS[currentPersonaIndex];

    const handleAnalyze = async () => {
        if (!isLiveMode || !apiKey) return;
        if (!input.trim()) return;

        setLoading(true);
        setErrorType(null);

        try {
            const data = await analyzeScenario(input, apiKey, selectedModel);
            setResult(data);
        } catch (err: any) {
            console.error(err);
            if (err.message === "QUOTA_EXCEEDED") {
                setErrorType("QUOTA");
            } else if (err.message === "MODEL_NOT_FOUND") {
                setErrorType("MODEL");
            } else {
                setErrorType("OTHER");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleScenarioClick = (text: string) => {
        if (!isLiveMode) return;
        setInput(text);
    };

    // ✅ 渲染邏輯重構
    // 1. 如果是 Loading -> 顯示骨架屏
    // 2. 如果是 Error -> 顯示錯誤
    // 3. 如果是 Live Mode 且沒有 Result -> 顯示 ReadyState
    // 4. 其他 (Mock Mode 或有 Result) -> 顯示資料

    let content = null;

    if (loading) {
        content = <SkeletonDashboard />;
    } else if (errorType) {
        content = (
            <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center p-12 bg-red-50/50 text-center">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <AlertTriangle size={40} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">分析失敗 (Analysis Failed)</h3>

                {errorType === 'QUOTA' && (
                    <div className="max-w-md">
                        <p className="text-red-600 font-medium mb-1">API 額度已滿 (Quota Exceeded)</p>
                        <p className="text-slate-500 text-sm">Gemini 的免費額度已用完。請稍候再試，或更換 API Key。</p>
                    </div>
                )}

                {errorType === 'MODEL' && (
                    <div className="max-w-md">
                        <p className="text-red-600 font-medium mb-1">找不到模型 (Model Not Found)</p>
                        <p className="text-slate-500 text-sm">`{selectedModel}` 可能尚未對您的帳號開放。請嘗試切換其他模型。</p>
                    </div>
                )}

                {errorType === 'OTHER' && (
                    <p className="text-slate-500 text-sm">請檢查您的 API Key 是否正確，或網路連線是否正常。</p>
                )}

                <button
                    onClick={() => setErrorType(null)}
                    className="mt-6 px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    關閉
                </button>
            </div>
        );
    } else if (isLiveMode && !result) {
        // ✅ 3. 準備導航狀態
        content = <ReadyState />;
    } else {
        // ✅ 4. 顯示資料 (Live Result 或 Mock Data)
        const displayData = isLiveMode ? result! : MOCK_RESULTS_BY_PERSONA[currentPersonaIndex];
        content = (
            <>
                {/* --- Column 2: AI ANALYSIS --- */}
                <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-widest">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">2</span>
                        AI 智能診斷 (Analysis)
                    </div>
                    <div className="flex-1 min-h-[240px]">
                        <NeuroMeter data={displayData.neuroMeter} />
                    </div>
                    <div className="h-px bg-slate-100 w-full"></div>
                    <div className="flex-1">
                        <BiasScanner biases={displayData.biases} />
                    </div>
                </div>

                {/* --- Column 3: ADVISOR COPILOT --- */}
                <div className="p-6 bg-slate-50/50 flex flex-col gap-6 animate-in fade-in duration-500 delay-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px]">3</span>
                        顧問導航 (Advisor Copilot)
                    </div>
                    <div className="flex-1">
                        <ReframingScript script={displayData.reframing} />
                    </div>
                    <div className="flex-1">
                        <ActionPlan plan={displayData.actionPlan} />
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className={`bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden w-full flex flex-col ${className}`}>

            {/* === Header === */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/30">
                        <Brain size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">行為決策導航儀</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded">#RAG</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isLiveMode ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-bold animate-pulse">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            連線中 (Live)
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200 text-xs font-bold">
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            預覽模式 (Mock)
                        </div>
                    )}

                    {isLiveMode && (
                        <div className="relative group">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="appearance-none bg-white border border-slate-200 text-slate-700 text-[10px] font-bold py-1.5 pl-3 pr-7 rounded-full cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px] truncate transition-all shadow-sm"
                            >
                                {AVAILABLE_MODELS.map(model => (
                                    <option key={model.id} value={model.id}>{model.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* === Main Content === */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                {/* --- Column 1: CLIENT CONTEXT (Input) --- */}
                <div className="p-6 bg-slate-50/50 flex flex-col gap-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">1</span>
                        客戶情境 (Client Context)
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 relative group">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${currentPersona.avatarColor}`}>
                            <User size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-bold text-slate-800 flex items-center justify-between">
                                {currentPersona.name}
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{currentPersonaIndex + 1}/{PERSONAS.length}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{currentPersona.tags}</div>
                        </div>

                        <button
                            onClick={() => handlePersonaChange('prev')}
                            className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-white border border-slate-200 rounded-full shadow-md text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-3 group-hover:translate-x-0 cursor-pointer z-10"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => handlePersonaChange('next')}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-white border border-slate-200 rounded-full shadow-md text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all translate-x-3 group-hover:translate-x-0 cursor-pointer z-10"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col relative">
                        <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                            <MessageSquare size={12} /> 即時情境輸入
                        </label>
                        <div className="flex-1 relative group">
                            <textarea
                                className="w-full h-full min-h-[160px] resize-none rounded-xl border-slate-200 bg-white p-4 text-sm leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                                placeholder={isLiveMode ? "請輸入客戶的對話或情境描述，或點擊下方快速提示..." : "預覽模式：僅供展示，無法輸入"}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={!isLiveMode || loading}
                            />
                            {isLiveMode && (
                                <button
                                    onClick={() => handleAnalyze()}
                                    disabled={loading || !input.trim()}
                                    className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                >
                                    {loading ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
                                    {loading ? "分析中..." : "開始分析"}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb size={12} className="text-amber-500" />
                            <span className="text-xs font-bold text-slate-400">快速情境範例 (Quick Scenarios)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_SCENARIOS.map((scenario) => (
                                <button
                                    key={scenario.id}
                                    onClick={() => handleScenarioClick(scenario.text)}
                                    disabled={!isLiveMode || loading}
                                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[11px] font-bold rounded-lg transition-all shadow-sm text-left disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                    title={scenario.text}
                                >
                                    {scenario.label}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* --- Content Area (Ready / Loading / Error / Data) --- */}
                {content}

            </div>
        </div>
    );
};

export default BehavioralCompassCard;