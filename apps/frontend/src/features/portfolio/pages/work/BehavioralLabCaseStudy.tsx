import { ArrowLeft, ExternalLink, Activity, BrainCircuit, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BehavioralLabCaseStudy() {
    const navigate = useNavigate();

    return (
        <article className="w-full bg-[#f6f6f8] min-h-screen pb-24">
            {/* Hero Banner */}
            <div className="w-full h-[40vh] md:h-[50vh] bg-gradient-to-br from-white via-[#f0f4f8] to-[#e6eaf0] relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-[0.03] mix-blend-multiply"
                    style={{ backgroundImage: `url('/assets/images/placeholder_abstract.png')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent lg:hidden" />
                <div className="relative z-10 text-center px-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100 mb-6 inline-block shadow-sm">
                        行為財務學與數據視覺化 (Behavioral Finance & Data Viz)
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-4">
                        行為決策導航儀
                    </h1>
                    <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                        結合行為科學與數據視覺化的互動式決策工具。
                    </p>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 lg:px-8 -mt-16 relative z-20">
                {/* Info Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 mb-16 flex flex-col md:flex-row gap-8 justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">角色 (Role)</h3>
                        <p className="font-medium text-gray-900">前端工程師 (UI/UX)</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">重點領域</h3>
                        <p className="font-medium text-gray-900">數據視覺化 (Data-Viz)、動態狀態管理</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">技術棧 (Tech Stack)</h3>
                        <p className="font-medium text-gray-900">React 19, Recharts, Zustand, Tailwind CSS</p>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-20 text-lg leading-relaxed text-gray-600">

                    {/* Context */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BrainCircuit size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">開發動機 (Context)</h2>
                        </div>
                        <p className="mb-4">
                            傳統的金融風險評估往往依賴枯燥的問卷，不僅缺乏吸引力，也無法即時反映投資人的心理狀態。我們需要一個能夠即刻回應、並極具視覺張力的儀表板，讓使用者在操作的當下就能意識到自己的「偏誤」。
                        </p>
                        <p>
                            這促成了「行為決策導航儀 (Behavioral Compass)」的誕生。這不是一個完整的系統，而是一個極致打磨的 **React UI 獨立組件**，專注於展現精緻的數據互動與即時反饋。
                        </p>
                    </section>

                    {/* Data Visualization */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Activity size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">複雜數據的視覺降維 (Data Visualization)</h2>
                        </div>
                        <ul className="list-disc pl-6 space-y-4 marker:text-gray-300">
                            <li><strong className="text-gray-900">客製化 Recharts 雷達圖：</strong> 行為偏誤（如：過度自信、損失厭惡、FOMO 等）是多維度的。我使用 <code>Recharts</code> 繪製動態的 Radar Chart，並透過精細的 <code>strokeDasharray</code> 和漸層 (Gradients) 設定，達到極富現代感的 Fintech 視覺風格。</li>
                            <li><strong className="text-gray-900">平滑動畫過渡 (Smooth Transitions)：</strong> 在數值變化時，藉由 React 19 的特性確保動畫不會發生掉幀，讓心理特徵的改變如同呼吸般自然地映射在圖表上。</li>
                        </ul>
                    </section>

                    {/* State Management */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Database size={24} /></div>
                            <h2 className="text-3xl font-bold text-gray-900">Zustand 跨組件狀態同步</h2>
                        </div>
                        <p className="mb-4">
                            在單一組件中處理多種維度（風險指數、心理偏誤極值、互動狀態），如果光靠 <code>useState</code> 將會導致嚴重的 Prop Drilling 與不必要的 Re-renders。
                        </p>
                        <ul className="list-disc pl-6 space-y-2 marker:text-gray-300">
                            <li><strong className="text-gray-900">原子化狀態管理：</strong> 引入輕量級的 <code>Zustand</code> 在全域層級保存使用者的測評數據。當外在因子改變（例如使用者選擇了某個選項），狀態改變將直接映射更新圖表中的 Polyline。</li>
                            <li><strong className="text-gray-900">減少渲染負擔 (Render-Phase Opt)：</strong> 透過精準地 Select 出所需狀態，使得雷達圖與右側的分析面板能獨立渲然，不干擾彼此，保持 60fps 體驗。</li>
                        </ul>
                    </section>
                </div>

                {/* Bottom CTA */}
                <div className="mt-24 pt-12 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-gray-900 font-bold flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={18} /> 回到首頁
                    </button>

                    <button
                        onClick={() => window.open('/lab/behavioral', '_blank')}
                        className="h-14 px-8 rounded-xl bg-[#2463eb] text-white font-bold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 w-full sm:w-auto"
                    >
                        開啟實驗室 Demo <ExternalLink size={18} />
                    </button>
                </div>
            </main>
        </article>
    );
}
