import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { EmailService } from './email.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {

    // --- 註冊 (設定 24小時過期) ---
    static async register(data: z.infer<typeof registerSchema>) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) throw new Error('Email 已被註冊');

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

        EmailService.sendVerificationEmail(data.email, verificationToken).catch(console.error);

        return {
            message: '註冊成功！請檢查您的信箱以完成驗證。',
            userId: user.id
        };
    }

    // --- 驗證信箱 (加入過期檢查) ---
    static async verifyEmail(token: string) {
        const user = await prisma.user.findUnique({
            where: { verificationToken: token },
        });

        if (!user) throw new Error('驗證連結無效');

        // [新增] 檢查是否過期
        if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
            throw new Error('驗證連結已過期，請重新申請驗證信');
        }

        // 驗證成功，清除 Token 與時間
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
                verificationTokenExpiresAt: null,
            },
        });

        return { message: '信箱驗證成功！您現在可以登入了。' };
    }

    // --- [補充] 重發驗證信 (Resend) ---
    // 如果連結過期，使用者需要一個 API 來重新取得新連結
    static async resendVerification(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) throw new Error('找不到此信箱');
        if (user.isVerified) throw new Error('此帳號已驗證，請直接登入');

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

        EmailService.sendVerificationEmail(user.email, newToken).catch(console.error);

        return { message: '驗證信已重新發送，請檢查信箱' };
    }

    // --- 登入 ---
    static async login(data: z.infer<typeof loginSchema>) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) throw new Error('帳號或密碼錯誤');

        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) throw new Error('帳號或密碼錯誤');

        if (!user.isVerified) throw new Error('請先至信箱收取驗證信啟用帳號');

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

        EmailService.sendPasswordResetEmail(user.email, resetToken).catch(console.error);

        return { message: '如果該信箱存在，重設密碼連結已發送' };
    }

    // --- 驗證重設密碼 token ---
    static async verifyResetToken(token: string) {
        const user = await prisma.user.findUnique({
            where: { resetPasswordToken: token },
        });

        if (!user) throw new Error('重設連結無效');

        if (user.resetPasswordTokenExpiresAt && user.resetPasswordTokenExpiresAt < new Date()) {
            throw new Error('重設連結已過期，請重新申請');
        }

        return { valid: true, email: user.email };
    }

    // --- 重設密碼 ---
    static async resetPassword(token: string, newPassword: string) {
        const user = await prisma.user.findUnique({
            where: { resetPasswordToken: token },
        });

        if (!user) throw new Error('重設連結無效');

        if (user.resetPasswordTokenExpiresAt && user.resetPasswordTokenExpiresAt < new Date()) {
            throw new Error('重設連結已過期，請重新申請');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordTokenExpiresAt: null,
            },
        });

        return { message: '密碼重設成功，請使用新密碼登入' };
    }
}