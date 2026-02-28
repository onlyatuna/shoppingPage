import { ArrowLeft, ExternalLink, Activity, Target, Zap, Server, Code2, ShieldCheck, Share2, Database, ArrowRight } from 'lucide-react';
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
                        全端與 AI 系統架構 (Full-Stack & AI)
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-4">
                        AI ShopMaster
                    </h1>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        結合生成式 AI 與社群自動化的全端電商解決方案。
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 lg:px-8 -mt-16 relative z-20">
                {/* Info Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 mb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">角色 (Role)</h3>
                        <p className="font-medium text-gray-900 leading-tight">全端工程師 /<br />AI 系統架構師</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">時程 (Timeline)</h3>
                        <p className="font-medium text-gray-900">4 週</p>
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">技術棧 (Tech Stack)</h3>
                        <ul className="space-y-2">
                            <li className="text-[14px] font-medium text-gray-900 flex items-start gap-2">
                                <span className="text-gray-400 w-24 flex-shrink-0">前端:</span>
                                <span>React 19, Vite, Tailwind CSS, Zustand, Canvas API</span>
                            </li>
                            <li className="text-[14px] font-medium text-gray-900 flex items-start gap-2">
                                <span className="text-gray-400 w-24 flex-shrink-0">後端:</span>
                                <span>Node.js, Express, Prisma ORM, MySQL</span>
                            </li>
                            <li className="text-[14px] font-medium text-gray-900 flex items-start gap-2">
                                <span className="text-gray-400 w-24 flex-shrink-0">整合:</span>
                                <span>Gemini API, Instagram Graph API, LinePay</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-20 text-lg leading-relaxed text-gray-600">

                    {/* Overview */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Target size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">專案總覽 (Overview)</h2>
                        </div>
                        <p className="mb-6">
                            AI ShopMaster 是一個旨在解決中小型電商「內容產出耗時」與「多平台營運繁瑣」痛點的全端解決方案。有別於傳統電商平台，本系統將 <span className="text-gray-900 font-bold underline decoration-blue-500/30 underline-offset-4">生成式 AI</span> 深度整合至商家的工作流中，打造出具備智慧文案生成、影像處理與社群自動發文的次世代電商管理後台。
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <Zap size={18} className="text-amber-500" /> 負責範疇 (Scope)
                                </h4>
                                <p className="text-sm">系統架構設計、RESTful API 開發、第三方服務整合、前端互動介面與編輯器實作。</p>
                            </div>
                            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-emerald-500" /> 安全架構 (Security)
                                </h4>
                                <p className="text-sm">JWT Authentication, CSRF 防護, 全域 Error Handling 模組化, MVC 架構分離。</p>
                            </div>
                        </div>
                    </section>

                    {/* Technical Highlights */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Code2 size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">核心技術亮點 (Core Technical Highlights)</h2>
                        </div>

                        <div className="space-y-12">
                            {/* 1. Frontend Editor */}
                            <div className="relative pl-8 border-l-2 border-indigo-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm" />
                                <h3 className="text-xl font-bold text-gray-900 mb-4">1. SaaS 級前端 AI 編輯器實作 (Frontend Architecture)</h3>
                                <p className="mb-6">
                                    跳脫傳統表單輸入，獨立開發高度模組化的互動式工作區 <span className="text-gray-900 font-bold">(EditorPage)</span>。結合 <span className="text-gray-900 font-bold">Context API</span> 與 <span className="text-gray-900 font-bold">Zustand</span> 進行複雜狀態管理，並實作基於 <span className="text-gray-900 font-bold">Canvas API</span> 的影像處理模組 (ImageCanvas) 與浮動工具列 (FloatingToolbar)。無縫整合 <span className="text-gray-900 font-bold">Gemini AI</span> 撰寫助手 (CopywritingAssistant)，讓商家能在單一介面完成圖文編排與 AI 生成。
                                </p>
                                {/* Editor Screenshot Placeholder */}
                                <div className="mt-6 rounded-2xl overflow-hidden border border-gray-200 shadow-xl group cursor-pointer relative">
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                                    <img
                                        src="/assets/images/editor_preview.png"
                                        alt="AI Editor Interface"
                                        className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/1200x800/f3f4f6/6366f1?text=AI+Editor+Screenshot+Preview';
                                        }}
                                    />
                                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-gray-900 shadow-sm z-20 flex items-center gap-2">
                                        <Code2 size={14} className="text-blue-500" /> 實機功能介面
                                    </div>
                                </div>
                            </div>

                            {/* 2. Backend Architecture */}
                            <div className="relative pl-8 border-l-2 border-blue-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
                                <h3 className="text-xl font-bold text-gray-900 mb-4">2. 端到端全端微服務架構 (End-to-End Backend Systems)</h3>
                                <p className="mb-4">
                                    從零建構高擴展性的 <span className="text-gray-900 font-bold">Node.js / Express</span> 後端服務。嚴格劃分 Routes, Controllers 與 Services 層，並透過 <span className="text-gray-900 font-bold">Prisma ORM</span> 進行高效的資料庫查詢與關聯管理。完整實作包含商品 (Products)、購物車 (Cart)、訂單處理 (Orders) 與權限控管 (Auth/Admin) 的 <span className="text-gray-900 font-bold">RESTful API</span>。
                                </p>
                            </div>

                            {/* 3. Social Automation */}
                            <div className="relative pl-8 border-l-2 border-purple-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-500 border-4 border-white shadow-sm" />
                                <h3 className="text-xl font-bold text-gray-900 mb-4">3. 社群行銷自動化工作流 (API & Workflow Automation)</h3>
                                <p className="mb-4">
                                    將 <span className="text-gray-900 font-bold">Instagram Graph API</span> 深度封裝為後端服務 (instagram.service.ts)，打通從「前端 AI 內容生成」、「後端資料處理」到「社群平台自動排程發布」的數據流。解決 API 授權與非同步任務的技術挑戰，實現社群行銷的零阻力營運。
                                </p>
                            </div>

                            {/* 4. Payments & Security */}
                            <div className="relative pl-8 border-l-2 border-emerald-100">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                                <h3 className="text-xl font-bold text-gray-900 mb-4">4. 企業級金流與安全防護 (Payments & Security)</h3>
                                <p className="mb-4">
                                    實作 <span className="text-gray-900 font-bold">LinePay</span> 金流串接與安全的支付回調 (Callback) 機制，確保交易狀態與訂單資料庫的一致性。系統層級導入 <span className="text-gray-900 font-bold">JWT</span> 雙重驗證機制與 <span className="text-gray-900 font-bold">CSRF</span> 防禦策略 (securityUtils.ts)，保障使用者與商家的資料安全。
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 系統架構區塊 - 端到端系統架構 */}
                    <section className="w-full py-16 bg-[#111621] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.05),transparent)]" />

                        <div className="px-8 mb-12 relative z-10">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Server className="text-blue-400" size={24} />
                                端到端系統架構 <span className="text-blue-500">.</span>
                            </h3>
                            <p className="text-gray-400 mt-2 font-medium">基於 MVC 模式與微服務思維的全端整合方案</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch gap-6 px-6 relative z-10">
                            {/* 第一層：前端 (Frontend) */}
                            <div className="flex-1 space-y-4">
                                <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] px-4">Frontend Layer</div>
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group h-full">
                                    <h4 className="text-white font-bold mb-4 flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                                        <Code2 size={18} /> React 19 UI
                                    </h4>
                                    <ul className="text-xs text-gray-400 space-y-3 font-medium">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                                            Zustand State (Cart/Auth)
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                                            AI Editor (Canvas/Assistant)
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Arrow 1 */}
                            <div className="hidden md:flex items-center justify-center -mx-2 text-blue-500/50">
                                <ArrowRight size={20} />
                            </div>

                            {/* 第二層：後端邏輯 (Backend) */}
                            <div className="flex-[2] space-y-4">
                                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] px-4">Core Service (Node.js)</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                                    <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                                        <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                            <Zap size={16} /> Business Logic
                                        </h4>
                                        <p className="text-[11px] text-emerald-100/60 leading-relaxed font-medium">
                                            基於 MVC 分層架構，實作 RESTful API、Prisma ORM 整合與包含 Product/Order/Cart 的複雜業務流程。
                                        </p>
                                    </div>
                                    <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 hover:border-amber-500/30 transition-all">
                                        <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                                            <ShieldCheck size={16} /> Security Layer
                                        </h4>
                                        <div className="space-y-2">
                                            <p className="text-[11px] text-amber-100/60 leading-relaxed font-medium">
                                                實作 JWT 雙重驗證、CSRF 防護與全域 Error Handling。
                                            </p>
                                            <p className="text-[11px] text-amber-100 font-bold leading-relaxed border-t border-amber-500/20 pt-2">
                                                ★ 針對 Gemini 實作 SSRF 與 Prompt Injection 隔離。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Arrow 2 */}
                            <div className="hidden md:flex items-center justify-center -mx-2 text-blue-500/50">
                                <ArrowRight size={20} />
                            </div>

                            {/* 第三層：外部與數據 (Infrastructure) */}
                            <div className="flex-1 space-y-4">
                                <div className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] px-4">Data & External</div>
                                <div className="p-6 bg-purple-500/5 rounded-2xl border border-purple-500/10 backdrop-blur-sm h-full">
                                    <div className="space-y-6">
                                        <div>
                                            <span className="text-[10px] font-black text-white/40 uppercase block mb-3 tracking-wider">Persistence</span>
                                            <div className="flex items-center gap-2 text-xs text-purple-200/70 font-mono">
                                                <Database size={14} className="text-purple-400" />
                                                MySQL (Prisma ORM)
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-white/5">
                                            <span className="text-[10px] font-black text-white/40 uppercase block mb-3 tracking-wider">Services Integration</span>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-white/5 rounded border border-white/5 text-[10px] text-gray-400 font-medium font-mono text-[9px]">Gemini AI</span>
                                                <span className="px-2 py-1 bg-white/5 rounded border border-white/5 text-[10px] text-gray-400 font-medium font-mono text-[9px]">Instagram API</span>
                                                <span className="px-2 py-1 bg-white/5 rounded border border-white/5 text-[10px] text-gray-400 font-medium font-mono text-[9px]">LinePay</span>
                                            </div>
                                        </div>
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
