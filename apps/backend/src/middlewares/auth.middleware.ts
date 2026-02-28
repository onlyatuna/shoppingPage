//auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../utils/prisma';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
}

// ------------------------------------------------------------------
// 1. TypeScript 型別擴充 (Type Declaration)
// ------------------------------------------------------------------
// 這是為了讓 TypeScript 知道 req 物件裡面多了一個 user 屬性
// 否則你在 Controller 寫 req.user.userId 時會報錯
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
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
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    // 從 Header 取得 Token
    // 格式通常是: "Authorization: Bearer <你的Token>"
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

    // 優先從 Signed Cookie 讀取 Token，如果沒有才看 Header
    const tokenFromCookie = req.signedCookies?.token;
    const token = tokenFromCookie || tokenFromHeader;

    // 情況 A & B: 驗證 Token 合法性 (利用 jwt.verify 處理所有校驗，避免 CodeQL js/user-controlled-bypass)
    // 將 undefined 轉为空字串，讓 jwt.verify 去拋出錯誤，避免我們自己對 user input 做提早分支判斷
    const tokenStr = typeof token === 'string' ? token : '';

    try {
        const decoded = jwt.verify(tokenStr, process.env.JWT_SECRET as string, {
            algorithms: ['HS256'],  // 只接受 HS256 演算法
            issuer: 'shopping-mall-api',  // 驗證發行者
            audience: 'shopping-mall-client'  // 驗證受眾
        }) as any;

        // 情況 C: Token Revocation Check (檢查 tokenVersion)
        if (decoded && decoded.userId) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { tokenVersion: true }
            });

            if (!user) {
                return res.status(StatusCodes.UNAUTHORIZED).json({ message: '用戶不存在' });
            }

            // Fallback for old tokens without tokenVersion
            const jwtVersion = decoded.tokenVersion || 0;
            if (jwtVersion !== user.tokenVersion) {
                // Token 被強制註銷 (密碼更新或後台踢出)
                return res.status(StatusCodes.FORBIDDEN).json({
                    message: '登入狀態已失效 (Token Revoked)，請重新登入'
                });
            }
        }

        // 驗證成功！
        req.user = decoded as { userId: number; role: string };

        // 放行，進入下一個步驟 (Controller)
        next();
    } catch (_err: any) {
        // 若 tokenStr 為空，代表並未傳入 Token，回傳 401；否則代表過期或竄改，回傳 403
        const isMissing = !token || (typeof token === 'string' && token.trim().length === 0);

        return res.status(isMissing ? StatusCodes.UNAUTHORIZED : StatusCodes.FORBIDDEN).json({
            message: isMissing ? '未登入，請提供 Token' : 'Token 無效或已過期'
        });
    }
};