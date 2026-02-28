import { Wrench, ArrowRight } from 'lucide-react';

export default function SmartSavingsTracker() {
    return (
        <section className="flex flex-col md:flex-row gap-12 py-12 items-center bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm">
            <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 w-fit">
                    <Wrench size={14} />
                    <span className="text-xs font-bold uppercase tracking-wide">Utility Tool</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#111418]">Smart Savings Tracker</h2>
                <p className="text-slate-600 max-w-lg text-lg leading-relaxed">
                    A personal utility to track micro-savings goals. Designed with a skeuomorphic receipt aesthetic to bring a tangible feel to digital finance.
                </p>
                <button className="text-blue-600 font-bold hover:text-blue-700 flex items-center gap-2 text-lg group">
                    Try the Demo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            <div className="relative">
                <div className="relative w-80 bg-white drop-shadow-2xl rotate-3 transform hover:rotate-0 transition-transform duration-500 font-mono text-xs border-t-4 border-blue-600">
                    <div className="absolute -top-3 left-0 w-full h-3 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
                    <div className="p-8 pb-10 flex flex-col gap-5 text-gray-800">
                        <div className="text-center border-b border-dashed border-gray-300 pb-5">
                            <h3 className="text-xl font-bold uppercase tracking-widest text-[#111418]">Savings Goal</h3>
                            <p className="text-gray-500 mt-2">Acme FinTech Bank</p>
                            <p className="text-gray-400 text-[10px] mt-1">Oct 24, 2023 • 14:30 PM</p>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span>Coffee Skip</span><span>$ 5.50</span></div>
                            <div className="flex justify-between"><span>Round Up</span><span>$ 0.45</span></div>
                            <div className="flex justify-between"><span>Wkly Deposit</span><span>$50.00</span></div>
                        </div>
                        <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between font-bold text-base text-[#111418]">
                            <span>TOTAL SAVED</span>
                            <span>$55.95</span>
                        </div>
                        <div className="text-center pt-6">
                            <div className="w-20 h-20 mx-auto bg-[#111418] p-1">
                                <div className="w-full h-full bg-white flex items-center justify-center">
                                    <span className="text-[10px] tracking-tighter">QR-CODE</span>
                                </div>
                            </div>
                            <p className="mt-3 text-[10px] text-gray-400 uppercase tracking-wide">Scan to deposit</p>
                        </div>
                    </div>
                    <div className="absolute -bottom-3 left-0 w-full h-3 bg-white" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
                </div>
            </div>
        </section>
    );
}
