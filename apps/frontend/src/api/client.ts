import axios from 'axios';

const apiClient = axios.create({
    // 開發環境(dev)維持 '/api/v1' (透過 Vite Proxy)
    // 生產環境(prod)也是 '/api/v1' (直接打後端)
    // 結論：直接用相對路徑即可，不需要環境變數判斷
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 請求攔截器：自動帶上 Token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 回應攔截器：處理 401 Token 過期
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // 可以選擇強制重新整理或導向登入頁
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default apiClient;