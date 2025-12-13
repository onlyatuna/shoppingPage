// Frame type definitions
export interface Frame {
    id: string;
    name: string;
    preview: string; // thumbnail URL
    url: string; // full frame image URL
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
