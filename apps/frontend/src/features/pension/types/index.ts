export type Occupation = 'labor' | 'civil' | 'teacher' | 'military' | 'national';

// 擴充輸入介面以符合新規格
export interface UserInputs {
    // 1. 全域基本設定
    currentAge: number;
    retirementAge: number;
    lifeExpectancy: number; // 預設 90
    targetMonthlyExpense: number; // 現值
    inflationRate: number;

    // 2. 風險保障檢核
    hasCommercialInsurance: boolean; // 是否有足額醫療/長照險
    // 若為 false，後台自動加入長照預備金 (4萬/月 * 12 * 8年)

    // 3. 職業身分與支柱設定
    occupation: Occupation;

    // 共用薪資欄位 (依職業不同顯示不同 Label)
    currentSalary: number; // 勞工:全薪, 公教軍:本俸, 國保:無視

    // 支柱一 (社會保險) 參數
    pillar1Years: number; // 累計年資
    pillar1InsuredAmount: number; // 投保薪資/保俸

    // 支柱二 (職業退休金) 參數
    pillar2Accumulated: number; // 目前專戶累積金額 (勞退/私校/公教新制)
    pillar2RateEmployer: number; // 雇主/政府提撥率 (勞退6%)
    pillar2RatePersonal: number; // 個人自願提繳率 (0-6%)
    // [關鍵] 退休金基金投資參數
    pillar2ReturnRate: number;
    pillar2StdDev: number; // 標準差 (風險)

    // 支柱三 (個人準備)
    currentPersonalAssets: number; // 已累積資產 (排除自住房產)
    monthlyPersonalSavings: number; // 每月額外儲蓄
    otherFixedIncome: number; // 退休後其他固定收入 (房租/老農津貼)

    // [關鍵] 個人投資組合參數
    personalReturnRate: number;
    personalStdDev: number; // 標準差
}

// 模擬結果：包含機率分佈
export interface SimulationYear {
    age: number;
    p10: number; // 悲觀情境 (10th percentile)
    p50: number; // 中位數情境 (Median)
    p90: number; // 樂觀情境 (90th percentile)
    cashFlowGap: number; // 該年度現金流缺口 (現值)
}

export interface SimulationResult {
    // 核心指標
    successRate: number; // 成功機率 (0-100%)
    depletionAgeP50: number; // 中位數資產耗盡年齡
    depletionAgeP10: number; // 悲觀情境資產耗盡年齡
    totalGapPV: number; // 總缺口 (現值) - 基於 P50 或使用者選擇的信心水準

    // 現金流分析 (月/現值)
    monthlyExpensePV: number; // 目標生活費
    monthlyIncomePV: number; // 總收入
    monthlyGapPV: number; // 缺口

    // 收入來源拆解
    incomeBreakdown: {
        pillar1: number;
        pillar2: number;
        pillar3: number;
        other: number;
    };

    // 圖表數據
    trajectory: SimulationYear[];
}

export interface AdvisorResponse {
    suggestions: string[];
    analysis: string;
}