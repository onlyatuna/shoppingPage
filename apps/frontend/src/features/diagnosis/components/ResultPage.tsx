import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { DiagnosisResult, BIAS_MAP } from './QuizPage';

interface ResultPageProps {
  onRetake: () => void;
  result: DiagnosisResult;
}

// --- Content Database (Behavioral Finance Personas) ---
const PERSONA_CONTENT = {
  individualist: {
    title: "獨立策略家 (The Individualist)",
    icon: "psychology",
    tags: ["獨立思考", "理性分析", "逆向操作"],
    description: "您是一位充滿自信且具備獨立思考能力的投資人。您不隨波逐流，習慣透過數據與基本面分析來尋找市場的 Alpha（超額報酬）。面對市場波動，您通常能保持冷靜，甚至將大跌視為加碼良機。您相信自己的判斷力優於大眾。",
    advice: [
      {
        title: "逆向思考 (Pre-mortem)",
        subtitle: "克服確認偏誤",
        content: "在做重大決策前，強迫自己寫下 3 個「為什麼這筆交易會失敗」的理由。這能有效平衡您的確認偏誤，避免只看到自己想看的資訊。"
      },
      {
        title: "擴大安全邊際",
        subtitle: "緩衝估值誤差",
        content: "既然您傾向自信，請在計算出的合理價上，再打 8 折作為進場點，為未知的風險預留空間。"
      }
    ],
    allocation: [
      { name: '全球股票 (核心)', value: 70, color: '#5CB85C' },
      { name: '特定個股/幣 (衛星)', value: 30, color: '#F0AD4E' },
    ]
  },
  celebrity: {
    title: "潮流追逐者 (The Celebrity)",
    icon: "rocket_launch",
    tags: ["重視消息", "害怕錯過", "情緒驅動"],
    description: "您充滿熱情，喜歡追逐市場熱點。投資對您來說不僅是賺錢，更是一種參與感的體現。您容易受到新聞頭條、社交媒體或親友話題的影響，擔心錯過行情 (FOMO) 是您進場的主要動力。您的交易頻率通常較高。",
    advice: [
      {
        title: "建立交易冷靜期",
        subtitle: "對抗衝動",
        content: "當您想買入某檔熱門股時，規定自己必須「等待 24 小時」再下單。避免被市場情緒與 FOMO 綁架。"
      },
      {
        title: "核心衛星分離",
        subtitle: "保護資產",
        content: "開設兩個帳戶。80% 的資金交給「機器人理財」或「定期定額」鎖死；只留 20% 的資金讓您自由操作，虧完即止，不可加碼。"
      }
    ],
    allocation: [
      { name: '指數基金 (鎖定)', value: 80, color: '#5CB85C' },
      { name: '趨勢題材股 (博弈)', value: 20, color: '#F0AD4E' },
    ]
  },
  guardian: {
    title: "穩健守護者 (The Guardian)",
    icon: "shield_lock",
    tags: ["穩健保守", "風險趨避", "紀律執行"],
    description: "您是謹慎的規劃者，重視財富的保值勝過增值。您對市場運作有一定了解，也看得懂財報與趨勢，但您的性格讓您不願承擔資產大幅回撤的痛苦。您傾向尋求確定性高的收益，如股息或債息。",
    advice: [
      {
        title: "重新定義風險",
        subtitle: "對抗通膨",
        content: "請認知到「不投資」本身就是一種風險（購買力下降風險）。適度持有成長型資產是為了保護您的實質購買力。"
      },
      {
        title: "目標導向投資",
        subtitle: "專注長期",
        content: "將投資目標具象化（如：為了 10 年後的退休金），這能幫助您忍受中短期的市場波動，專注於長期目標而非短期損益。"
      }
    ],
    allocation: [
      { name: '高股息/債券 (核心)', value: 60, color: '#6D8AA6' },
      { name: '低波動股票 (衛星)', value: 40, color: '#5CB85C' },
    ]
  },
  preserver: {
    title: "審慎避險者 (The Preserver)",
    icon: "savings",
    tags: ["極度保守", "焦慮不安", "依賴專家"],
    description: "您對投資感到焦慮與不安，市場的一點風吹草動都會讓您緊張。您可能曾經受過傷，或者認為股市就是賭場。您最常做的決定是「觀望」或「將錢存在銀行」。您極度依賴專家的保證，且對於負面消息非常敏感。",
    advice: [
      {
        title: "外包投資決策",
        subtitle: "眼不見為淨",
        content: "坦白說，您最適合將投資全權委託給專業經理人或信託，並減少查看帳戶的頻率（例如每季一次），以減少心理負擔。"
      },
      {
        title: "極度分散配置",
        subtitle: "降低焦慮",
        content: "使用全天候資產配置 (All-Weather Portfolio) 或股債平衡基金，確保在任何市場環境下波動都能控制在您能承受的範圍。"
      }
    ],
    allocation: [
      { name: '全球平衡基金', value: 90, color: '#6D8AA6' },
      { name: '現金/定存', value: 10, color: '#CED4DA' },
    ]
  }
};

export const ResultPage: React.FC<ResultPageProps> = ({ onRetake, result }) => {
  const content = PERSONA_CONTENT[result.persona];
  const dominantBiasInfo = BIAS_MAP[result.dominantBias.type];
  const [isDownloading, setIsDownloading] = useState(false);

  // Map biases for Chart (Top 5 or All) - Added safety checks (|| 0)
  const radarData = [
    { subject: '損失趨避', A: result.biases.lossAversion || 0 },
    { subject: '羊群效應', A: result.biases.herding || 0 },
    { subject: '後悔偏誤', A: result.biases.regret || 0 },
    { subject: '過度自信', A: result.biases.overconfidence || 0 },
    { subject: '錨定效應', A: result.biases.anchoring || 0 },
    { subject: '沈沒成本', A: result.biases.sunkCost || 0 },
    { subject: '代表性', A: result.biases.representativeness || 0 },
  ];

  const handleDownload = async () => {
    setIsDownloading(true);
    // Simulate loading state
    await new Promise(resolve => setTimeout(resolve, 500));

    const element = document.getElementById('result-content');
    if (element) {
      const isDark = document.documentElement.classList.contains('dark');
      const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW" class="${isDark ? 'dark' : ''}">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI 投資行為診斷報告 - ${content.title}</title>
    <link href="https://fonts.googleapis.com" rel="preconnect" />
    <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect" />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "primary": "#324f6c",
              "primary-dark": "#253b52",
              "primary-light": "#6D8AA6",
              "success": "#5CB85C",
              "neutral": "#CED4DA",
              "background-light": "#f9fafb",
              "background-dark": "#1b212d",
              "surface-light": "#ffffff",
              "surface-dark": "#242c38",
              "slate-900": "#111827",
              "slate-500": "#6b7280",
            },
            fontFamily: {
              "display": ["Manrope", "sans-serif"],
              "body": ["Manrope", "sans-serif"],
            },
            boxShadow: {
              'soft': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
              'glow': '0 0 20px rgba(50, 79, 108, 0.15)',
            }
          }
        }
      }
    </script>
</head>
<body class="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white p-4 md:p-8 font-display">
    <div class="max-w-7xl mx-auto">
        <div class="mb-8 text-center">
             <div class="inline-flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-primary dark:text-white text-3xl">analytics</span>
                <h1 class="text-2xl font-bold">AI 投資行為診斷報告</h1>
             </div>
             <p class="text-slate-500">生成日期: ${new Date().toLocaleDateString()}</p>
        </div>
        ${element.innerHTML}
        <div class="mt-12 text-center border-t border-gray-200 dark:border-gray-700 pt-6">
            <p class="text-sm text-slate-400 font-bold">Powered by AI Investor Lab</p>
            <p class="text-xs text-slate-400 mt-1">此報告由 AI 生成，僅供參考，不構成投資建議。</p>
        </div>
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `investment-dna-${result.persona}-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    setIsDownloading(false);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#111417] dark:text-gray-100 min-h-screen flex flex-col overflow-x-hidden transition-colors duration-300 font-sans">

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface-light/80 dark:bg-surface-dark/80 border-b border-[#eaedf0] dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary dark:text-white">
            <div className="p-2 bg-primary/10 dark:bg-white/10 rounded-lg">
              <span className="material-symbols-outlined text-primary dark:text-white">analytics</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">AI 投資行為診斷</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-slate-600 dark:text-slate-300 text-sm font-bold transition-all"
            >
              {isDownloading ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">download</span>
              )}
              <span>保存報告 (HTML)</span>
            </button>

            <button
              onClick={onRetake}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-[#263e55] text-white text-sm font-bold transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              重新測驗
            </button>
            <div className="h-10 w-10 rounded-full bg-gray-200 bg-cover bg-center border-2 border-white dark:border-gray-600 shadow-sm cursor-pointer"
              style={{ backgroundImage: `url('https://picsum.photos/id/1005/100/100')` }}>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - ID Added for Screenshot */}
      <main id="result-content" className="relative flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">

          {/* 1. Hero / Persona Card (Full Width) */}
          <div className="col-span-1 md:col-span-12 relative overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-soft border border-gray-100 dark:border-gray-700 group transition-all hover:shadow-lg">

            {/* Abstract Background Gradient Decoration */}
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-50 to-transparent dark:from-primary/10 dark:to-transparent opacity-60"></div>

            <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Icon / Visual */}
              <div className="flex-shrink-0 relative">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-6xl md:text-7xl text-primary dark:text-blue-400 drop-shadow-sm">{content.icon}</span>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-white dark:bg-gray-800 p-2 rounded-full shadow-md border border-gray-100 dark:border-gray-600">
                  <span className="material-symbols-outlined text-success">verified_user</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col gap-4 text-center md:text-left z-10">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-[#111417] dark:text-white tracking-tight">{content.title}</h2>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mx-auto md:mx-0">
                    <span className="material-symbols-outlined text-primary dark:text-blue-300 text-sm">psychology</span>
                    <span className="text-primary dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                      {result.scores.logic > 0 ? '高理性決策' : '高情緒驅動'}
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-300 text-lg leading-relaxed max-w-2xl">
                  {content.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                  {content.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Bias Radar (Half Width) */}
          <div className="col-span-1 md:col-span-6 lg:col-span-5 flex flex-col rounded-2xl bg-surface-light dark:bg-surface-dark shadow-soft border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#111417] dark:text-white">行為偏誤雷達</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">影響您決策的潛在心理因素</p>
              </div>
              <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400">
                <span className="material-symbols-outlined text-xl">radar</span>
              </div>
            </div>

            <div className="flex-grow flex items-center justify-center relative h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar
                    name="偏誤強度"
                    dataKey="A"
                    stroke="#324f6c"
                    fill="#324f6c"
                    fillOpacity={0.4}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Deep Diagnosis / Mechanism Analysis */}
          <div className="col-span-1 md:col-span-6 lg:col-span-7 flex flex-col rounded-2xl bg-surface-light dark:bg-surface-dark shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 md:p-8 flex-grow flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${result.dominantBias.category === 'Emotional' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                  <span className="material-symbols-outlined">
                    {result.dominantBias.category === 'Emotional' ? 'mood_bad' : 'psychology_alt'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#111417] dark:text-white">核心偏誤診斷</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    主導您決策的 <span className="font-bold">{dominantBiasInfo.name}</span> 屬於
                    <span className={`ml-1 font-bold ${result.dominantBias.category === 'Emotional' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {result.dominantBias.category === 'Emotional' ? '情緒偏誤 (Emotional)' : '認知偏誤 (Cognitive)'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700 mb-5">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                  {result.dominantBias.category === 'Emotional'
                    ? "此類偏誤源於人類演化的心理本能（如恐懼與貪婪），難以透過單純學習消除。建議採用「行為制約」策略，依靠外部機制來管理衝動。"
                    : "此類偏誤源於資訊處理或邏輯推論的捷思（Heuristics），通常是因為資訊不足或錯誤解讀。建議採用「再教育」策略，透過學習與工具來修正認知模型。"
                  }
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">專家處方</h4>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-success mt-0.5">check_circle</span>
                  <p className="text-base font-bold text-[#111417] dark:text-white">
                    {dominantBiasInfo.fix}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Strategy / Asset Allocation (Half Width) */}
          <div className="col-span-1 md:col-span-6 lg:col-span-5 flex flex-col rounded-2xl bg-surface-light dark:bg-surface-dark shadow-soft border border-gray-100 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#111417] dark:text-white">建議資產配置</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">適合您心理素質的投資組合</p>
              </div>
              <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400">
                <span className="material-symbols-outlined text-xl">pie_chart</span>
              </div>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center gap-6">
              <div className="relative w-48 h-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={content.allocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {content.allocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-2 w-full">
                {content.allocation.map((item) => (
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
          </div>

          {/* 5. Actionable Advice (Half Width / Accordion) */}
          <div className="col-span-1 md:col-span-6 lg:col-span-7 rounded-2xl bg-surface-light dark:bg-surface-dark shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-xl font-bold text-[#111417] dark:text-white">行動指南</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">針對「{content.title}」的具體優化步驟</p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 flex-grow">
              {content.advice.map((item, idx) => (
                <AdviceItem
                  key={idx}
                  icon={idx === 0 ? "psychology_alt" : "balance"}
                  colorClass={idx === 0 ? "text-primary dark:text-blue-300" : "text-purple-700 dark:text-purple-300"}
                  bgClass={idx === 0 ? "bg-blue-100 dark:bg-blue-900/40" : "bg-purple-100 dark:bg-purple-900/40"}
                  title={item.title}
                  subtitle={item.subtitle}
                  isOpenDefault={true}
                >
                  <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed font-medium">
                    {item.content}
                  </p>
                </AdviceItem>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const AdviceItem: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  bgClass: string;
  colorClass: string;
  isOpenDefault?: boolean;
}> = ({ icon, title, subtitle, children, bgClass, colorClass, isOpenDefault = false }) => {
  const [isOpen, setIsOpen] = React.useState(isOpenDefault);

  return (
    <div className="group">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgClass} ${colorClass}`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{subtitle}</p>
          </div>
        </div>
        <span className={`material-symbols-outlined text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
      </div>

      {isOpen && (
        <div className="px-5 pb-5 pt-0 ml-[4.5rem] animate-[sweep_0.3s_ease-in-out]">
          {children}
        </div>
      )}
    </div>
  );
};