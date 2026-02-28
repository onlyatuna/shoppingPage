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

    // 為通用的 Error (非 AppError) 提供關鍵字保底機制
    if (!(err instanceof AppError)) {
        const errorMapping: { [key: string]: number } = {
            '找不到': StatusCodes.NOT_FOUND,
            '存在': StatusCodes.NOT_FOUND,
            '已被註冊': StatusCodes.CONFLICT,
            '重複': StatusCodes.CONFLICT,
            '其餘': StatusCodes.CONFLICT, // 處理相關聯衝突
            '權限不足': StatusCodes.FORBIDDEN,
            '未經授權': StatusCodes.FORBIDDEN,
            '驗證信': StatusCodes.FORBIDDEN,
            '帳號或密碼錯誤': StatusCodes.UNAUTHORIZED,
            '尚有': StatusCodes.BAD_REQUEST,
            '無法刪除': StatusCodes.BAD_REQUEST,
            '驗證失敗': StatusCodes.BAD_REQUEST,
            '不合法': StatusCodes.BAD_REQUEST,
            '格式錯誤': StatusCodes.BAD_REQUEST,
        };

        for (const [key, code] of Object.entries(errorMapping)) {
            if (message.includes(key)) {
                statusCode = code;
                break;
            }
        }
    }

    // 3. 記錄錯誤日誌 (排除常見的使用者輸入錯誤以減少噪音，或全部記錄)
    if (statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
        logger.error({ err, reqId: (req as any).id }, 'Unexpected Internal Server Error');
    }

    // 4. 回傳錯誤回應
    res.status(statusCode).json({
        status: 'error',
        message,
        // 開發環境顯示堆疊資訊
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
