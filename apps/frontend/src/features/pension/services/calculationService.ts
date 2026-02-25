import { UserInputs, SimulationResult, SimulationYear } from '../types';

// 全域常數設定
const SIMULATION_RUNS = 10000;
const LTC_MONTHLY_COST = 40000; // 長照預備金/月
const LTC_DURATION_YEARS = 8;   // 不健康餘命

// 輔助：產生常態分佈隨機數 (Box-Muller Transform)
// mean: 預期報酬率 (e.g., 0.05), stdDev: 標準差 (e.g., 0.10)
function generateGaussian(mean: number, stdDev: number): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + (z * stdDev);
}

// 輔助：計算支柱一 (社會保險) - 簡化版公式
const calculatePillar1Monthly = (inputs: UserInputs, projectedYears: number): number => {
    const { occupation, pillar1InsuredAmount } = inputs;
    const totalYears = inputs.pillar1Years + projectedYears;

    switch (occupation) {
        case 'labor': // 勞保 B式: 1.55%
            return pillar1InsuredAmount * totalYears * 0.0155;
        case 'civil': // 公保 (年金化率約 0.75% ~ 1.3%，取均值 1.1%)
        case 'teacher':
        case 'military':
            return pillar1InsuredAmount * totalYears * 0.011;
        case 'national': // 國保 A式
            return (19761 * 0.0065 * totalYears) + 4049;
        default: return 0;
    }
};

// 輔助：計算支柱二 (職業退休金) - 確定給付部分 (DB)
const calculatePillar2DBMonthly = (inputs: UserInputs, projectedYears: number): number => {
    const { occupation, currentSalary } = inputs;
    const totalYears = inputs.pillar1Years + projectedYears; // 假設年資相同

    switch (occupation) {
        case 'civil': { // 舊制/新制混合 (簡化估算：替代率法)
            // 假設所得替代率上限約 60%-70%，扣除公保後為月退
            // 這裡做一個保守估算：本俸 * 2 * 2% * 年資 (上限隨法規變動)
            const base = currentSalary * 2;
            return Math.min(base * totalYears * 0.02, base * 0.6);
        }
        case 'military': { // 終身俸 (俸率 55% + 2% * (年資-20))
            const baseRate = 0.55 + Math.max(0, totalYears - 20) * 0.02;
            return (currentSalary * 2) * Math.min(baseRate, 0.95);
        }
        default: return 0; // 勞工、私校主要為 DC 制
    }
};

export const calculatePensionGap = (inputs: UserInputs): SimulationResult => {
    const {
        currentAge, retirementAge, lifeExpectancy,
        currentPersonalAssets, monthlyPersonalSavings,
        pillar2Accumulated, pillar2RateEmployer, pillar2RatePersonal, currentSalary,
        inflationRate, targetMonthlyExpense,
        hasCommercialInsurance,
        personalReturnRate, personalStdDev,
        pillar2ReturnRate, pillar2StdDev
    } = inputs;

    const yearsToRetire = Math.max(0, retirementAge - currentAge);
    const yearsInRetirement = Math.max(0, lifeExpectancy - retirementAge);

    // 1. 準備基礎參數
    const rPersonalMean = personalReturnRate / 100;
    const rPersonalStd = personalStdDev / 100;
    const rPillar2Mean = pillar2ReturnRate / 100;
    const rPillar2Std = pillar2StdDev / 100;
    const rInflation = inflationRate / 100;

    // 確定給付 (DB) 是固定的，不隨市場波動 (但會隨通膨調整購買力，這裡簡化為名目金額固定，實質購買力下降)
    const monthlyPillar1 = calculatePillar1Monthly(inputs, yearsToRetire);
    const monthlyPillar2DB = calculatePillar2DBMonthly(inputs, yearsToRetire);
    const monthlyFixedIncome = monthlyPillar1 + monthlyPillar2DB + inputs.otherFixedIncome;

    // 長照風險成本 (若無保險，在最後8年加入支出)
    const ltcStartAge = lifeExpectancy - LTC_DURATION_YEARS;

    // 蒙地卡羅模擬矩陣 [run][year]
    const simulations: number[][] = [];
    let successCount = 0;

    // 開始模擬
    for (let run = 0; run < SIMULATION_RUNS; run++) {
        let personalAssets = currentPersonalAssets;
        // 勞退/私校退撫專戶 (DC制)
        let pillar2DCAssets = (inputs.occupation === 'labor' || inputs.occupation === 'teacher')
            ? pillar2Accumulated : 0;

        const trajectory: number[] = [];

        // 逐年模擬 (從現在直到預期壽命)
        for (let age = currentAge; age <= lifeExpectancy; age++) {
            const isRetired = age >= retirementAge;
            const yearIndex = age - currentAge;

            // 通膨調整因子
            const inflationFactor = Math.pow(1 + rInflation, yearIndex);

            // 產生隨機報酬率
            const marketReturn = generateGaussian(rPersonalMean, rPersonalStd);
            const fundReturn = generateGaussian(rPillar2Mean, rPillar2Std);

            // === 資產增長/提領邏輯 ===

            if (!isRetired) {
                // 累積期 (Accumulation)
                // 1. 個人資產成長
                personalAssets = personalAssets * (1 + marketReturn) + (monthlyPersonalSavings * 12);

                // 2. 職業退休金(DC)成長 (僅勞工/私校/公教112)
                if (inputs.occupation === 'labor' || inputs.occupation === 'teacher') {
                    const monthlyContribution = currentSalary * ((pillar2RateEmployer + pillar2RatePersonal) / 100);
                    pillar2DCAssets = pillar2DCAssets * (1 + fundReturn) + (monthlyContribution * 12);
                }

            } else {
                // 提領期 (Decumulation)

                // 計算當年支出
                let annualExpense = targetMonthlyExpense * 12 * inflationFactor;

                // 加上長照風險 (若無保險且進入不健康年份)
                if (!hasCommercialInsurance && age >= ltcStartAge) {
                    annualExpense += LTC_MONTHLY_COST * 12 * inflationFactor;
                }

                // 計算當年固定收入 (支柱1 + 支柱2DB + 其他)
                // 假設固定收入隨通膨調整 (部分年金有抗通膨機制，這裡簡化假設)
                const annualFixedIncome = monthlyFixedIncome * 12 * inflationFactor;

                // 計算支柱2 DC (勞退) 的月領金額 (依平均餘命攤提，類似年金化)
                // 這裡假設 DC 專戶繼續投資，並每年重新計算可領金額
                let annualPillar2DC = 0;
                if (pillar2DCAssets > 0) {
                    const remainingYears = Math.max(1, lifeExpectancy - age);
                    // 簡易攤提 (本金/餘命) + 收益。這裡簡化為當年提領部分
                    // 實務上勞退是算好月退金後固定發放，或一次領。這裡假設分期領。
                    annualPillar2DC = pillar2DCAssets / remainingYears;
                    // 剩餘資金繼續滾動
                    pillar2DCAssets = (pillar2DCAssets - annualPillar2DC) * (1 + fundReturn);
                    if (pillar2DCAssets < 0) pillar2DCAssets = 0;
                }

                // 計算淨缺口
                const totalIncome = annualFixedIncome + annualPillar2DC;
                const gap = annualExpense - totalIncome;

                // 若有缺口，從個人資產提領
                if (gap > 0) {
                    personalAssets = personalAssets * (1 + marketReturn) - gap;
                } else {
                    // 若有盈餘，存入個人資產
                    personalAssets = personalAssets * (1 + marketReturn) + Math.abs(gap);
                }
            }

            trajectory.push(personalAssets);
        }

        // 判斷此路徑是否成功 (終老時資產 > 0)
        if (personalAssets > 0) successCount++;
        simulations.push(trajectory);
    }

    // === 統計分析 (Percentiles) ===
    const totalYears = lifeExpectancy - currentAge + 1;
    const resultTrajectory: SimulationYear[] = [];

    for (let t = 0; t < totalYears; t++) {
        // 取得該年度所有模擬的資產值並排序
        const yearValues = simulations.map(run => run[t]).sort((a, b) => a - b);

        const p10 = yearValues[Math.floor(SIMULATION_RUNS * 0.1)]; // 悲觀
        const p50 = yearValues[Math.floor(SIMULATION_RUNS * 0.5)]; // 中位數
        const p90 = yearValues[Math.floor(SIMULATION_RUNS * 0.9)]; // 樂觀

        // 計算現金流缺口 (這裡用簡單的靜態算式示意現值)
        // 實務上應紀錄每條路徑的缺口再平均，這裡簡化顯示趨勢
        const currentAgeInLoop = currentAge + t;
        const isRetired = currentAgeInLoop >= retirementAge;

        resultTrajectory.push({
            age: currentAgeInLoop,
            p10, p50, p90,
            cashFlowGap: isRetired ? -1 : 0 // 示意用，前端可依 P50 重算
        });
    }

    // 計算中位數資產耗盡年齡
    // 邏輯：找到 p50 曲線何時 < 0
    const depletionAgeP50 = resultTrajectory.find(y => y.p50 < 0)?.age || (lifeExpectancy + 1);
    const depletionAgeP10 = resultTrajectory.find(y => y.p10 < 0)?.age || (lifeExpectancy + 1);

    // 總缺口 (基於 P50 的終值折現回現值) - 簡易版
    const finalBalanceP50 = resultTrajectory[resultTrajectory.length - 1].p50;
    const totalGapPV = finalBalanceP50 < 0
        ? Math.abs(finalBalanceP50) / Math.pow(1 + rPersonalMean, yearsToRetire) // 粗略折現
        : 0;

    // 現金流分析 (月/現值) - 用於儀表板顯示
    // 這裡顯示的是「退休第一年」的狀況 (現值)
    const monthlyPillar2DCEstimate = (inputs.occupation === 'labor' || inputs.occupation === 'teacher')
        ? (pillar2Accumulated * Math.pow(1 + rPillar2Mean, yearsToRetire)) / (yearsInRetirement * 12) // 粗略估算未來價值再攤提
        : 0;

    // 將未來現金流折現回今日購買力
    const monthlyIncomePV = monthlyFixedIncome + (monthlyPillar2DCEstimate / Math.pow(1 + rInflation, yearsToRetire));

    return {
        successRate: (successCount / SIMULATION_RUNS) * 100,
        depletionAgeP50,
        depletionAgeP10,
        totalGapPV,
        monthlyExpensePV: targetMonthlyExpense, // 已經是輸入的現值
        monthlyIncomePV,
        monthlyGapPV: Math.max(0, targetMonthlyExpense - monthlyIncomePV),
        incomeBreakdown: {
            pillar1: monthlyPillar1,
            pillar2: monthlyPillar2DB + (monthlyPillar2DCEstimate / Math.pow(1 + rInflation, yearsToRetire)),
            pillar3: 0, // 由資產庫支付，不計入固定收入
            other: inputs.otherFixedIncome
        },
        trajectory: resultTrajectory
    };
};