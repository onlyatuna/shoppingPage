// Mockup 场景数据结构
// 用于商品图片合成到预设场景中

export interface Mockup {
    id: string;                // 唯一标识符
    type: 'scene';             // [NEW] 類型：場景合成
    name: string;              // 显示名称（如：「木质桌面」）
    thumbnail: string;         // 预览图路径
    backgroundUrl: string;     // 背景图（在商品下方）
    overlayUrl?: string;       // 前景图（在商品上方，带透明度）
    maskUrl?: string;          // 可选：限制商品显示区域的遮罩图
    category?: string;         // 分类：desktop, mobile, mug, etc.

    // AI Smart Blend 专用字段
    aiBlendPrompt?: string;    // 场景专属光影描述

    // 預設位置 (x, y 為中心點百分比 0~1)
    placement?: {
        x: number;
        y: number;
        scale: number;
    };
}

// [NEW] 新的 Mockup 類型 (用於 Logo 印刷)
export interface PrintableMockup {
    id: string;
    type: 'printable';         // [NEW] 類型：印刷合成
    name: string;
    thumbnail: string;

    // 空白載體圖 (例如：全白馬克杯)
    blankObjectUrl: string;

    // [重要] 印刷區域遮罩 (黑白圖，白色為可印區域)
    printableAreaMaskUrl?: string;

    // AI 提示詞，指導 AI 如何處理材質
    aiPrintPrompt: string;

    category?: string;

    // 預設的 Logo 放置參數
    placement?: {
        x: number;
        y: number;
        scale: number;
        rotation?: number
    };
}

// 聯合類型，讓你的程式碼可以同時處理兩種
export type UniversalMockup = Mockup | PrintableMockup;

// 预设 Mockup 模板配置
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
        printableAreaMaskUrl: '/mockups/printable/mug-1/mask.png', // [Enabled] PURE Black/White Mask provided by user
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
