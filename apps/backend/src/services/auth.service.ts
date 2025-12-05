//auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { z } from 'zod';

// 定義 JWT 的內容結構
interface JWTPayload {
    userId: number;
    role: string;
}

export class AuthService {
    // --- 註冊 ---
    static async register(data: z.infer<typeof registerSchema>) {
        // 1. 檢查 Email 是否已被註冊
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new Error('Email 已被註冊');
        }

        // 2. 密碼加密 (Hash)
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 3. 寫入資料庫
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: 'USER', // 預設是一般使用者
                // 自動建立一個空的購物車
                cart: {
                    create: {}
                }
            },
            select: { id: true, email: true, name: true, role: true }, // 不回傳 password
        });

        return user;
    }

    // --- 登入 ---
    static async login(data: z.infer<typeof loginSchema>) {
        // 1. 找使用者
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new Error('帳號或密碼錯誤');
        }

        // 2. 比對密碼
        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) {
            throw new Error('帳號或密碼錯誤');
        }

        // 3. 簽發 JWT Token
        const payload: JWTPayload = { userId: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
            expiresIn: '1d', // Token 1 天後過期
        });

        return {
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        };
    }
}