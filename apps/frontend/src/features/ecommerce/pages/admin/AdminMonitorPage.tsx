import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Activity, AlertTriangle, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';

export default function AdminMonitorPage() {
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await apiClient.get('/admin/stats');
            return res.data.data as { date: string; count: number; cost: number }[];
        }
    });

    if (isLoading) return <div className="p-8 text-center animate-pulse">載入監控數據中...</div>;
    if (isError) return <div className="p-8 text-center text-red-500">無法讀取監控數據，請確認權限或網路狀態。</div>;

    const todayStat = stats && stats.length > 0 ? stats[stats.length - 1] : { date: new Date().toISOString().split('T')[0], cost: 0, count: 0 };

    const totalCost30Days = stats?.reduce((acc, curr) => acc + curr.cost, 0) || 0;
    const totalCount30Days = stats?.reduce((acc, curr) => acc + curr.count, 0) || 0;

    // Fallback limit if env not exposed (default 5.0)
    const DAILY_LIMIT = 5.0;
    const costPercentage = Math.min((todayStat.cost / DAILY_LIMIT) * 100, 100);
    const isCostWarning = costPercentage > 80;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="text-green-600" />
                流量監控與成本管理 (AI Monitor)
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* 狀態卡片 1: 今日花費 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-sm font-bold text-gray-500 mb-1 tracking-wider uppercase">今日 AI 消耗</p>
                            <div className="text-3xl font-black text-gray-900 flex items-baseline gap-1">
                                <span className="text-lg text-gray-500">$</span>
                                {todayStat.cost.toFixed(4)}
                            </div>
                        </div>
                        <div className={`p-3 rounded-xl ${isCostWarning ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                            {isCostWarning ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                        </div>
                    </div>

                    <div className="space-y-1 relative z-10">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-gray-500">預算使用率</span>
                            <span className={isCostWarning ? 'text-red-500' : 'text-gray-900'}>{costPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${isCostWarning ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${costPercentage}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 text-right mt-1">每日熔斷上限: ${DAILY_LIMIT.toFixed(2)}</p>
                    </div>

                    {/* Background decoration */}
                    <DollarSign className="absolute -right-6 -bottom-6 w-32 h-32 text-gray-50 opacity-50 z-0" />
                </div>

                {/* 狀態卡片 2: 今日調用次數 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-bold text-gray-500 mb-1 tracking-wider uppercase">今日調用次數</p>
                            <div className="text-3xl font-black text-gray-900">
                                {todayStat.count}
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Gemini API 等各項服務</p>
                </div>

                {/* 狀態卡片 3: 近30日花費 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-bold text-gray-500 mb-1 tracking-wider uppercase">近 30 日總花費</p>
                            <div className="text-3xl font-black text-gray-900 flex items-baseline gap-1">
                                <span className="text-lg text-gray-500">$</span>
                                {totalCost30Days.toFixed(2)}
                            </div>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-500 rounded-xl">
                            <Activity size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 font-medium tracking-tight">
                        總調用次數: <span className="text-gray-900 font-bold">{totalCount30Days}</span> 次
                    </p>
                </div>
            </div>

            {/* 圖表區 (簡易長條圖) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="text-gray-400" size={20} />
                    近 30 日消耗趨勢
                </h3>

                <div className="h-64 flex items-end gap-1 overflow-x-auto pb-4 custom-scrollbar">
                    {stats?.map((stat, idx) => {
                        // Max cost in 30 days to scale bars
                        const maxCost = Math.max(...(stats.map(s => s.cost)), 0.01);
                        const heightPercent = Math.max((stat.cost / maxCost) * 100, 2); // min 2% height for visibility

                        return (
                            <div key={idx} className="flex-1 flex flex-col justify-end items-center group min-w-[24px]">
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 text-white text-[10px] rounded px-2 py-1 mb-2 absolute -mt-10 pointer-events-none z-10 hidden md:block">
                                    {stat.date}<br />${stat.cost.toFixed(4)} ({stat.count}次)
                                </div>
                                <div
                                    className="w-full bg-[#5A9EA3]/30 group-hover:bg-[#E85D3F] transition-colors rounded-t-sm relative"
                                    style={{ height: `${heightPercent}%` }}
                                >
                                    {/* Small indicator on top if cost exists */}
                                    {stat.cost > 0 && (
                                        <div className="absolute top-0 w-full h-1 bg-[#5A9EA3] group-hover:bg-[#1A2B42]" />
                                    )}
                                </div>
                                {/* <div className="text-[8px] text-gray-400 mt-2 transform -rotate-45 origin-top-left -ml-2 whitespace-nowrap">
                                    {stat.date.substring(5)}
                                </div> */}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400 mt-2 px-2">
                    <span>{stats?.[0]?.date}</span>
                    <span>{todayStat.date} (今日)</span>
                </div>
            </div>
        </div>
    );
}

