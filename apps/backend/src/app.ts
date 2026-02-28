// apps/backend/src/app.ts
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { logger, asyncLocalStorage } from './utils/logger';
import helmet from 'helmet';
import lusca from 'lusca';
import rateLimit from 'express-rate-limit';
import { csrfProtection as csrf } from './middlewares/csrf.middleware';
import { StatusCodes } from 'http-status-codes';
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
import adminRoutes from './routes/admin.routes';
import path from 'path';
import cron from 'node-cron';
import { CronService } from './services/cron.service';

const app = express();
const PORT = process.env.PORT || 3000;

// [SECURITY] 信任 Proxy (Caddy)
// 必須設定，否則在 HTTPS 環境下，Secure Cookie 會寫入失敗
// [ALERT/SECURITY] 如果伺服器直接對外開放 3000 埠口 (未透過 Proxy)，則此設定可能導致 IP 偽造。
// 目前在 docker-compose.yml 中僅 use 'expose' 3000，確保只有內部容器 (Caddy) 能存取，因此設定為 1 是安全的。
app.set('trust proxy', 1);

// Middlewares
// Security headers configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // [RESTORED] Required for React/Vite development/production injection
                "https://static.cloudflareinsights.com",
                "https://cdn.jsdelivr.net",
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
            ],
            imgSrc: [
                "'self'", "data:", "blob:",
                "https://res.cloudinary.com",
                "https://*.cdninstagram.com",
                "https://images.unsplash.com",
                "https://picsum.photos",
            ],
            fontSrc: [
                "'self'", "data:", "blob:",
                "https://fonts.gstatic.com",
                "https://fonts.googleapis.com",
            ],
            connectSrc: [
                "'self'",
                "https://res.cloudinary.com",
                "https://api.cloudinary.com",
                "https://generativelanguage.googleapis.com",
                "https://cdn.jsdelivr.net",
                "wss:", "ws:",
            ],
            workerSrc: ["'self'", "blob:", "data:"],
            frameAncestors: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    xssFilter: false,
    frameguard: { action: 'sameorigin' },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));



app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://127.0.0.1:5173'
    ],
    credentials: true, // 允許帶 Cookie
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN']
}));



app.use(express.json({ limit: '2mb' }));

app.use(cookieParser(process.env.JWT_SECRET || 'fallback-cookie-secret-at-least-32-chars')); // 解析 Cookie (含簽名支援)
app.use(csrf);  // [SECURITY] CSRF Protection (Double Submit Cookie Pattern)

// [SECURITY & OBSERVABILITY] Replace morgan with pino-http
app.use(pinoHttp({
    logger,
    genReqId: function (req, res) {
        const existingID = req.id ?? req.headers["x-request-id"];
        if (existingID) return existingID;
        return randomUUID();
    }
}));

// Provide Correlation ID via AsyncLocalStorage to all downstream services and Prisma
app.use((req, res, next) => {
    const store = new Map<string, any>();
    store.set('reqId', req.id);
    asyncLocalStorage.run(store, () => next());
});

// [SECURITY] Plus security headers via Lusca for all endpoints
app.use(lusca({
    xframe: 'SAMEORIGIN',
    hsts: { maxAge: 31536000, includeSubDomains: true },
    xssProtection: true,
    nosniff: true,
}));

// API 回應不應被快取
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// [SECURITY & OBSERVABILITY] Health Check API
// Used by Docker Compose healthcheck to ensure service availability.
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        // 1. 檢查資料庫連線 (Prisma $queryRaw 執行最輕量查詢)
        await prisma.$queryRaw`SELECT 1`;

        res.status(StatusCodes.OK).json({
            status: 'healthy',
            service: 'Shopping Mall API',
            timestamp: new Date().toISOString(),
            database: 'connected',
            // [FUTURE] Add more dependency checks here (e.g., Redis, Cloudinary API)
        });
    } catch (error) {
        logger.error({ action: 'health_check_failed', error }, 'Database connection unhealthy');
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            status: 'unhealthy',
            service: 'Shopping Mall API',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: process.env.NODE_ENV === 'development' ? (error as any).message : undefined
        });
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
app.use(`${apiV1Prefix}/admin`, adminRoutes);

// 全域錯誤處理器
app.use(errorHandler);

// 部署設定：託管前端靜態檔案
if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../public');

    // Rate limiter for SPA fallback (file system access)
    const spaFallbackLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 200, // Limit each IP to 200 SPA fallback requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many requests, please try again later.' },
    });

    // Serve static files with custom headers
    app.use(express.static(frontendDist, {
        setHeaders: (res, path) => {
            // Check if file is in the assets directory (Vite puts hashed files there)
            if (path.includes('/assets/')) {
                // Immutable cache for 1 year
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            } else {
                // Determine cache behavior for other root files
                if (path.endsWith('.html') || path.endsWith('sw.js') || path.endsWith('registerSW.js') || path.endsWith('manifest.webmanifest')) {
                    // No cache for entry points and service workers
                    res.setHeader('Cache-Control', 'no-cache');
                } else {
                    // Default short cache for other files (e.g. icon.png, favicon.ico)
                    // Set to 1 day as a reasonable default, or no-cache if strict freshness is needed
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                }
            }
        }
    }));

    // SPA Fallback: 所有非 API 請求都回傳 index.html
    // Rate limited to prevent DoS attacks on file system access
    // [SECURITY] If implementing SSR or manual state injection (e.g. window.__INITIAL_STATE__),
    // ALWAYS use safeJsonStringify() to prevent XSS.
    app.use(spaFallbackLimiter, (req, res) => {
        // 確保不是 API 請求才回傳 HTML (雖然放在最後面了，但多一層保險也好)
        if (req.path.startsWith('/api')) {
            res.status(404).json({ message: 'API Not Found' });
        } else {
            res.sendFile(path.join(frontendDist, 'index.html'));
        }
    });
}

// ------------------------------------------------------------------
// 排程任務 (Cron Jobs) 初始化
// ------------------------------------------------------------------
// 每 10 分鐘檢查一次遺失的 LINE Pay 交易
cron.schedule('*/10 * * * *', async () => {
    logger.debug('[Cron] 啟動 LINE Pay 補救排程...');
    await CronService.checkPendingLinePay();
}, { timezone: 'Asia/Taipei' });

// 每天凌晨 3 點清理超過 24 小時失效的 PENDING 訂單
cron.schedule('0 3 * * *', async () => {
    logger.debug('[Cron] 啟動過期訂單清理排程...');
    await CronService.cleanStaleOrders();
}, { timezone: 'Asia/Taipei' });

app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});