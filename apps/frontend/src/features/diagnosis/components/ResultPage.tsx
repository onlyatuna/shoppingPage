import React, { useRef } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import {
  Download, RefreshCw,
  TrendingUp, Shield, BrainCircuit, Target
} from 'lucide-react';
import { DiagnosisResult } from '@/features/diagnosis/components/QuizPage';

// --- Props 定義 (移除 onGoToAdvisor) ---
interface ResultPageProps {
  result: DiagnosisResult;
  onRetake: () => void;
  // onGoToAdvisor 已移除
}

export const ResultPage: React.FC<ResultPageProps> = ({ result, onRetake }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // 處理報告下載 (生成 HTML)
  const handleDownload = () => {
    const content = reportRef.current?.innerHTML;
    if (!content) return;

    const html = `
            <html>
                <head>
                    <title>AI Investment Diagnosis Report</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="p-8 bg-gray-50">
                    <div class="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-lg">
                        ${content}
                    </div>
                </body>
            </html>
        `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment-dna-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
  };

  // --- 圖表資料準備 ---
  const radarData = [
    { subject: 'Risk', A: result.scores.risk, fullMark: 100 },
    { subject: 'Logic', A: result.scores.logic, fullMark: 100 },
    { subject: 'Patience', A: 65, fullMark: 100 }, // 範例靜態數據
    { subject: 'Discipline', A: 80, fullMark: 100 },
    { subject: 'Knowledge', A: 50, fullMark: 100 },
  ];

  const pieData = [
    { name: 'Growth', value: 40, color: '#3B82F6' },
    { name: 'Stable', value: 30, color: '#10B981' },
    { name: 'Cash', value: 30, color: '#6366F1' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111417] p-4 md:p-8 font-sans">

      {/* Header / Actions */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BrainCircuit className="text-blue-500" />
            Analysis Complete
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here is your personalized behavioral finance profile.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium shadow-sm"
          >
            <Download size={18} />
            <span className="hidden md:inline">Save Report</span>
          </button>

          {/* Retake Button (現在是主要動作之一) */}
          <button
            onClick={onRetake}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium shadow-md shadow-blue-500/20"
          >
            <RefreshCw size={18} />
            <span>Retake</span>
          </button>
        </div>
      </header>

      {/* --- Bento Grid Layout --- */}
      <div ref={reportRef} className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. 主要評分卡 (Main Score) */}
        <div className="md:col-span-2 bg-white dark:bg-[#1A1D24] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Target size={120} />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                Investor Archetype
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                The "Strategic Optimist"
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed">
                You balance risk-taking with logical analysis, though you may occasionally fall prey to overconfidence in bull markets.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Risk Score</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.scores.risk}</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Logic Score</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{result.scores.logic}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 雷達圖 (Radar Chart) */}
        <div className="bg-white dark:bg-[#1A1D24] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center min-h-[300px]">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 w-full text-left">Attribute Map</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="You"
                  dataKey="A"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="#3B82F6"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. 建議配置 (Allocation) */}
        <div className="bg-white dark:bg-[#1A1D24] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Suggested Allocation</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. 行動建議 (Actionable Insights) - 填滿剩餘空間 */}
        <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold text-lg">AI Strategy Recommendation</h3>
            </div>

            <div className="space-y-4">
              <p className="opacity-90 leading-relaxed">
                Based on your high risk tolerance but potential for emotional trading during volatility, we recommend a <strong>Core-Satellite strategy</strong>.
              </p>
              <ul className="space-y-3 mt-4">
                <li className="flex items-start gap-3 opacity-90 text-sm">
                  <Shield size={16} className="mt-1 flex-shrink-0" />
                  <span>Allocate 70% to passive index funds (Core) to minimize emotional decision fatigue.</span>
                </li>
                <li className="flex items-start gap-3 opacity-90 text-sm">
                  <Activity size={16} className="mt-1 flex-shrink-0" />
                  <span>Limit individual stock picking (Satellite) to 30% of portfolio.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// 確保 Activity 圖標有被引入，如果上面沒有引入，補上
import { Activity } from 'lucide-react';

export default ResultPage;