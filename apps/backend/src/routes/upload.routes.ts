//upload.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import { StatusCodes } from 'http-status-codes';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { AppError } from '../utils/appError';
import { asyncHandler } from '../utils/asyncHandler';
import { Readable } from 'stream';

const router = Router();

// Rate limiter for upload/delete operations
const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per 15 minutes per IP
    message: { status: 'error', message: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 1. 設定 Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. 設定 Multer (暫存在記憶體中) + 安全限制
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB 大小限制
        files: 1, // 一次只允許上傳一個檔案
    },
    fileFilter: (req, file, cb) => {
        // 只允許特定的圖片格式
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true); // 接受檔案
        } else {
            cb(new Error('只允許上傳 JPG, PNG, WEBP 格式的圖片'));
        }
    }
});

// 3. 上傳 API
router.post('/', uploadRateLimiter, authenticateToken, requireAdmin, upload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('未上傳檔案', StatusCodes.BAD_REQUEST);
    }

    const type = req.query.type || req.body.type || 'product';
    const subfolder = req.query.subfolder || req.body.subfolder;
    let folder = type === 'canvas' ? 'ecommerce-canvas' : 'ecommerce-product';

    if (subfolder && typeof subfolder === 'string') {
        const cleanSubfolder = subfolder.replace(/[#%&{}\\<>*?/$!'":@+`|=]/g, '').trim();
        if (cleanSubfolder) {
            folder = `${folder}/${cleanSubfolder}`;
        }
    }

    // Generate Custom Public ID: Filename + Timestamp
    const fileName = path.parse(req.file.originalname).name;
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const public_id = `${cleanFileName}_${Date.now()}`;

    // Optimization: Use upload_stream to avoid Base64 conversion overhead
    const uploadFromBuffer = (buffer: Buffer) => {
        return new Promise((resolve, reject) => {
            const cld_upload_stream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    public_id: public_id,
                    eager: [
                        { width: 1024, height: 1024, crop: "limit", format: "webp", quality: "auto" }
                    ]
                },
                (error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                }
            );
            // Modern, concise way to pipe buffer to stream
            Readable.from(buffer).pipe(cld_upload_stream);
        });
    };

    const result: any = await uploadFromBuffer(req.file.buffer);

    res.json({
        status: 'success',
        data: {
            url: result.secure_url,
            // 👇 AI Optimized URL: 1024px WebP Thumbnail
            ai_url: result.secure_url.replace(/\/upload\//, '/upload/w_1024,c_limit,f_webp,q_auto/'),
            public_id: result.public_id,
            folder: folder
        }
    });
}));

// 4. 取得 Cloudinary 圖片列表 (支援分頁)
router.get('/resources', uploadRateLimiter, authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
    const { next_cursor, type } = req.query;
    const prefix = type === 'canvas' ? 'ecommerce-canvas' : 'ecommerce-product';

    // 使用 Admin API 取得資源列表
    const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: prefix, // 只撈取此專案的圖片
        max_results: 50,
        next_cursor: next_cursor as string
    });

    // Add ai_url to each resource
    const resourcesWithAiUrl = result.resources.map((res: any) => ({
        ...res,
        ai_url: res.secure_url.replace(/\/upload\//, '/upload/w_1024,c_limit,f_webp,q_auto/')
    }));

    res.json({
        status: 'success',
        data: {
            resources: resourcesWithAiUrl,
            next_cursor: result.next_cursor
        }
    });
}));

// 5. 刪除 Cloudinary 圖片
import { prisma } from '../utils/prisma';

router.delete(/\/(.*)/, uploadRateLimiter, authenticateToken, requireAdmin, asyncHandler(async (req, res) => {
    const publicId = req.params[0];

    // [SECURITY] Strict input validation for publicId to prevent SQL wildcard injection in JSON_SEARCH
    // Only allow alphanumeric, underscore, slash, and dash
    if (!publicId || !new RegExp('^[\\\\w/-]+$').test(publicId)) {
        throw new AppError('無效的圖片 ID 格式', StatusCodes.BAD_REQUEST);
    }

    // 1. Check if image is used by any product using a safe, parameterized query
    // [PERFORMANCE NOTE - 4th Audit] If products scale > 10,000, JSON_SEARCH inside MySQL will incur full table scans.
    // It is highly recommended to normalize product <-> image mapping into a `product_images` relational table in the future.
    const productsUsingImage: any[] = await prisma.$queryRaw`
        SELECT id, name FROM products 
        WHERE JSON_SEARCH(images, 'one', ${'%' + publicId + '%'}) IS NOT NULL
        AND deletedAt IS NULL
        LIMIT 1
    `;

    if (productsUsingImage.length > 0) {
        throw new AppError(`此圖片正被商品 "${productsUsingImage[0].name}" 使用中，無法直接刪除。請先至商品管理頁面移除。`, StatusCodes.BAD_REQUEST);
    }

    // 2. Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
        res.json({ message: '圖片刪除成功' });
    } else {
        throw new AppError('刪除失敗或找不到圖片', StatusCodes.BAD_REQUEST);
    }
}));

export default router;