import { ArrowLeft, ExternalLink, Activity, Target, Zap, Server, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EcommerceCaseStudy() {
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
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100 mb-6 inline-block shadow-sm">
                        電子商務與 AI (E-Commerce & AI)
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-4">
                        AI ShopMaster
                    </h1>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        使用生成式 AI 自動化商品工作流的智慧儀表板。
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 lg:px-8 -mt-16 relative z-20">
                {/* Info Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 mb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">角色 (Role)</h3>
                        <p className="font-medium text-gray-900">全端工程師 (Full-Stack Engineer)</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">時程 (Timeline)</h3>
                        <p className="font-medium text-gray-900">4 週</p>
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">技術棧 (Tech Stack)</h3>
                        <ul className="space-y-1.5">
                            <li className="text-[15px] font-medium text-gray-900"><span className="text-gray-500 mr-2">前端 (Frontend):</span>React 19, Tailwind CSS, Vite, Framer Motion</li>
                            <li className="text-[15px] font-medium text-gray-900"><span className="text-gray-500 mr-2">後端與資料庫 (Backend & DB):</span>Express 5, MySQL, Prisma ORM, JWT, Zod</li>
                            <li className="text-[15px] font-medium text-gray-900"><span className="text-gray-500 mr-2">AI 與第三方整合 (AI & API):</span>Gemini AI, LINE Pay V3, IG Graph API, Cloudinary</li>
                        </ul>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-20 text-lg leading-relaxed text-gray-600">

                    {/* Highlights */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Lightbulb size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">核心亮點 (Core Highlights)</h2>
                        </div>
                        <p className="mb-4">
                            <strong>核心理念：</strong>結合生成式 AI 與社群自動化的全端電商儀表板，大幅降低商家營運成本。
                        </p>
                        <ul className="list-disc pl-6 space-y-3 marker:text-gray-300">
                            <li><strong>AI 自動化 (AI Integration)：</strong>串接 Gemini API 自動生成行銷文案，大幅提升商品上架效率。</li>
                            <li><strong>全端資安防護 (Security)：</strong>實作 Double Submit Cookie CSRF 防禦、動態 JSON Body 限制與 HSTS，確保金流與資料安全。</li>
                            <li><strong>系統監控 (Observability)：</strong>整合 Pino 結構化日誌與 Zod 資料驗證，建構具備高度診斷能力的後端架構。</li>
                        </ul>
                    </section>

                    {/* Context */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Target size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">背景脈絡 (Context)</h2>
                        </div>
                        <p>
                            現代電商賣家花費大量時間手動撰寫商品描述、管理庫存狀態以及處理結帳流程。AI ShopMaster 的目標是打造一個既簡潔專業，又能主動協助賣家的管理儀表板。
                        </p>
                    </section>

                    {/* Challenge */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Activity size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">面臨挑戰 (The Challenge)</h2>
                        </div>
                        <p className="mb-4">
                            在標準 CRUD 介面中整合生成式 AI (Google Gemini)，同時不能讓人覺得突兀。介面需要清楚區分 AI 生成內容與使用者輸入內容。
                        </p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-gray-300">
                            <li>在處理 AI 串流生成與高流量 API 的同時，確保系統具備防禦 DoS 與記憶體耗竭的韌性。</li>
                            <li>設計一套能自動識別 API 職責的動態 JSON Body 限制機制，平衡性能與安全性。</li>
                            <li>處理 LINE Pay V3 複雜的 Hmac 簽章驗證，確保交易資料的完整性與不可篡改性。</li>
                        </ul>
                    </section>

                    {/* Solution */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Zap size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">解決方案 (The Solution)</h2>
                        </div>
                        <p className="mb-6">
                            我們使用標準 React 模式架構儀表板，搭配 Tailwind CSS 進行快速切版。將 Gemini AI 整合封裝為 Custom Hook，將即時串流文字直接寫入描述欄位。
                        </p>
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col items-center justify-center min-h-[300px] mb-6">
                            <img src="/preview.png" alt="Dashboard Dashboard" className="rounded-xl shadow-md max-w-full h-auto" />
                        </div>
                    </section>

                    {/* Architecture Diagram */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Server size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">系統架構 (Architecture)</h2>
                        </div>
                        <p className="mb-8">
                            我們設計了穩健的全端架構，確保繁重的 AI 推理任務不會阻塞前端體驗。
                        </p>

                        <div className="w-full bg-[#111621] rounded-3xl p-8 shadow-xl text-white relative flex flex-col items-center overflow-hidden border border-gray-800">
                            <div className="absolute inset-0 bg-[url('/assets/images/hero_bg.png')] bg-cover bg-center opacity-10 mix-blend-overlay" />

                            {/* Diagram Container */}
                            <div className="relative z-10 w-full max-w-2xl flex flex-col md:flex-row items-center justify-between gap-6">

                                {/* Frontend Node */}
                                <div className="flex flex-col items-center bg-gray-800/80 backdrop-blur-sm border border-gray-700 w-48 p-4 rounded-xl text-center">
                                    <div className="font-mono text-xs text-blue-400 mb-1">前端 (FRONTEND)</div>
                                    <div className="font-bold text-lg">React 儀表板</div>
                                    <div className="text-xs text-gray-400 mt-2">Vite + Tailwind</div>
                                </div>

                                {/* Arrow */}
                                <div className="text-gray-500 font-bold md:-rotate-90 md:my-0 my-2">↓</div>

                                {/* Backend Node */}
                                <div className="flex flex-col items-center bg-blue-900/50 backdrop-blur-sm border border-blue-800 w-48 p-4 rounded-xl text-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                    <div className="font-mono text-xs text-blue-300 mb-1">後端 (BACKEND API)</div>
                                    <div className="font-bold text-lg">Node.js Express</div>
                                    <div className="text-xs text-blue-200 mt-2">RESTful + MySQL</div>
                                </div>

                                {/* Arrow split */}
                                <div className="hidden md:flex flex-col justify-center h-full">
                                    <div className="h-0.5 w-6 bg-gray-600"></div>
                                </div>
                                <div className="flex md:hidden text-gray-500 font-bold my-2">↓</div>

                                {/* Integrations Node */}
                                <div className="flex flex-col gap-3 w-48">
                                    <div className="flex flex-col items-center bg-purple-900/40 backdrop-blur-sm border border-purple-800/50 p-3 rounded-lg text-center">
                                        <div className="font-bold text-sm">Gemini / IG API</div>
                                        <div className="text-[10px] text-gray-400 mt-1">AI 與自動化</div>
                                    </div>
                                    <div className="flex flex-col items-center bg-blue-900/40 backdrop-blur-sm border-blue-800/50 p-3 rounded-lg text-center">
                                        <div className="font-bold text-sm">Security Layers</div>
                                        <div className="text-[10px] text-blue-300 mt-1">CSRF / CSP / HSTS</div>
                                    </div>
                                    <div className="flex flex-col items-center bg-indigo-900/40 backdrop-blur-sm border-indigo-800/50 p-3 rounded-lg text-center">
                                        <div className="font-bold text-sm">Payment API</div>
                                        <div className="text-[10px] text-gray-400 mt-1">LINE Pay V3</div>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                        onClick={() => window.open('/work/ecommerce/demo', '_blank')}
                        className="h-14 px-8 rounded-xl bg-[#2463eb] text-white font-bold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 w-full sm:w-auto"
                    >
                        開啟線上 Demo <ExternalLink size={18} />
                    </button>
                </div>
            </main>
        </article>
    );
}
