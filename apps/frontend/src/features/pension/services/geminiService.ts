import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { SimulationResult, UserInputs, AdvisorResponse } from '../types';

// ==========================================
// 1. Mock Data Generator (模擬資料生成器)
// ==========================================
const generateMockAdvice = (inputs: UserInputs, results: SimulationResult): AdvisorResponse => {
    const { successRate, depletionAgeP50, totalGapPV } = results;
    const { occupation, hasCommercialInsurance, personalStdDev } = inputs;

    let analysis = "";
    const suggestions: string[] = [];

    // --- Analysis Logic ---
    if (successRate >= 90) {
        analysis = `【演示數據】恭喜！根據 5,000 次蒙地卡羅模擬，您的退休計畫非常穩健（成功率 ${successRate.toFixed(1)}%）。即使在悲觀情境下（P10），資產仍足以支應至 ${results.depletionAgeP10} 歲。`;
    } else if (successRate >= 60) {
        analysis = `【演示數據】您的退休準備尚可（成功率 ${successRate.toFixed(1)}%），但存在變數。模擬顯示在中位數情境下，資產可能在 ${depletionAgeP50} 歲左右耗盡。`;
    } else {
        analysis = `【演示數據】警報！目前的規劃存在較大風險（成功率僅 ${successRate.toFixed(1)}%）。模擬顯示資產有極大機率在 ${depletionAgeP50} 歲前歸零，缺口現值約 $${Math.round(totalGapPV / 10000)} 萬。`;
    }

    // --- Suggestions Logic ---
    if (results.totalGapPV > 0) {
        suggestions.push(`【填補缺口】為彌補約 NT$${Math.round(results.totalGapPV).toLocaleString()} 的總缺口，建議利用「延後退休」或「增加每月定期定額」來換取複利空間。`);
    } else {
        suggestions.push(`【資產活化】資金充裕，建議將部分資產轉入「現金流資產」（如高股息ETF或債券），打造穩定的被動收入。`);
    }

    if (occupation === 'labor') {
        suggestions.push(`【勞退優化】強烈建議善用「勞退自提 6%」，除了享有稅賦優惠，更能強迫儲蓄並享有兩年定存利率的保證收益。`);
    } else if (occupation === 'civil' || occupation === 'teacher') {
        suggestions.push(`【風險分散】您的退休金高度依賴政府年金，建議額外配置「全球股票資產」以對沖單一國家與通膨風險。`);
    }

    if (!hasCommercialInsurance) {
        suggestions.push(`【長照缺口】系統偵測您未配置足額商業保險，已自動在晚年加入每月 4 萬元的長照預算。建議提早規劃「長照險」或「信託」。`);
    }

    if (personalStdDev > 15 && successRate < 80) {
        suggestions.push(`【波動管理】您的投資組合波動度偏高 (${personalStdDev}%)，導致模擬結果不穩定。建議隨年齡增長逐步降低權益類資產比重。`);
    }

    return {
        analysis,
        suggestions
    };
};

// ==========================================
// 2. Main Service Entry
// ==========================================
export const generateActionableAdvice = async (
    inputs: UserInputs,
    results: SimulationResult,
    apiKey?: string
): Promise<AdvisorResponse> => {
    // 💡 Sanitization: Remove hidden whitespace, newlines, and non-ASCII characters from the API key
    const sanitizedApiKey = apiKey?.replace(/[^\x20-\x7E]/g, '').trim() || '';

    // 1. 判斷是否為 Mock 模式
    const isMockMode = !sanitizedApiKey || sanitizedApiKey === '';

    // [Mode A] Mock Mode
    if (isMockMode) {
        console.log("🚀 Running in Demo Mode (Mock Engine)");
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(generateMockAdvice(inputs, results));
            }, 1500);
        });
    }

    // [Mode B] Live Mode (Real API)
    try {
        const genAI = new GoogleGenerativeAI(sanitizedApiKey);

        const modelId = "gemini-2.5-flash";

        console.log(`🔌 Connecting to Google AI... (Model: ${modelId})`);

        // 配置安全性設定，避免內容過濾器誤判
        const model = genAI.getGenerativeModel({
            model: modelId,
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ]
        });

        const prompt = `
      Act as a senior actuarial consultant and financial advisor in Taiwan. 
      Analyze the following retirement simulation data (Monte Carlo Method).

      Client Profile:
      - Occupation: ${inputs.occupation}
      - Age: ${inputs.currentAge}, Retire at: ${inputs.retirementAge}, Life Expectancy: ${inputs.lifeExpectancy}
      - Risk Profile: Portfolio StdDev ${inputs.personalStdDev}% (Expected Return ${inputs.personalReturnRate}%)
      - Insurance Coverage: ${inputs.hasCommercialInsurance ? "Sufficient" : "Insufficient (LTC risk added)"}

      Simulation Results (5,000 runs):
      - Success Probability: ${results.successRate.toFixed(1)}%
      - Depletion Age (Median P50): ${results.depletionAgeP50} years old
      - Total Funding Gap (PV): NT$${results.totalGapPV}
      
      Output strict JSON format ONLY:
      {
        "suggestions": ["Specific Action 1", "Specific Action 2", "Specific Action 3"],
        "analysis": "A professional summary (max 3 sentences) in Traditional Chinese."
      }
      
      Rules:
      - Language: Traditional Chinese (zh-TW).
      - Tone: Professional, Empathetic, Data-driven.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        console.log("✅ Gemini API Response received successfully");
        return JSON.parse(jsonString) as AdvisorResponse;

    } catch (error: any) {
        // 詳細錯誤診斷
        console.error("⚠️ Gemini API Error Details:", {
            message: error?.message || "Unknown error",
            status: error?.status || error?.response?.status,
            type: error?.constructor?.name,
            fullError: error
        });

        // 根據錯誤類型提供具體提示
        if (error?.message?.includes('API key')) {
            console.error("❌ API Key 錯誤：請檢查您的 Gemini API Key 是否正確");
        } else if (error?.message?.includes('model')) {
            console.error("❌ Model 錯誤：模型 ID 可能不存在或無權限存取");
        } else if (error?.status === 429) {
            console.error("❌ 配額超限：API 呼叫次數已達上限，請稍後再試");
        }

        console.warn("⚠️ Falling back to Mock Engine due to API error.");
        return generateMockAdvice(inputs, results);
    }
};