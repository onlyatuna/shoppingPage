//app.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from './utils/prisma';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import categoryRoutes from './routes/category.routes';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';
import path from 'path';


const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());              // 允許跨域請求 (前端 5173 -> 後端 3000)
app.use(express.json());      // 解析 JSON Request Body
app.use(morgan('dev'));       // 記錄 HTTP Log

// 測試路由 1: Health Check
app.get('/api/health', (req: Request, res: Response) => {
    res.send('✅ Shopping Mall API is Running!');
});

// 測試路由 2: 測試資料庫連線
app.get('/api/test-db', async (req: Request, res: Response) => {
    try {
        // 嘗試讀取使用者數量
        const userCount = await prisma.user.count();
        res.json({
            status: 'success',
            message: 'Database connected successfully',
            userCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed'
        });
    }
});

// Routes
const apiV1Prefix = '/api/v1';

// 掛載 Auth 路由
app.use(`${apiV1Prefix}/auth`, authRoutes);
app.use(`${apiV1Prefix}/products`, productRoutes);
app.use(`${apiV1Prefix}/cart`, cartRoutes);
app.use(`${apiV1Prefix}/orders`, orderRoutes);
app.use(`${apiV1Prefix}/categories`, categoryRoutes);
app.use(`${apiV1Prefix}/upload`, uploadRoutes);
app.use(`${apiV1Prefix}/users`, userRoutes);
app.use(`${apiV1Prefix}/payment`, paymentRoutes);

// 2. [新增] 部署設定：託管前端靜態檔案
// 注意：我們假設 Docker 會把前端 build 好的 dist 複製到後端同一層級的 client/dist
if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../../frontend/dist');

    // 託管靜態檔案
    app.use(express.static(frontendDist));

    // 所有不符合 API 的請求，都回傳 index.html (讓 React Router 接手)
    // 使用 middleware 而非 wildcard route，避免 path-to-regexp 語法問題
    app.use((req, res) => {
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
}

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});