import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

// 擴充 Express 的 Request 型別，讓 req.user 合法
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                role: string;
            };
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    // 格式通常是: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: '未登入，請提供 Token' });
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) {
            return res.status(StatusCodes.FORBIDDEN).json({ message: 'Token 無效或已過期' });
        }

        // 將解碼後的資料存入 req.user，方便後面的 Controller 使用
        req.user = decoded as { userId: number; role: string };
        next();
    });
};