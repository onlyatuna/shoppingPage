//auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

// ------------------------------------------------------------------
// 1. TypeScript 型別擴充 (Type Declaration)
// ------------------------------------------------------------------
// 這是為了讓 TypeScript 知道 req 物件裡面多了一個 user 屬性
// 否則你在 Controller 寫 req.user.userId 時會報錯
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                role: string; // 包含 'USER' | 'ADMIN' | 'DEVELOPER'
            };
        }
    }
}

// ------------------------------------------------------------------
// 2. 驗證邏輯 (Main Logic)
// ------------------------------------------------------------------
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    // 從 Header 取得 Token
    // 格式通常是: "Authorization: Bearer <你的Token>"
    const authHeader = req.headers['authorization'];

    // 如果有 header，用空白切割取第二部分 (Token 本體)
    const token = authHeader && authHeader.split(' ')[1];

    // 情況 A: 根本沒傳 Token
    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: '未登入，請提供 Token'
        });
    }

    // 情況 B: 驗證 Token 合法性
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) {
            // Token 過期或被竄改
            return res.status(StatusCodes.FORBIDDEN).json({
                message: 'Token 無效或已過期'
            });
        }

        // 驗證成功！
        // 將解碼出來的資料 (userId, role) 存入 req.user
        // 這樣後面的 Controller 就可以用 req.user 知道是誰在發請求
        req.user = decoded as { userId: number; role: string };

        // 放行，進入下一個步驟 (Controller)
        next();
    });
};