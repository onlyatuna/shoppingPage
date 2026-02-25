import { UserInputs } from '@/features/pension/types';

export const OCCUPATION_LABELS: Record<string, string> = {
    labor: '勞工 (Labor)',
    civil: '公務人員 (Civil Servant)',
    teacher: '私校教職 (Private School)',
    military: '軍人 (Military)',
    national: '國民年金 (National Pension)',
};

export const NATIONAL_PENSION_AMOUNT = 19761; // 假設最高給付或平均值

export const DEFAULT_INPUTS: UserInputs = {
    // 1. 全域基本設定
    currentAge: 30,
    retirementAge: 65,
    lifeExpectancy: 90,
    targetMonthlyExpense: 40000,
    inflationRate: 2,

    // 2. 風險保障檢核
    hasCommercialInsurance: false,

    // 3. 職業身分與支柱設定
    occupation: 'labor',
    currentSalary: 50000,

    // 支柱一 (社會保險) 參數
    pillar1Years: 5,
    pillar1InsuredAmount: 45800,

    // 支柱二 (職業退休金) 參數
    pillar2Accumulated: 200000,
    pillar2RateEmployer: 6,
    pillar2RatePersonal: 0,
    pillar2ReturnRate: 3,
    pillar2StdDev: 5,

    // 支柱三 (個人準備)
    currentPersonalAssets: 100000,
    monthlyPersonalSavings: 5000,
    otherFixedIncome: 0,

    // 個人投資組合參數
    personalReturnRate: 5,
    personalStdDev: 10,
};

// Monte Carlo Simulation Config
export const SIMULATION_RUNS = 1000;