import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
    baseURL: '/api/v1',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // [關鍵] 必須開啟，才會自動帶 Cookie
});

// 回應攔截器 (處理 401 登出)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // 後端說 Token 無效 -> 清除前端狀態
            const { logout } = useAuthStore.getState();
            logout(); // 這裡只是清 Zustand，Cookie 由後端 /logout 路由清

            // 避免在登入頁無限重整
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;