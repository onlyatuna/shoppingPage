//upload.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import { StatusCodes } from 'http-status-codes';

const router = Router();

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
        fileSize: 5 * 1024 * 1024, // 5MB 大小限制
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
// 3. 上傳 API
router.post('/', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    // ... (existing upload logic) ...
    try {
        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: '未上傳檔案' });
        }

        const type = req.query.type || req.body.type || 'product';
        const folder = type === 'canvas' ? 'ecommerce-canvas' : 'ecommerce-product';

        // 將 Buffer 轉為 Base64 字串以便上傳
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

        // 上傳到 Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: folder, // 在 Cloudinary 建立的資料夾名稱
        });

        // 回傳 Cloudinary 給的網址
        res.json({
            status: 'success',
            data: {
                url: result.secure_url,
                public_id: result.public_id, // Must return public_id for future deletion
                folder: folder
            }
        });
    } catch (error: any) {
        // ... (existing error handling) ...
        console.error('Upload Error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: '圖片上傳失敗'
        });
    }
});

// 4. 取得 Cloudinary 圖片列表 (支援分頁)
router.get('/resources', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { next_cursor, type } = req.query;
        const prefix = type === 'canvas' ? 'ecommerce-canvas' : 'ecommerce-product';

        // 使用 Admin API 取得資源列表
        // 注意：這需要 API Key 有足夠權限 (通常預設都有)
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: prefix, // 只撈取此專案的圖片
            max_results: 9, // 每頁顯示數量
            next_cursor: next_cursor as string
        });

        res.json({
            status: 'success',
            data: {
                resources: result.resources,
                next_cursor: result.next_cursor
            }
        });
    } catch (error: any) {
        // ... err
        console.error('Cloudinary List Error:', error);
        // ...

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: '無法取得雲端圖庫',
            error: error.message,
            hint: 'Please check Cloudinary API credentials and configuration'
        });
    }
});

// 5. 刪除 Cloudinary 圖片
import { prisma } from '../utils/prisma';

router.delete('/:publicId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { publicId } = req.params;

        // 1. Check if image is used by any product
        // images column is JSON array of strings (URLs). 
        // We match against the publicId. URLs typically contain the publicId.
        // Using raw query for JSON search in MySQL
        const productsUsingImage: any[] = await prisma.$queryRaw`
            SELECT id, name FROM products 
            WHERE JSON_SEARCH(images, 'one', ${'%' + publicId + '%'}) IS NOT NULL
            AND deletedAt IS NULL
            LIMIT 1
        `;

        if (productsUsingImage.length > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'error',
                message: `此圖片正被商品 "${productsUsingImage[0].name}" 使用中，無法直接刪除。請先至商品管理頁面移除。`,
                code: 'IMAGE_IN_USE'
            });
        }

        // 2. Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            res.json({ status: 'success', message: '圖片刪除成功' });
        } else {
            res.status(StatusCodes.BAD_REQUEST).json({ status: 'error', message: '刪除失敗或找不到圖片' });
        }
    } catch (error: any) {
        console.error('Cloudinary Delete Error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: '刪除失敗',
            error: error.message
        });
    }
});

export default router;