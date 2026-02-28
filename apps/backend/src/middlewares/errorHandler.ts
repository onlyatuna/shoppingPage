// apps/backend/src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    // 1. Zod 驗證錯誤處理
    if (err instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: '資料驗證失敗',
            errors: err.issues,
        });
    }

    // 1.5 自定義應用程式錯誤 (AppError)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        });
    }

    // 2. 業務邏輯錯誤與 Fallback 處理
    const message = err.message || '系統發生錯誤';
    let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

    // HTTP 500 is used for generic Error instances unless they explicitly set statusCode
    // Developers should use AppError to trigger specific UI error boundaries

    // 3. 記錄錯誤日誌 (排除常見的使用者輸入錯誤以減少噪音，或全部記錄)
    if (statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
        logger.error({ err, reqId: (req as any).id }, 'Unexpected Internal Server Error');
    }

    // [SECURITY] 500 錯誤在 Production 環境下模糊化，避免洩漏敏感內部路徑/資料庫連線字串
    const finalMessage = (statusCode === StatusCodes.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production')
        ? '系統發生不可預期的錯誤，請稍後再試。'
        : message;

    // 4. 回傳錯誤回應
    res.status(statusCode).json({
        status: 'error',
        message: finalMessage,
        // 開發環境顯示堆疊資訊
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
