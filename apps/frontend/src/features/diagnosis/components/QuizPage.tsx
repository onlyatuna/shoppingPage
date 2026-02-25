import React, { useState } from 'react';

// --- Types ---
export type BiasType = 'lossAversion' | 'herding' | 'regret' | 'overconfidence' | 'anchoring' | 'sunkCost' | 'representativeness';
export type BiasCategory = 'Emotional' | 'Cognitive';

export const BIAS_MAP: Record<BiasType, { name: string; category: BiasCategory; fix: string }> = {
  lossAversion: { name: '損失趨避', category: 'Emotional', fix: '設定自動停損單，減少看盤頻率，避免被短期波動嚇跑。' },
  herding: { name: '羊群效應', category: 'Emotional', fix: '建立獨立檢查清單 (Checklist)，遠離市場雜訊與論壇熱議。' },
  regret: { name: '後悔偏誤', category: 'Emotional', fix: '嚴格執行交易紀律，買定離手，不事後諸葛。' },
  overconfidence: { name: '過度自信', category: 'Emotional', fix: '強制資產分散，記錄交易日誌並定期回顧錯誤預測。' },
  sunkCost: { name: '沈沒成本謬誤', category: 'Emotional', fix: '忘記買入成本，只看當下價值。問自己：「若現在空手，我會買嗎？」' },
  anchoring: { name: '錨定效應', category: 'Cognitive', fix: '引入新資訊源，使用多種估值模型，不被過去價格綁架。' },
  representativeness: { name: '代表性捷思', category: 'Cognitive', fix: '擴大樣本數，研究基本面數據，區分隨機性與真實規律。' },
};

export interface DiagnosisResult {
  persona: 'guardian' | 'celebrity' | 'individualist' | 'preserver';
  scores: {
    risk: number; // -20 to +20 roughly
    logic: number; // -20 to +20 roughly
  };
  dominantBias: {
    type: BiasType;
    score: number;
    category: BiasCategory;
  };
  biases: Record<BiasType, number>;
}

interface QuizPageProps {
  onComplete: (result: DiagnosisResult) => void;
  onExit: () => void;
}

interface Option {
  label: string;
  weights: {
    risk: number;  
    logic: number; 
    bias?: BiasType;
    biasScore?: number;
  };
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

// --- Question Database ---
const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "市場在一週內暴跌 20%，且新聞充斥著負面消息，你的直覺反應是？",
    options: [
      { 
        label: "立刻賣出止損，保留現金以免虧損擴大。", 
        weights: { risk: -2, logic: -1, bias: 'lossAversion', biasScore: 2 } 
      },
      { 
        label: "感到恐慌，但不知道該怎麼做，先按兵不動。", 
        weights: { risk: -1, logic: -2, bias: 'regret', biasScore: 2 }
      },
      { 
        label: "檢視基本面，若公司價值未變，視為加碼良機。", 
        weights: { risk: 2, logic: 2 } 
      },
    ]
  },
  {
    id: 2,
    text: "你發現身邊的朋友都在討論某檔「熱門飆股」，且該股過去一個月漲了 50%，你會？",
    options: [
      { 
        label: "擔心錯過行情 (FOMO)，決定跟進買入一點。", 
        weights: { risk: 1, logic: -2, bias: 'herding', biasScore: 2 } 
      },
      { 
        label: "覺得漲太多了，可能會回調，決定觀望。", 
        weights: { risk: -1, logic: 1 } 
      },
      { 
        label: "研究該公司的財報，若估值過高則果斷放棄或放空。", 
        weights: { risk: 3, logic: 2, bias: 'overconfidence', biasScore: 1 } 
      },
    ]
  },
  {
    id: 3,
    text: "你買入的一檔股票目前虧損 15%，但你當初買進的理由似乎已經消失，你會？",
    options: [
      { 
        label: "繼續持有，期待它有一天會漲回成本價才賣。", 
        weights: { risk: -1, logic: -2, bias: 'lossAversion', biasScore: 2 } 
      },
      { 
        label: "承認錯誤，果斷賣出並將資金轉移到更有潛力的標的。", 
        weights: { risk: 1, logic: 2 } 
      },
      { 
        label: "加碼攤平，降低平均成本。", 
        weights: { risk: 2, logic: -2, bias: 'sunkCost', biasScore: 3 } 
      },
    ]
  },
  {
    id: 4,
    text: "對於自己的投資決策能力，你如何評價？",
    options: [
      { 
        label: "我通常能比市場大眾更早發現機會，勝率很高。", 
        weights: { risk: 2, logic: -1, bias: 'overconfidence', biasScore: 3 } 
      },
      { 
        label: "我依賴專家的建議或跟隨大盤指數，不認為自己能戰勝市場。", 
        weights: { risk: -1, logic: 1 } 
      },
      { 
        label: "我有時會賺錢，但大多數時候是運氣好。", 
        weights: { risk: 0, logic: 0, bias: 'overconfidence', biasScore: -1 } 
      },
    ]
  },
  {
    id: 5,
    text: "如果有一筆 100 萬元的意外之財，你會如何分配？",
    options: [
      { 
        label: "全部存入定存或購買儲蓄險，保本最重要。", 
        weights: { risk: -3, logic: -1, bias: 'lossAversion', biasScore: 1 } 
      },
      { 
        label: "一半買穩健的 ETF，一半拿去買個股或加密貨幣。", 
        weights: { risk: 1, logic: 1 } 
      },
      { 
        label: "全部投入高成長的科技股或新興市場，追求翻倍。", 
        weights: { risk: 3, logic: -1, bias: 'overconfidence', biasScore: 1 } 
      },
    ]
  },
  {
    id: 6,
    text: "當你看到一則新聞標題寫著「分析師預測明年股市將崩盤」，你會？",
    options: [
      { 
        label: "非常焦慮，開始考慮是否要清空持股。", 
        weights: { risk: -2, logic: -2, bias: 'anchoring', biasScore: 2 } 
      },
      { 
        label: "尋找其他數據或相反的觀點來驗證這個說法。", 
        weights: { risk: 0, logic: 2, bias: 'anchoring', biasScore: -2 } 
      },
      { 
        label: "完全不理會，認為分析師通常都是錯的。", 
        weights: { risk: 1, logic: 0 } 
      },
    ]
  },
  {
    id: 7,
    text: "你的投資組合中，有一檔股票獲利了 30%，你會怎麼做？",
    options: [
      { 
        label: "立刻獲利了結，落袋為安。", 
        weights: { risk: -1, logic: -1, bias: 'regret', biasScore: 2 } 
      },
      { 
        label: "設好移動停利點，讓獲利奔跑。", 
        weights: { risk: 1, logic: 2 } 
      },
      { 
        label: "覺得它還會漲一倍，繼續持有甚至加碼。", 
        weights: { risk: 3, logic: -1, bias: 'overconfidence', biasScore: 1 } 
      },
    ]
  },
  {
    id: 8,
    text: "在做投資決策時，你最常參考的資訊來源是？",
    options: [
      { 
        label: "財經新聞頭條、網紅或親友的推薦。", 
        weights: { risk: 1, logic: -2, bias: 'herding', biasScore: 2 } 
      },
      { 
        label: "公司的財務報表、產業分析報告。", 
        weights: { risk: 0, logic: 2 } 
      },
      { 
        label: "股價過去的走勢圖 (技術線型)，尋找規律。", 
        weights: { risk: 1, logic: -1, bias: 'representativeness', biasScore: 2 }
      },
    ]
  },
  {
    id: 9,
    text: "回想一次你投資虧損的經驗，你認為主要原因是？",
    options: [
      { 
        label: "大環境不好，或是被主力大戶坑殺。", 
        weights: { risk: 0, logic: -2, bias: 'overconfidence', biasScore: 2 } 
      },
      { 
        label: "我自己研究不夠透徹，或是情緒控管不佳。", 
        weights: { risk: 0, logic: 2, bias: 'overconfidence', biasScore: -2 } 
      },
      { 
        label: "運氣不好，下次運氣好就會賺回來。", 
        weights: { risk: 2, logic: -2, bias: 'regret', biasScore: 1 } 
      },
    ]
  },
  {
    id: 10,
    text: "若要你將 80% 的資產投入同一檔標的，你敢投入哪一類？",
    options: [
      { 
        label: "銀行定存或美國公債。", 
        weights: { risk: -3, logic: 1 } 
      },
      { 
        label: "全球分散的股票 ETF (如 VT)。", 
        weights: { risk: 0, logic: 2 } 
      },
      { 
        label: "比特幣或單一成長股 (如 Tesla)。", 
        weights: { risk: 3, logic: -2, bias: 'overconfidence', biasScore: 2 } 
      },
    ]
  },
];

export const QuizPage: React.FC<QuizPageProps> = ({ onComplete, onExit }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [accumulatedStats, setAccumulatedStats] = useState({
    risk: 0,
    logic: 0,
    biases: {
      lossAversion: 0,
      herding: 0,
      regret: 0,
      overconfidence: 0,
      anchoring: 0,
      sunkCost: 0,
      representativeness: 0,
    } as Record<BiasType, number>
  });
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const question = QUESTIONS[currentQuestionIdx];
  const progress = ((currentQuestionIdx + 1) / QUESTIONS.length) * 100;

  const handleNext = () => {
    if (!selectedOption) return;

    // Update stats
    const newStats = { ...accumulatedStats };
    newStats.risk += selectedOption.weights.risk;
    newStats.logic += selectedOption.weights.logic;
    
    if (selectedOption.weights.bias && selectedOption.weights.biasScore) {
      newStats.biases[selectedOption.weights.bias] += selectedOption.weights.biasScore;
    }

    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setAccumulatedStats(newStats);
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedOption(null);
    } else {
      calculateResult(newStats);
    }
  };

  const calculateResult = (finalStats: typeof accumulatedStats) => {
    // Quadrant Analysis
    let persona: DiagnosisResult['persona'] = 'guardian';

    if (finalStats.risk > 0) {
      // High Risk
      if (finalStats.logic > 0) {
        persona = 'individualist'; // High Risk + Rational
      } else {
        persona = 'celebrity'; // High Risk + Emotional (Follower)
      }
    } else {
      // Low Risk
      if (finalStats.logic > 0) {
        persona = 'guardian'; // Low Risk + Rational
      } else {
        persona = 'preserver'; // Low Risk + Emotional (Anxious Preserver)
      }
    }

    // Dominant Bias
    let maxBiasScore = -1;
    let dominantBiasType: BiasType = 'lossAversion'; // default

    (Object.keys(finalStats.biases) as BiasType[]).forEach(bias => {
      if (finalStats.biases[bias] > maxBiasScore) {
        maxBiasScore = finalStats.biases[bias];
        dominantBiasType = bias;
      }
    });

    onComplete({
      persona,
      scores: {
        risk: finalStats.risk,
        logic: finalStats.logic,
      },
      dominantBias: {
        type: dominantBiasType,
        score: maxBiasScore,
        category: BIAS_MAP[dominantBiasType].category
      },
      biases: finalStats.biases
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background-light dark:bg-background-dark font-display font-sans">
       {/* Background Pattern */}
      <div 
        className="fixed inset-0 -z-10 h-full w-full opacity-40 dark:opacity-20 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      ></div>

      {/* Top Navigation */}
      <header className="flex items-center justify-between px-6 py-5 md:px-12 lg:px-20 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-white/10 dark:text-white">
            <span className="material-symbols-outlined text-[24px]">insights</span>
          </div>
          <h1 className="hidden text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:block">
            AI 投資行為診斷
          </h1>
        </div>
        <button 
          onClick={onExit}
          className="group flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:bg-surface-dark dark:border-slate-700 dark:text-slate-400 dark:hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-4 sm:px-6">
        <div className="w-full max-w-3xl">
          
          {/* Progress Indicator */}
          <div className="mb-6 flex flex-col gap-2 px-2 animate-fade-in-up">
            <div className="flex justify-between text-sm font-semibold text-slate-500 dark:text-slate-400">
              <span>問題 {currentQuestionIdx + 1} / {QUESTIONS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Quiz Card */}
          <div 
            key={currentQuestionIdx}
            className="relative overflow-hidden rounded-2xl bg-surface-light p-6 shadow-soft dark:bg-surface-dark dark:shadow-none dark:ring-1 dark:ring-white/10 sm:p-10 md:p-12 animate-fade-in-up"
          >
            {/* Decorative background element */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col gap-8">
              {/* Question */}
              <div className="space-y-4">
                <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl md:text-[32px]">
                  {question.text}
                </h2>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-4">
                {question.options.map((option, idx) => {
                  const isSelected = selectedOption?.label === option.label;
                  return (
                    <label 
                      key={idx}
                      onClick={() => setSelectedOption(option)}
                      className={`group relative flex cursor-pointer items-center gap-5 rounded-xl border-2 p-5 transition-all duration-200
                        ${isSelected 
                          ? 'border-primary bg-primary/10 shadow-glow ring-1 ring-primary dark:bg-primary/20 dark:border-primary dark:ring-primary' 
                          : 'border-slate-200 bg-white hover:border-primary/50 hover:bg-slate-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                        }
                      `}
                    >
                      <input 
                        type="radio" 
                        name="answer" 
                        checked={isSelected}
                        onChange={() => {}}
                        className="sr-only" 
                      />
                      <div 
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200
                          ${isSelected 
                            ? 'border-primary bg-primary text-white scale-110 dark:border-primary dark:bg-primary' 
                            : 'border-slate-300 bg-transparent group-hover:border-primary/50 dark:border-slate-600'
                          }
                        `}
                      >
                        {isSelected ? (
                          <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        ) : (
                          <div className="h-2.5 w-2.5 rounded-full bg-primary opacity-0 transition-opacity"></div>
                        )}
                      </div>
                      <span className={`text-lg font-medium transition-colors ${isSelected ? 'text-primary font-bold dark:text-white' : 'text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white'}`}>
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-6 dark:border-slate-700/50">
                <button 
                  onClick={handleNext}
                  disabled={!selectedOption}
                  className={`flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all 
                    ${selectedOption 
                      ? 'bg-primary shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98]' 
                      : 'bg-slate-300 cursor-not-allowed dark:bg-slate-700'
                    }`}
                >
                  <span>{currentQuestionIdx === QUESTIONS.length - 1 ? '查看診斷結果' : '下一題'}</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};