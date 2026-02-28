import { ArrowLeft, ExternalLink, Activity, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PensionCaseStudy() {
    const navigate = useNavigate();

    return (
        <article className="w-full bg-[#f6f6f8] min-h-screen pb-24">
            {/* Hero Banner */}
            <div className="w-full h-[40vh] md:h-[50vh] bg-gradient-to-br from-white via-[#f0f4f8] to-[#e6eaf0] relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-[0.03] mix-blend-multiply"
                    style={{ backgroundImage: `url('/assets/images/hero_bg.png')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent lg:hidden" />
                <div className="relative z-10 text-center px-6">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 mb-6 inline-block shadow-sm">
                        金融科技與數據視覺化 (FinTech & Data Viz)
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-4">
                        退休金缺口計算機
                    </h1>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        透過互動式分析，視覺化退休軌跡與儲蓄缺口。
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 lg:px-8 -mt-16 relative z-20">
                {/* Info Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 mb-16 flex flex-col md:flex-row gap-8 justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">角色 (Role)</h3>
                        <p className="font-medium text-gray-900">前端工程師</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">時程 (Timeline)</h3>
                        <p className="font-medium text-gray-900">2 週</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">技術棧 (Tech Stack)</h3>
                        <p className="font-medium text-gray-900">React, Recharts, TailwindCSS</p>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-20 text-lg leading-relaxed text-gray-600">

                    {/* Context */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Target size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">背景脈絡 (Context)</h2>
                        </div>
                        <p>
                            退休規劃通常非常抽象且充滿術語。「退休金缺口計算機」旨在向使用者揭示他們到底需要存多少錢，以及強制性國家與職業退休金將提供多少保障。
                        </p>
                    </section>

                    {/* Challenge */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Activity size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">面臨挑戰 (The Challenge)</h2>
                        </div>
                        <p className="mb-4">
                            為複雜且累進的稅務/退休金計算引擎設計一個直觀的介面。
                        </p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-gray-300">
                            <li>準確地將法定計算公式轉化為前端邏輯。</li>
                            <li>根據薪資輸入自動縮放的響應式動態圖表。</li>
                            <li>確保「缺口」視覺化足以引發行動感，但又不會讓人感到過度挫敗。</li>
                        </ul>
                    </section>

                    {/* Solution */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Zap size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">解決方案 (The Solution)</h2>
                        </div>
                        <p className="mb-6">
                            使用 Recharts，我們開發了一個代表「三大支柱」的堆疊長條圖系統。簡潔的多步驟表單逐步收集必要的用戶數據，以避免認知的負擔。
                        </p>
                    </section>
                </div>

                {/* Bottom CTA */}
                <div className="mt-24 pt-12 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={18} /> 回到作品集
                    </button>

                    <button
                        onClick={() => window.open('/work/pension/demo', '_blank')}
                        className="h-14 px-8 rounded-xl bg-[#2463eb] text-white font-bold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 w-full sm:w-auto"
                    >
                        開啟線上 Demo <ExternalLink size={18} />
                    </button>
                </div>
            </main>
        </article>
    );
}
