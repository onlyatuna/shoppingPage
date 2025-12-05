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

// 2. 設定 Multer (暫存在記憶體中)
const upload = multer({ storage: multer.memoryStorage() });

// 3. 上傳 API
router.post('/', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: '未上傳檔案' });
        }

        // 將 Buffer 轉為 Base64 字串以便上傳
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

        // 上傳到 Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'ecommerce-product', // 在 Cloudinary 建立的資料夾名稱
        });

        // 回傳 Cloudinary 給的網址
        res.json({
            status: 'success',
            data: {
                url: result.secure_url
            }
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '圖片上傳失敗' });
    }
});

export default router;