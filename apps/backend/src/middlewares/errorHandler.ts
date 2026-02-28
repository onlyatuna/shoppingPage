// apps/backend/src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    // 1. Zod 驗證錯誤處理
    if (err instanceof ZodError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: '資料驗證失敗',
            errors: err.issues,
        });
    }

    // 2. 業務邏輯錯誤 (自定義錯誤訊息)
    // 這裡可以根據錯誤訊息關鍵字轉換狀態碼
    let statusCode = err.statusCode || StatusCodes.BAD_REQUEST;
    const message = err.message || '系統發生錯誤';

    if (message.includes('找不到') || message.includes('存在')) {
        statusCode = StatusCodes.NOT_FOUND;
    } else if (message.includes('已被註冊') || message.includes('重複')) {
        statusCode = StatusCodes.CONFLICT;
    } else if (message.includes('權限不足') || message.includes('未經授權')) {
        statusCode = StatusCodes.FORBIDDEN;
    } else if (message.includes('請先至信箱收取驗證信')) {
        statusCode = StatusCodes.FORBIDDEN;
    } else if (message.includes('帳號或密碼錯誤')) {
        statusCode = StatusCodes.UNAUTHORIZED;
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
