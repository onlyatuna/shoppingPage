// apps/backend/src/app.ts
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { prisma } from './utils/prisma';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import categoryRoutes from './routes/category.routes';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';
import geminiRoutes from './routes/gemini.routes';
import instagramRoutes from './routes/instagram.routes';
import customStyleRoutes from './routes/customStyle.routes';
import translateRoutes from './routes/translate.routes';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// [修正 1] 信任 Proxy (Caddy)
// 必須設定，否則在 HTTPS 環境下，Secure Cookie 會寫入失敗
app.set('trust proxy', 1);

// Middlewares
// Security headers - disabled CSP, XSS-Protection, and X-Frame-Options as unnecessary for API
app.use(helmet({
    contentSecurityPolicy: false, // Disabled - not needed for API responses
    xssFilter: false, // Disabled - x-xss-protection header is deprecated
    frameguard: false, // Disabled - X-Frame-Options is deprecated, use CSP frame-ancestors instead
    // 允許跨域資源載入 (避免 Cloudinary 圖片被擋)
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Add Cache-Control headers for API responses
app.use((req, res, next) => {
    // Use 'no-cache' to require revalidation, avoiding deprecated directives
    res.setHeader('Cache-Control', 'no-cache');
    next();
});

app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://127.0.0.1:5173'
    ],
    credentials: true, // 允許帶 Cookie
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser()); // 解析 Cookie
app.use(morgan('dev'));

// 測試路由
app.get('/api/health', (req: Request, res: Response) => {
    res.send('✅ Shopping Mall API is Running!');
});

app.get('/api/test-db', async (req: Request, res: Response) => {
    try {
        const userCount = await prisma.user.count();
        res.json({ status: 'success', message: 'Database connected', userCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
});

// Routes
const apiV1Prefix = '/api/v1';

app.use(`${apiV1Prefix}/auth`, authRoutes);
app.use(`${apiV1Prefix}/products`, productRoutes);
app.use(`${apiV1Prefix}/cart`, cartRoutes);
app.use(`${apiV1Prefix}/orders`, orderRoutes);
app.use(`${apiV1Prefix}/categories`, categoryRoutes);
app.use(`${apiV1Prefix}/upload`, uploadRoutes);
app.use(`${apiV1Prefix}/users`, userRoutes);
app.use(`${apiV1Prefix}/payment`, paymentRoutes);
app.use(`${apiV1Prefix}/gemini`, geminiRoutes);
app.use(`${apiV1Prefix}/instagram`, instagramRoutes);
app.use(`${apiV1Prefix}/translate`, translateRoutes);
app.use(`${apiV1Prefix}/custom-styles`, customStyleRoutes);

// 全域錯誤處理器
app.use(errorHandler);

// 部署設定：託管前端靜態檔案
if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../public');

    app.use(express.static(frontendDist));

    // SPA Fallback: 所有非 API 請求都回傳 index.html
    app.use((req, res) => {
        // 確保不是 API 請求才回傳 HTML (雖然放在最後面了，但多一層保險也好)
        if (req.path.startsWith('/api')) {
            res.status(404).json({ message: 'API Not Found' });
        } else {
            res.sendFile(path.join(frontendDist, 'index.html'));
        }
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});