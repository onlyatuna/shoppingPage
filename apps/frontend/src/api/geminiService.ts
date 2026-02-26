import { GoogleGenAI, Type, Schema } from "@google/genai";

// 定義回應介面
export interface AnalysisResult {
    neuroMeter: {
        status: 'Rational' | 'Emotional' | 'Mixed';
        score: number;
        mechanism: string;
    };
    biases: Array<{
        name: string;
        severity: 'High' | 'Medium' | 'Low';
        pageRef: string;
    }>;
    actionPlan: {
        advisorMindset: string;
        actions: string[];
    };
    reframing: {
        traditional: string;
        behavioral: string;
        principle: string;
    };
}

// 定義回應架構 (Schema)
const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        neuroMeter: {
            type: Type.OBJECT,
            properties: {
                status: { type: Type.STRING, enum: ["Rational", "Emotional", "Mixed"] },
                score: { type: Type.NUMBER, description: "0 代表純感性/邊緣系統主導, 100 代表純理性/皮質主導" },
                mechanism: { type: Type.STRING, description: "結合神經科學的生理機制解釋（繁體中文）" }
            },
            required: ["status", "score", "mechanism"]
        },
        biases: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "嚴格對照知識庫的正式術語名稱" },
                    severity: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                    pageRef: { type: Type.STRING, description: "對應知識庫中的具體頁數引用，例如 'Page 12'" }
                },
                required: ["name", "severity", "pageRef"]
            }
        },
        actionPlan: {
            type: Type.OBJECT,
            properties: {
                advisorMindset: { type: Type.STRING, description: "給顧問的一句話心法建議，導向行為財務學視角" },
                actions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "具體可執行的推力策略步驟"
                }
            },
            required: ["advisorMindset", "actions"]
        },
        reframing: {
            type: Type.OBJECT,
            properties: {
                traditional: { type: Type.STRING, description: "傳統邏輯導向的說法（通常無效）" },
                behavioral: { type: Type.STRING, description: "重塑後的行為導航說法（針對客戶偏誤設計）" },
                principle: { type: Type.STRING, description: "背後運用的設計原理或理論基礎" }
            },
            required: ["traditional", "behavioral", "principle"]
        }
    },
    required: ["neuroMeter", "biases", "actionPlan", "reframing"]
};

// 💎 強制翻譯對照表
const BIAS_TRANSLATIONS: Record<string, string> = {
    "Loss Aversion": "損失厭惡",
    "Myopic Loss Aversion": "短視損失厭惡",
    "Anchoring": "錨點效應",
    "Availability Bias": "可得性啟發",
    "Confirmation Bias": "確認偏誤",
    "Disposition Effect": "處置效應",
    "Endowment Effect": "稟賦效應",
    "Familiarity Bias": "熟悉度偏誤",
    "Herding": "羊群效應",
    "Hindsight Bias": "後見之明",
    "House Money Effect": "賭資效應",
    "Illusion of Control": "控制錯覺",
    "Overconfidence": "過度自信",
    "Recency Bias": "近因偏誤",
    "Representativeness": "代表性偏誤",
    "Self-attribution Bias": "自我歸因",
    "Snake-bite Effect": "蛇咬效應",
    "Mental Accounting": "心理帳戶",
    "Sunk Cost Fallacy": "沈沒成本謬誤",
    "Status Quo Bias": "現狀偏差",
    "Framing Effect": "框架效應",
    "Regret Aversion": "後悔厭惡"
};

const SYSTEM_INSTRUCTION = `
你是由 ING/Lightbulb Press 出版的《An Advisor's Guide to Behavioral Finance》培訓的「AI 理財顧問行為決策導航儀」。你的使用者是專業的理財顧問。你的目標是協助顧問識別客戶的非理性行為，並利用行為財務學與神經經濟學原理，提供溝通框架與具體行動方案。

**Core Knowledge Base (必須嚴格遵守):**
1. **理論基礎**：熟練運用 Prospect Theory (展望理論), Heuristics (捷思法), Neuroeconomics (神經經濟學)。
2. **關鍵術語**：精確使用術語。在輸出時，必須引用括號內的頁碼作為 pageRef。
3. **解決方案**：參考 "Action Plans" 與 "Redefining Advice" 的策略。

**Tone & Style:**
專業且具指導性 (Prescriptive)，使用**繁體中文 (Traditional Chinese)**。
在 Reframing Script 中，**請勿使用特定人名或稱謂**，讓話術成為通用的句型。
`;

// ✅ 修改：接收 model 參數，預設為 gemini-2.5-flash
export const analyzeScenario = async (inputText: string, rawApiKey: string, model: string = "gemini-2.5-flash"): Promise<AnalysisResult> => {
    if (!rawApiKey) {
        throw new Error("API Key is missing.");
    }

    // 💡 Sanitization: Remove hidden whitespace, newlines, and non-ASCII characters from the API key
    // This prevents the "String contains non ISO-8859-1 code point" error in WebAuth/Headers
    const apiKey = rawApiKey.replace(/[^\x20-\x7E]/g, '').trim();

    // 初始化 Google Gen AI
    const genAI = new GoogleGenAI({ apiKey });

    try {
        const result = await genAI.models.generateContent({
            model: model, // ✅ 使用傳入的模型
            contents: [{ role: 'user', parts: [{ text: inputText }] }],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.3,
            }
        });

        const responseText = result.text;

        if (!responseText) {
            throw new Error("Gemini response is empty");
        }

        // 清理 Markdown 標記並解析 JSON
        const cleanJsonText = responseText.replace(/```json|```/g, "").trim();
        const resultData = JSON.parse(cleanJsonText);

        // Post-Processing: 強制補上中文翻譯
        if (resultData.biases) {
            resultData.biases = resultData.biases.map((b: { name: string; severity: string; pageRef: string }) => {
                let cleanName = b.name.split(' (')[0].trim();

                // 自動映射別名
                if (cleanName.match(/Get-even-itis/i)) cleanName = "Disposition Effect";
                if (cleanName.match(/FOMO/i)) cleanName = "Herding";

                // 查找中文翻譯
                const cnName = BIAS_TRANSLATIONS[cleanName];
                const finalName = cnName ? `${cleanName} (${cnName})` : cleanName;

                return { ...b, name: finalName };
            });
        }

        return resultData as AnalysisResult;
    } catch (error: any) {
        console.error("Behavioral Analysis Engine Failed:", error);

        if (error.message?.includes("429") || error.status === 429 || error.message?.includes("quota")) {
            throw new Error("QUOTA_EXCEEDED");
        }
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            throw new Error("MODEL_NOT_FOUND");
        }

        throw error;
    }
};