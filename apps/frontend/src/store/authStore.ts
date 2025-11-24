import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('token'),
    user: null, // 這裡可以選擇存在 localStorage 或每次重整後透過 API 重新取得

    login: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user });
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
    },
}));