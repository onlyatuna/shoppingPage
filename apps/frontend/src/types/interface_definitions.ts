/**
 * ========================================
 * 核心 TypeScript 介面定義 (Unified)
 * ========================================
 */

// ========================================
// 1. 使用者與認證 (User & Authentication)
// ========================================

export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN' | 'DEVELOPER';
}

// ========================================
// 2. 電商產品系統 (E-commerce Product System)
// ========================================

export interface Category {
    _count: any;
    id: number;
    name: string;
    slug: string;
}

export interface ProductOption {
    id: string;
    name: string;
    values: string[];
}

export interface ProductVariant {
    id: string;
    price: number;
    salePrice?: number;
    isOnSale?: boolean;
    stock: number;
    image?: string;
    combination: Record<string, string>;
}

export interface Product {
    slug: string;
    id: number;
    name: string;
    price: number;
    salePrice?: number;
    isOnSale?: boolean;
    images: string[];
    description: string;
    stock: number;
    isActive: boolean;
    categoryId: number;
    category?: Category;
    options?: ProductOption[];
    variants?: ProductVariant[];
}

// ========================================
// 3. 購物車與訂單 (Cart & Orders)
// ========================================

export interface CartItem {
    id: number;
    quantity: number;
    variantId?: string;
    product: Product;
}

export interface Cart {
    id: number;
    items: CartItem[];
    totalAmount: number;
}

export interface OrderInput {
    recipient: string;
    phone: string;
    city: string;
    address: string;
    deliveryMethod: string;
    paymentMethod: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
    id: number;
    quantity: number;
    price: string;
    product: {
        name: string;
        images: string[];
    };
}

export interface Order {
    id: string;
    status: OrderStatus;
    totalAmount: string;
    createdAt: string;
    shippingInfo: any;
    items: OrderItem[];
    user?: {
        name: string | null;
        email: string;
    };
}

// ========================================
// 4. 診斷測驗系統 (Diagnosis Quiz System)
// ========================================

export type BiasType =
    | 'lossAversion'
    | 'herding'
    | 'regret'
    | 'overconfidence'
    | 'anchoring'
    | 'sunkCost'
    | 'representativeness';

export type BiasCategory = 'Emotional' | 'Cognitive';

export const BIAS_MAP: Record<BiasType, { name: string; category: BiasCategory; fix: string }> = {
    lossAversion: {
        name: '損失趨避',
        category: 'Emotional',
        fix: '設定自動停損單，減少看盤頻率，避免被短期波動嚇跑。'
    },
    herding: {
        name: '羊群效應',
        category: 'Emotional',
        fix: '建立獨立檢查清單 (Checklist)，遠離市場雜訊與論壇熱議。'
    },
    regret: {
        name: '後悔偏誤',
        category: 'Emotional',
        fix: '嚴格執行交易紀律，買定離手，不事後諸葛。'
    },
    overconfidence: {
        name: '過度自信',
        category: 'Emotional',
        fix: '強制資產分散，記錄交易日誌並定期回顧錯誤預測。'
    },
    sunkCost: {
        name: '沈沒成本謬誤',
        category: 'Emotional',
        fix: '忘記買入成本，只看當下價值。問自己：「若現在空手，我會買嗎？」'
    },
    anchoring: {
        name: '錨定效應',
        category: 'Cognitive',
        fix: '引入新資訊源，使用多種估值模型，不被過去價格綁架。'
    },
    representativeness: {
        name: '代表性捷思',
        category: 'Cognitive',
        fix: '擴大樣本數，研究基本面數據，區分隨機性與真實規律。'
    },
};

export interface DiagnosisResult {
    persona: 'guardian' | 'celebrity' | 'individualist' | 'preserver';
    scores: {
        risk: number;
        logic: number;
    };
    dominantBias: {
        type: BiasType;
        score: number;
        category: BiasCategory;
    };
    biases: Record<BiasType, number>;
}

// ========================================
// 5. 投資組合與行為分析 (Portfolio & Behavioral Analysis)
// ========================================

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

// ========================================
// 6. 圖片編輯器 - Frame 系統 (Image Editor - Frame System)
// ========================================

export interface Frame {
    id: string;
    name: string;
    preview: string;
    url: string;
    isCustom: boolean;
}

export const BUILT_IN_FRAMES: Frame[] = [
    {
        id: 'none',
        name: '無圖框',
        preview: '',
        url: '',
        isCustom: false
    },
    {
        id: 'classic-black',
        name: '經典黑框',
        preview: '/frames/classic-black.png',
        url: '/frames/classic-black.png',
        isCustom: false
    },
    {
        id: 'classic-white',
        name: '經典白框',
        preview: '/frames/classic-white.png',
        url: '/frames/classic-white.png',
        isCustom: false
    },
    {
        id: 'gold-elegant',
        name: '金色華麗',
        preview: '/frames/gold-elegant.png',
        url: '/frames/gold-elegant.png',
        isCustom: false
    }
];

// ========================================
// 7. 圖片編輯器 - Mockup 系統 (Image Editor - Mockup System)
// ========================================

export interface Mockup {
    id: string;
    type: 'scene';
    name: string;
    thumbnail: string;
    backgroundUrl: string;
    overlayUrl?: string;
    maskUrl?: string;
    category?: string;
    aiBlendPrompt?: string;
    placement?: {
        x: number;
        y: number;
        scale: number;
    };
}

export interface PrintableMockup {
    id: string;
    type: 'printable';
    name: string;
    thumbnail: string;
    blankObjectUrl: string;
    printableAreaMaskUrl?: string;
    aiPrintPrompt: string;
    category?: string;
    placement?: {
        x: number;
        y: number;
        scale: number;
        rotation?: number;
    };
}

export type UniversalMockup = Mockup | PrintableMockup;

export const MOCKUP_TEMPLATES: UniversalMockup[] = [
    {
        id: 'desk-wood-1',
        type: 'scene',
        name: '木質桌面',
        thumbnail: '/mockups/desk-wood-1/thumbnail.png',
        backgroundUrl: '/mockups/desk-wood-1/background.png',
        overlayUrl: '/mockups/desk-wood-1/overlay.png',
        category: 'desktop',
        aiBlendPrompt: 'Natural morning sunlight from the left, cast sharp diagonal contact shadows on the wooden surface to the right. Realistic wooden texture reflections. Warm and cozy atmosphere. Ensure the product feels grounded.'
    },
    {
        id: 'minimal-white-1',
        type: 'scene',
        name: '極簡白色',
        thumbnail: '/mockups/minimal-white-1/thumbnail.png',
        backgroundUrl: '/mockups/minimal-white-1/background.png',
        overlayUrl: '/mockups/minimal-white-1/overlay.png',
        category: 'minimal',
        aiBlendPrompt: 'Soft diffused studio lighting from top-left, creating gentle and smooth contact shadows beneath the product. Pure white marble surface with subtle reflections. Clean, bright, high-key photography style.'
    },
    {
        id: 'printable-mug-1',
        type: 'printable',
        name: '印刷馬克杯',
        thumbnail: '/mockups/printable/mug-1/thumbnail.png',
        blankObjectUrl: '/mockups/printable/mug-1/blank.png',
        printableAreaMaskUrl: '/mockups/printable/mug-1/mask.png',
        category: 'mug',
        aiPrintPrompt: 'The logo is printed on the ceramic mug surface, following the curve, with realistic glossy reflection and subtle ceramic texture. High precision printing.',
    },
    {
        id: 'printable-box-lid-base-1',
        type: 'printable',
        name: '白色天地蓋包裝盒',
        thumbnail: '/mockups/printable/box-lid-base-1/thumbnail.png',
        blankObjectUrl: '/mockups/printable/box-lid-base-1/blank.png',
        printableAreaMaskUrl: '/mockups/printable/box-lid-base-1/mask.png',
        category: 'packaging',
        aiPrintPrompt: 'The design is printed directly onto the top surface of the matte white cardboard lid. The print has a flat, non-glossy finish that integrates with the subtle paper texture, showing slight ink absorption under natural studio lighting.',
    },
];

// ========================================
// 8. 輔助類型 (Helper Types)
// ========================================

export interface QuizOption {
    label: string;
    weights: {
        risk: number;
        logic: number;
        bias?: BiasType;
        biasScore?: number;
    };
}

export interface QuizQuestion {
    id: number;
    text: string;
    options: QuizOption[];
}

// ========================================
// 9. API 相關類型 (API Related Types)
// ========================================

export interface GeminiModel {
    id: string;
    name: string;
}

export const AVAILABLE_GEMINI_MODELS: GeminiModel[] = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash Preview' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Paid Tier Only)' },
];

// ========================================
// 10. 客戶角色類型 (Client Persona Types)
// ========================================

export interface ClientPersona {
    id: number;
    name: string;
    tags: string;
    avatarColor: string;
    defaultScenario: string;
}

export const CLIENT_PERSONAS: ClientPersona[] = [
    {
        id: 1,
        name: '王先生 (Retiree)',
        tags: '55歲 / 退休規劃 / 保守型',
        avatarColor: 'bg-slate-100 text-slate-400',
        defaultScenario: '客戶看到昨晚美股大跌，加上 CPI 數據不佳，覺得非常恐慌，想要解約全部的退休金信託...'
    },
    {
        id: 2,
        name: '陳小姐 (Young Pro)',
        tags: '28歲 / 資產累積 / 積極型',
        avatarColor: 'bg-blue-50 text-blue-500',
        defaultScenario: '看到最近 AI 概念股大漲，覺得隔壁同事都賺翻了，想要解定存 All-in 買進科技股...'
    },
    {
        id: 3,
        name: '李醫師 (HNW)',
        tags: '45歲 / 稅務規劃 / 穩健型',
        avatarColor: 'bg-purple-50 text-purple-500',
        defaultScenario: '手上的傳產股虧損 30% 了，但我建議停損換股，他卻堅持要等到回本才肯賣，說不賣就不算賠...'
    }
];