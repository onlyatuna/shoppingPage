import React from 'react';
import { SimulationResult, AdvisorResponse } from '../types';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import { AlertTriangle, Activity, Target, BrainCircuit } from 'lucide-react';

interface ResultsDashboardProps {
    results: SimulationResult;
    advisorData: AdvisorResponse | null;
    isLoadingAdvice: boolean;
}

const CurrencyFormatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
});

interface StatCardProps {
    title: string;
    value: string;
    subValue: string;
    icon: React.ReactElement;
    color: string;
}

const StatCard = ({ title, value, subValue, icon, color }: StatCardProps) => (
    <div className="bg-white rounded-xl shadow p-6 flex items-start justify-between border border-gray-100">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h4 className={`text-2xl font-bold ${color}`}>{value}</h4>
            {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
            {React.cloneElement(icon as React.ReactElement<{ className: string }>, { className: `w-6 h-6 ${color}` })}
        </div>
    </div>
);

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results, advisorData, isLoadingAdvice }) => {
    // 格式化函數
    const formatMoney = (val: number) => Math.round(val).toLocaleString();

    const isSafe = results.successRate > 80;
    const successColor = isSafe ? 'text-emerald-600' : results.successRate > 50 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="space-y-6">
            {/* 1. 核心指標卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="退休成功機率"
                    value={`${results.successRate.toFixed(1)}%`}
                    subValue="資產可支應至90歲之機率"
                    icon={<Activity />}
                    color={successColor}
                />
                <StatCard
                    title="資產耗盡年齡 (保守)"
                    value={results.depletionAgeP10 > 100 ? ">100歲" : `${results.depletionAgeP10}歲`}
                    subValue="在悲觀市場情境下 (P10)"
                    icon={<AlertTriangle />}
                    color="text-orange-600"
                />
                <StatCard
                    title="總缺口 (現值)"
                    value={`$${formatMoney(results.totalGapPV)}`}
                    subValue="依中位數情境計算"
                    icon={<Target />}
                    color="text-purple-600"
                />
            </div>

            {/* 2. 收入來源拆解 */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">退休收入來源分析 (月/現值)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium mb-1">支柱一 (社會保險)</p>
                        <p className="text-xl font-bold text-blue-700">{CurrencyFormatter.format(results.incomeBreakdown.pillar1)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-xs text-green-600 font-medium mb-1">支柱二 (職業退休金)</p>
                        <p className="text-xl font-bold text-green-700">{CurrencyFormatter.format(results.incomeBreakdown.pillar2)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-xs text-purple-600 font-medium mb-1">其他固定收入</p>
                        <p className="text-xl font-bold text-purple-700">{CurrencyFormatter.format(results.incomeBreakdown.other)}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-xs text-red-600 font-medium mb-1">每月缺口</p>
                        <p className="text-xl font-bold text-red-700">{CurrencyFormatter.format(results.monthlyGapPV)}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-600">目標月生活費</p>
                        <p className="text-2xl font-bold text-gray-800">{CurrencyFormatter.format(results.monthlyExpensePV)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">總固定收入</p>
                        <p className="text-2xl font-bold text-emerald-600">{CurrencyFormatter.format(results.monthlyIncomePV)}</p>
                    </div>
                </div>
            </div>

            {/* 3. 資產走勢圖 (信心區間) */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">資產餘額預測 (蒙地卡羅模擬 10,000次)</h3>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={results.trajectory}>
                            <defs>
                                <linearGradient id="colorP90" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="colorP10" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="age"
                                label={{ value: '年齡', position: 'insideBottomRight', offset: -5 }}
                                stroke="#6B7280"
                            />
                            <YAxis
                                tickFormatter={(val) => `${(val / 10000).toFixed(0)}萬`}
                                stroke="#6B7280"
                            />
                            <Tooltip
                                formatter={(val: number | undefined) => val !== undefined ? `$${formatMoney(val)}` : 'N/A'}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="line"
                            />

                            {/* 樂觀區間 */}
                            <Area
                                type="monotone"
                                dataKey="p90"
                                stroke="#10B981"
                                strokeWidth={1.5}
                                fill="url(#colorP90)"
                                name="樂觀情境 (P90)"
                            />
                            {/* 中位數 */}
                            <Area
                                type="monotone"
                                dataKey="p50"
                                stroke="#6366F1"
                                strokeWidth={3}
                                fill="none"
                                name="中位數 (P50)"
                            />
                            {/* 悲觀區間 */}
                            <Area
                                type="monotone"
                                dataKey="p10"
                                stroke="#EF4444"
                                strokeWidth={1.5}
                                fill="url(#colorP10)"
                                name="悲觀情境 (P10)"
                            />

                            {/* 0軸參考線 */}
                            <ReferenceLine
                                y={0}
                                stroke="#000"
                                strokeDasharray="3 3"
                                strokeWidth={2}
                                label={{ value: '資產歸零線', position: 'insideTopRight', fill: '#DC2626' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 leading-relaxed">
                        <strong>圖表說明：</strong>此圖顯示資產在不同市場表現下的分佈範圍。
                        <span className="text-green-600 font-medium"> 綠色區域</span>代表樂觀情境(90%信心水準)，
                        <span className="text-indigo-600 font-medium"> 藍色線</span>為中位數預測，
                        <span className="text-red-600 font-medium"> 紅色區域</span>代表悲觀情境(10%信心水準)，資產可能提早歸零。
                    </p>
                </div>
            </div>

            {/* 4. AI 建議區塊 */}
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-6 rounded-xl shadow">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-white/20 pb-4">
                    <BrainCircuit className="text-yellow-400" />
                    AI 退休規劃顧問
                    {isLoadingAdvice && <span className="animate-pulse text-xs bg-white/20 px-2 py-0.5 rounded ml-auto">Thinking...</span>}
                </h3>

                <div className="space-y-4">
                    {advisorData ? (
                        <div className="animate-in fade-in duration-500 space-y-4">
                            <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                                <h4 className="font-bold text-yellow-400 text-xs mb-2 uppercase tracking-wider">Analysis</h4>
                                <p className="text-sm opacity-90 leading-relaxed text-indigo-100">{advisorData.analysis}</p>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">Recommendations</h4>
                                {advisorData.suggestions.map((s, idx) => (
                                    <div key={idx} className="flex gap-3 text-sm opacity-90 group hover:opacity-100 transition-opacity">
                                        <span className="bg-white/20 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs mt-0.5 font-bold">{idx + 1}</span>
                                        <p className="leading-relaxed">{s}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 opacity-40 space-y-3">
                            <BrainCircuit className="w-16 h-16" />
                            <p className="text-sm text-center">請點擊「開始試算」<br />以獲取 AI 投資建議</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};