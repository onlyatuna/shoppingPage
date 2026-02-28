import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { EmailService } from './email.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sanitizeLog, timingSafeCompare } from '../utils/securityUtils';
import { AppError } from '../utils/appError';
import { StatusCodes } from 'http-status-codes';

export class AuthService {

    // --- 註冊 (設定 24小時過期) ---
    static async register(data: z.infer<typeof registerSchema>) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) throw new AppError('Email 已被註冊', StatusCodes.CONFLICT);

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // [新增] 設定過期時間為 24 小時後
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: 'USER',
                isVerified: false,
                verificationToken,
                verificationTokenExpiresAt: expiresAt, // [新增] 存入 DB
                cart: { create: {} }
            },
            select: { id: true, email: true, name: true, role: true },
        });

        EmailService.sendVerificationEmail(data.email, verificationToken).catch(err => console.error(sanitizeLog(err)));

        return {
            message: '註冊成功！請檢查您的信箱以完成驗證。',
            userId: user.id
        };
    }

    // --- 驗證信箱 (加入過期檢查、時序攻擊防禦與原子化更新) ---
    static async verifyEmail(token: string, email?: string) {
        let user;
        if (email) {
            // [SECURITY] 經由 Email 查尋，使比對 Token 的過程能具備時序安全性
            user = await prisma.user.findUnique({ where: { email } });
        } else {
            // 回退機制：原有連結可能只有 Token
            user = await prisma.user.findUnique({
                where: { verificationToken: token },
            });
        }

        if (!user || !user.verificationToken) throw new AppError('驗證連結無效', StatusCodes.BAD_REQUEST);

        // [SECURITY] 使用時序安全比對 (Timing-Safe Comparison)
        if (!timingSafeCompare(user.verificationToken, token)) {
            throw new AppError('驗證連結無效', StatusCodes.BAD_REQUEST);
        }

        // [原子化更新] 在資料庫層級進行過期與 Token 校驗，防止 Race Condition
        const result = await prisma.user.updateMany({
            where: {
                id: user.id,
                verificationToken: user.verificationToken, // 確保 Token 在此瞬間未被更動或清除
                verificationTokenExpiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                isVerified: true,
                verificationToken: null,
                verificationTokenExpiresAt: null,
            },
        });

        if (result.count === 0) {
            throw new AppError('驗證連結已失效或過期，請重新申請驗證信', StatusCodes.BAD_REQUEST);
        }

        return { message: '信箱驗證成功！您現在可以登入了。' };
    }

    // --- [補充] 重發驗證信 (Resend) ---
    // 如果連結過期，使用者需要一個 API 來重新取得新連結
    static async resendVerification(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) throw new AppError('找不到此信箱', StatusCodes.NOT_FOUND);
        if (user.isVerified) throw new AppError('此帳號已驗證，請直接登入', StatusCodes.BAD_REQUEST);

        // 產生新 Token 與新時間
        const newToken = crypto.randomBytes(32).toString('hex');
        const newExpiresAt = new Date();
        newExpiresAt.setHours(newExpiresAt.getHours() + 24);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken: newToken,
                verificationTokenExpiresAt: newExpiresAt,
            }
        });

        EmailService.sendVerificationEmail(user.email, newToken).catch(err => console.error(sanitizeLog(err)));

        return { message: '驗證信已重新發送，請檢查信箱' };
    }

    // --- 登入 ---
    static async login(data: z.infer<typeof loginSchema>) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) throw new AppError('帳號或密碼錯誤', StatusCodes.UNAUTHORIZED);

        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) throw new AppError('帳號或密碼錯誤', StatusCodes.UNAUTHORIZED);

        if (!user.isVerified) throw new AppError('請先至信箱收取驗證信啟用帳號', StatusCodes.FORBIDDEN);

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            {
                expiresIn: '7d',
                algorithm: 'HS256',  // 明確指定演算法，防止演算法混淆攻擊
                issuer: 'shopping-mall-api',  // 發行者標識
                audience: 'shopping-mall-client'  // 受眾標識
            }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    // --- 請求重設密碼 ---
    static async requestPasswordReset(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // 安全考量：不透露用戶是否存在
            return { message: '如果該信箱存在，重設密碼連結已發送' };
        }

        // 產生重設密碼 token（1小時有效）
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordTokenExpiresAt: expiresAt,
            },
        });

        EmailService.sendPasswordResetEmail(user.email, resetToken).catch(err => console.error(sanitizeLog(err)));

        return { message: '如果該信箱存在，重設密碼連結已發送' };
    }

    // --- 驗證重設密碼 token (時序安全) ---
    static async verifyResetToken(token: string, email?: string) {
        // [SECURITY] 優先使用 Token 進行查詢獲取關聯用戶
        const user = await prisma.user.findUnique({
            where: { resetPasswordToken: token },
        });

        if (!user || !user.resetPasswordToken) throw new AppError('重設連結無效', StatusCodes.BAD_REQUEST);

        // [SECURITY] 若有提供 Email，則進行比對（防止 Cross-user token usage）
        if (email && email !== user.email) {
            throw new AppError('重設連結與信箱不符', StatusCodes.BAD_REQUEST);
        }

        // [SECURITY] 使用時序安全比對 Token (雖然已經查到了，但增加一層記憶體比對)
        if (!timingSafeCompare(user.resetPasswordToken, token)) {
            throw new AppError('重設連結無效', StatusCodes.BAD_REQUEST);
        }

        if (user.resetPasswordTokenExpiresAt && user.resetPasswordTokenExpiresAt < new Date()) {
            throw new AppError('重設連結已過期，請重新申請', StatusCodes.BAD_REQUEST);
        }

        return { valid: true, email: user.email };
    }

    // --- 重設密碼 (時序安全、原子化更新) ---
    static async resetPassword(token: string, newPassword: string, email?: string) {
        // [SECURITY] 優先使用 Token 查詢關聯用戶
        const user = await prisma.user.findUnique({
            where: { resetPasswordToken: token },
        });

        if (!user || !user.resetPasswordToken) throw new AppError('重設連結無效', StatusCodes.BAD_REQUEST);

        // [SECURITY] 驗證 Email 匹配
        if (email && email !== user.email) {
            throw new AppError('重設連結與信箱不符', StatusCodes.BAD_REQUEST);
        }

        // [SECURITY] 時序安全比對
        if (!timingSafeCompare(user.resetPasswordToken, token)) {
            throw new AppError('重設連結無效', StatusCodes.BAD_REQUEST);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // [原子化更新] 將過期檢查放進 where 條件中
        const result = await prisma.user.updateMany({
            where: {
                id: user.id,
                resetPasswordToken: user.resetPasswordToken,
                resetPasswordTokenExpiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordTokenExpiresAt: null,
            },
        });

        if (result.count === 0) {
            throw new AppError('重設連結已過期或失效，請重新申請', StatusCodes.BAD_REQUEST);
        }

        return { message: '密碼重設成功，請使用新密碼登入' };
    }
}