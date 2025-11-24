export interface User {
    id: number;
    email: string;
    name?: string | null;
    role: 'USER' | 'ADMIN';
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    stock: number;
    images?: string[];
    categoryId: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: any;
}
