//authStore.ts
import { create } from 'zustand';
import { User } from '../types';
import apiClient from '../api/client';

interface AuthState {
    user: User | null;
    isInitialized: boolean;

    setAuth: (user: User) => void;
    login: (user: User) => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isInitialized: false,

    // 單純更新使用者資料
    setAuth: (user) => set({ user, isInitialized: true }),

    // 登入動作 (只更新 user，Token 由 Cookie 處理)
    login: (user) => {
        set({ user, isInitialized: true });
    },

    // 登出動作 (呼叫後端清除 Cookie)
    logout: async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            set({ user: null, isInitialized: true });
        }
    },

    // 檢查登入狀態 (呼叫 /auth/me)
    checkAuth: async () => {
        try {
            const res = await apiClient.get('/auth/me');
            set({ user: res.data.user, isInitialized: true });
        } catch (error) {
            set({ user: null, isInitialized: true });
        }
    },

    setInitialized: (val) => set({ isInitialized: val }),
}));