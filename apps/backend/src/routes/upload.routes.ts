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
    } catch (error: any) {
        console.error('Upload Error:', error);

        // 處理 Multer 錯誤
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: '檔案過大，最大允許 5MB'
                });
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: '一次只能上傳一個檔案'
                });
            }
        }

        // 處理檔案格式錯誤
        if (error.message?.includes('只允許上傳')) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: error.message
            });
        }

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: '圖片上傳失敗'
        });
    }
});

export default router;