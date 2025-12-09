//admin.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // [修改] 允許 ADMIN 或 DEVELOPER 通過
    if (!user || (user.role !== 'ADMIN' && user.role !== 'DEVELOPER')) {
        return res.status(StatusCodes.FORBIDDEN).json({
            message: '權限不足，需要管理員或開發者權限'
        });
    }
    next();
};

// [選用] 如果未來有「只有開發者能用的功能」(如查看 Log)，可以多加這個
export const requireDeveloper = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'DEVELOPER') {
        return res.status(StatusCodes.FORBIDDEN).json({
            message: '權限不足，僅限開發人員存取'
        });
    }
    next();
};