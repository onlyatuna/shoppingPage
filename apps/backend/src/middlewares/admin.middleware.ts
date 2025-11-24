import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    // req.user 是在 authenticateToken 這個 middleware 裡被賦值的
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(StatusCodes.FORBIDDEN).json({
            message: '權限不足，需要管理員權限'
        });
    }
    next();
};