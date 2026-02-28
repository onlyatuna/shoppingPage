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

const app = express();
const PORT = process.env.PORT || 3000;

// [修正 1] 信任 Proxy (Caddy)
// 必須設定，否則在 HTTPS 環境下，Secure Cookie 會寫入失敗
app.set('trust proxy', 1);

// Middlewares
// Security headers configuration
app.use(helmet({
    // CSP with permissive settings for React SPA compatibility
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", "'unsafe-inline'", "'unsafe-eval'",
                "https://static.cloudflareinsights.com",
                "https://cdn.jsdelivr.net",   // MediaPipe (Hand Gesture)
            ],
            styleSrc: [
                "'self'", "'unsafe-inline'",
                "https://fonts.googleapis.com", // Google Fonts / Material Icons
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
                "https://generativelanguage.googleapis.com",  // Gemini AI API
                "https://cdn.jsdelivr.net",                   // MediaPipe WASM assets
                "wss:", "ws:",
            ],
            workerSrc: ["'self'", "blob:", "data:"],     // Service Worker & Web Workers
            frameAncestors: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    xssFilter: false, // Disabled - x-xss-protection header is deprecated by browsers
    // X-Frame-Options for clickjacking protection
    frameguard: { action: 'sameorigin' },
    // Allow cross-origin resource loading (for Cloudinary images)
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



// [SECURITY] Strict JSON body limits to prevent Memory Exhaustion/DoS
// Use 2mb as default for general API metadata
app.use((req, res, next) => {
    // Specify routes that need higher limit for image/Base64 payloads
    if (req.path.startsWith(`${apiV1Prefix}/upload`) || req.path.startsWith(`${apiV1Prefix}/custom-styles`)) {
        express.json({ limit: '50mb' })(req, res, next);
    } else {
        express.json({ limit: '2mb' })(req, res, next);
    }
});

app.use(cookieParser()); // 解析 Cookie
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
    app.use(spaFallbackLimiter, (req, res) => {
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