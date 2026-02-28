import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowDown, ArrowRight,
    User, Activity,
    Sparkles, BrainCircuit, Landmark, Calculator, TrendingDown,
    ChevronLeft
} from 'lucide-react';

import TrustVaultModal from '@/features/portfolio/components/TrustVaultModal';
import BehavioralCompassCard from '@/features/portfolio/components/BehavioralCompassCard';
import { useAIConfig } from '@/contexts/AIConfigContext';

export default function BehavioralPage() {
    const navigate = useNavigate();
    const { apiKey, setApiKey } = useAIConfig();

    // Derive live mode from global context
    const isLiveMode = apiKey.trim().length > 10;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleLiveModeToggle = () => {
        if (!isLiveMode) {
            setIsModalOpen(true);
        } else {
            // Disconnect global key
            setApiKey("");
        }
    };

    const handleVerifyKey = () => {
        console.log("Key verified on Behavioral page");
    };

    return (
        <div className="min-h-screen bg-[#f6f6f8] text-[#111418] font-sans selection:bg-blue-100 selection:text-blue-900 pb-24">
            <TrustVaultModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onVerify={handleVerifyKey}
            />

            {/* Simple Navbar for Lab pages */}
            <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[#e2e8f0] bg-white/90 px-6 py-4 backdrop-blur-md lg:px-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                    <ChevronLeft size={18} />
                    Back to Portfolio
                </button>
            </nav>

            <main className="flex flex-1 flex-col items-center mt-12">
                <div className="w-full max-w-7xl px-4 lg:px-8 flex flex-col gap-12">

                    {/* Header */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold text-[#111418] tracking-tight">Behavioral & FinTech Lab</h1>
                                <div className="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
                                    <button onClick={() => setApiKey("")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!isLiveMode ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Mock Mode</button>
                                    <button onClick={handleLiveModeToggle} className={`group px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${isLiveMode ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100' : 'text-gray-500 hover:text-blue-600'}`}>
                                        <span className="relative flex h-2 w-2">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 ${!isLiveMode && 'hidden'}`}></span>
                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveMode ? 'bg-blue-500' : 'bg-gray-400 group-hover:bg-blue-500'}`}></span>
                                        </span>
                                        Live Gemini
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="text-slate-600 max-w-3xl text-lg">
                            Experimental components exploring the intersection of behavioral finance, AI-driven insights, and interactive data visualization.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* 1. Behavioral Compass (Full Width Hero Card) */}
                        <BehavioralCompassCard isLiveMode={isLiveMode} apiKey={apiKey} className="min-h-[600px]" />

                        {/* 2. Secondary Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                            {/* [Card 1] Investor Persona */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:border-blue-200 transition-colors group relative overflow-hidden h-[280px]">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                            <User size={14} className="text-blue-500" />
                                            Investor Persona
                                        </h4>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-bold text-gray-900">Balanced</span>
                                            <span className="text-xs text-gray-400 font-medium">Growth</span>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                                        <Activity size={20} />
                                    </div>
                                </div>

                                {/* Visual: Charts */}
                                <div className="flex-1 flex items-end gap-2 pb-2">
                                    {[40, 65, 45, 70, 55].map((h, i) => (
                                        <div key={i} className="flex-1 bg-blue-100 rounded-t-lg relative overflow-hidden group-hover:bg-blue-200 transition-colors" style={{ height: `${h}%` }}>
                                            <div className="absolute bottom-0 left-0 w-full bg-blue-500/20 h-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionDelay: `${i * 50}ms` }}></div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Risk Score</span>
                                    <span className="text-xs font-bold text-blue-600">68/100</span>
                                </div>
                            </div>

                            {/* [Card 2] Market Risk */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:border-amber-200 transition-colors group relative overflow-hidden h-[280px]">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                            <Activity size={14} className="text-amber-500" />
                                            Market Risk
                                        </h4>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-bold text-gray-900">Moderate</span>
                                            <span className="text-xs text-amber-500 font-medium">+2.4%</span>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                                        <ArrowDown size={20} className="rotate-45" />
                                    </div>
                                </div>

                                {/* Visual: Wave */}
                                <div className="flex-1 flex items-center justify-center relative">
                                    <svg className="w-full h-24 text-amber-500/20 group-hover:text-amber-500/40 transition-colors" viewBox="0 0 100 40" preserveAspectRatio="none">
                                        <path d="M0 20 Q 25 5, 50 20 T 100 20" fill="none" stroke="currentColor" strokeWidth="3" />
                                        <path d="M0 20 Q 25 35, 50 20 T 100 20" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-50" />
                                    </svg>
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Volatility</span>
                                    <span className="text-xs font-bold text-amber-600">12.5%</span>
                                </div>
                            </div>

                            {/* [Card 3] AI Diagnosis */}
                            <div
                                onClick={() => navigate('/diagnosis')}
                                className="bg-[#111621] rounded-3xl p-6 shadow-xl shadow-gray-200/50 flex flex-col relative overflow-hidden h-[280px] cursor-pointer group hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* 背景光暈 */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-900/20 to-transparent"></div>

                                {/* Header */}
                                <div className="flex justify-between items-start mb-4 z-10">
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-200 flex items-center gap-2">
                                            <Sparkles size={14} className="text-blue-400" />
                                            AI Diagnosis
                                        </h4>
                                        <p className="text-[10px] text-gray-400 mt-1">Behavioral Engine</p>
                                    </div>
                                    <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-white group-hover:scale-110 transition-transform duration-300">
                                        <BrainCircuit size={20} />
                                    </div>
                                </div>

                                {/* Visual: Scan Animation */}
                                <div className="flex-1 flex items-center justify-center relative z-10">
                                    <div className="relative w-28 h-28">
                                        {/* 旋轉外圈 */}
                                        <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                                        {/* 靜態內圈 */}
                                        <div className="absolute inset-4 border border-white/10 rounded-full"></div>
                                        {/* 掃描線效果 */}
                                        <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-blue-500/20 animate-scan"></div>
                                        </div>
                                        {/* 中心文字 */}
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-2xl font-bold text-white tracking-tighter">IQ</span>
                                            <span className="text-[9px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30 mt-1">Start</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-between z-10">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* [Card 4] Pension Calculator */}
                            <div
                                onClick={() => navigate('/pension')}
                                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col hover:border-emerald-200 transition-colors group relative overflow-hidden h-[280px] cursor-pointer"
                            >
                                {/* 背景裝飾 */}
                                <div className="absolute -right-4 -bottom-4 text-emerald-50 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                    <Landmark size={180} />
                                </div>

                                {/* Header */}
                                <div className="flex justify-between items-start mb-4 z-10">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                            <Calculator size={14} className="text-emerald-500" />
                                            Pension Gap
                                        </h4>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-bold text-gray-900">Calculator</span>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        <TrendingDown size={20} />
                                    </div>
                                </div>

                                {/* Visual: Three Pillars */}
                                <div className="flex-1 flex items-end justify-center gap-4 pb-4 relative z-10">
                                    {/* T1 */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 bg-emerald-100 rounded-t-lg h-12 group-hover:h-16 transition-all duration-500"></div>
                                        <span className="text-[9px] font-bold text-gray-400">T1</span>
                                    </div>
                                    {/* T2 */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 bg-emerald-200 rounded-t-lg h-20 group-hover:h-24 transition-all duration-500 delay-75"></div>
                                        <span className="text-[9px] font-bold text-emerald-600">T2</span>
                                    </div>
                                    {/* T3 (Gap) */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 bg-gray-50 border border-dashed border-gray-300 rounded-t-lg h-28 group-hover:border-emerald-400 transition-colors delay-150 flex items-center justify-center">
                                            <span className="text-[10px] text-gray-300">?</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400">Gap</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between z-10">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Taiwan Edition</span>
                                    <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        Start
                                        <ArrowRight size={14} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes scan {
                        0% { transform: translateY(-100%); }
                        100% { transform: translateY(200%); }
                    }
                    .animate-scan {
                        animation: scan 2s linear infinite;
                    }
                `}</style>
            </main>
        </div>
    );
}
