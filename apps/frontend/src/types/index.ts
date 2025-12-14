//index.ts
export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN' | 'DEVELOPER';
}

export interface Category {
    _count: any;
    id: number;
    name: string;
    slug: string;
}

export interface Product {
    slug: string;
    id: number;
    name: string;
    price: string; // 注意：後端 Decimal 轉 JSON 會變字串，或是你在 fetch 時轉 number
    images: string[];
    description: string;
    stock: number;
    isActive: boolean;
    categoryId: number;
    category?: Category; // 關聯資料

    // [新增] 規格與詳情
    options?: ProductOption[];
    variants?: ProductVariant[];
}

export interface ProductOption {
    id: string;
    name: string;
    values: string[];
}

export interface ProductVariant {
    id: string;
    price: number;
    stock: number;
    image?: string; // [New] Variant specific image
    combination: Record<string, string>; // { "顏色": "紅", "尺寸": "S" }
}

export interface CartItem {
    id: number;
    quantity: number;
    variantId?: string; // [New]
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
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
    id: number;
    quantity: number;
    price: string; // 記錄購買當下的價格
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
    // [新增] 使用者資訊
    user?: {
        name: string | null;
        email: string;
    };
}
