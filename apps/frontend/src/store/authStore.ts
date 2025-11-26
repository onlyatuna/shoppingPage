import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
    // 初始化時直接從 localStorage 讀取，確保重整後 Token 還在
    token: string | null;
    user: User | null;

    // 增加一個屬性判斷是否已經初始化完成
    isInitialized: boolean;

    setAuth: (user: User) => void;
    login: (token: string, user: User) => void;
    logout: () => void;
    setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('token'), // ✅ 關鍵：這裡會讀取舊的 token
    user: null,
    isInitialized: false,

    // 單純更新使用者資料 (例如重整後抓回來的資料)
    setAuth: (user) => set({ user, isInitialized: true }),

    // 登入動作 (寫入 token)
    login: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user, isInitialized: true });
    },

    // 登出動作 (清除 token)
    logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, isInitialized: true });
    },

    setInitialized: (val) => set({ isInitialized: val }),
}));