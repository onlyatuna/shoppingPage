import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Top Navigation */}
      <header className="w-full fixed top-0 left-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={onStart}>
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary dark:text-white dark:bg-primary/30 transition-colors">
              <span className="material-symbols-outlined text-[20px]">psychology_alt</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity">
              AI 投資行為診斷室
            </h1>
          </div>
          <button className="flex items-center justify-center px-5 h-10 rounded-full text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
            登入
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-20 relative bg-[radial-gradient(circle_at_50%_0%,_rgba(50,79,108,0.03)_0%,_transparent_70%)]">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
          
          {/* Hero Text Block */}
          <div className="flex flex-col gap-6 max-w-3xl mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.2] text-slate-900 dark:text-white">
              解碼您的 <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-slate-400">投資 DNA</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
              運用行為金融學模型，透視您的決策是源於「理性邏輯」還是「情緒偏誤」。
            </p>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col items-center gap-8 mb-20 w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button 
              onClick={onStart}
              className="group relative flex items-center justify-center gap-3 h-14 px-8 rounded-full bg-primary hover:bg-primary-dark text-white text-base font-bold shadow-glow hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out min-w-[200px]"
            >
              <span>開始深度診斷</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-white dark:border-background-dark bg-gray-200 object-cover" src="https://picsum.photos/id/1011/100/100" alt="User 1" />
                <img className="w-10 h-10 rounded-full border-2 border-white dark:border-background-dark bg-gray-200 object-cover" src="https://picsum.photos/id/1012/100/100" alt="User 2" />
                <img className="w-10 h-10 rounded-full border-2 border-white dark:border-background-dark bg-gray-200 object-cover" src="https://picsum.photos/id/1025/100/100" alt="User 3" />
                <div className="w-10 h-10 rounded-full border-2 border-white dark:border-background-dark bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  +10k
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                已有 <strong className="text-slate-900 dark:text-slate-200">10,000+ 位投資人</strong> 完成分析
              </p>
            </div>
          </div>

          {/* Hero Image / Visual Anchor */}
          <div className="w-full max-w-4xl relative group perspective-1000 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {/* Abstract Decorative Background Blur */}
            <div className="absolute -inset-10 bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-60"></div>
            
            {/* Main Image Container */}
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-soft border border-white/50 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm animate-float">
               {/* Using a high quality abstract image from picsum to match the vibe */}
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1611974765270-ca12586343bb?q=80&w=2000&auto=format&fit=crop')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-background-light/20 via-transparent to-transparent dark:from-background-dark/20 pointer-events-none"></div>
              
              {/* Overlay Text for context */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="backdrop-blur-md bg-white/90 dark:bg-slate-900/80 p-6 rounded-2xl border border-white/20 shadow-xl text-center">
                    <p className="text-slate-900 dark:text-white font-bold text-xl tracking-widest uppercase">Behavioral Finance</p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">Cognitive vs. Emotional</p>
                 </div>
              </div>
            </div>

            {/* Floating Badge 1 */}
            <div className="hidden md:flex absolute -left-8 top-1/4 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 gap-3 items-center animate-[float_8s_ease-in-out_1s_infinite]">
              <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">理性指數</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">94/100</div>
              </div>
            </div>

            {/* Floating Badge 2 */}
            <div className="hidden md:flex absolute -right-8 bottom-1/4 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 gap-3 items-center animate-[float_7s_ease-in-out_0.5s_infinite]">
              <div className="size-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">偏誤風險</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">低</div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-100 dark:border-gray-800 py-10 bg-white/50 dark:bg-background-dark/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © 2024 AI Investor Diagnosis. Design for Behavioral Finance.
          </p>
        </div>
      </footer>
    </div>
  );
};