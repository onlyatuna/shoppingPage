//client.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
    // 開發環境(dev)維持 '/api/v1' (透過 Vite Proxy)
    // 生產環境(prod)也是 '/api/v1' (直接打後端)
    // 結論：直接用相對路徑即可，不需要環境變數判斷
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // 允許跨域傳送 Cookie
});

// 請求攔截器：(已移除 Token 自動帶入，改用 Cookie)
apiClient.interceptors.request.use((config) => {
    return config;
});

// 回應攔截器：處理 401 Token 過期
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token 過期或無效，清除前端狀態並導向登入頁
            const { logout } = useAuthStore.getState();
            logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;