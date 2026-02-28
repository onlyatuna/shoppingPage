// apps/backend/src/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

// 這是一個 Higher-Order Function (HOF)
// 它接收一個 async 函式，並回傳一個標準的 Express Middleware
// 它會自動 catch 所有的 async 錯誤並傳給 next(err)，讓 errorHandler 集中處理。
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
