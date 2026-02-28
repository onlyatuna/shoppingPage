//auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Email 格式不正確').max(255, 'Email 過長'),
    password: z.string()
        .trim()
        .min(8, '密碼長度至少需要 8 個字元')
        .max(100, '密碼過長')
        .regex(/[A-Z]/, '密碼必須包含至少一個大寫字母')
        .regex(/[a-z]/, '密碼必須包含至少一個小寫字母')
        .regex(/[0-9]/, '密碼必須包含至少一個數字')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, '密碼必須包含至少一個特殊字元'),
    name: z.string().min(2, '名字至少需要 2 個字元').max(100, '名字過長').optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Email 格式不正確').max(255, 'Email 過長'),
    password: z.string().trim().max(100, '密碼過長'),
});

export const verificationSchema = z.object({
    token: z.string().min(1, 'Token is required').max(255).regex(/^[a-f0-9]{64}$/, 'Invalid token format'),
    email: z.string().email().optional(),
});

export const requestPasswordResetSchema = z.object({
    email: z.string().email('Email 格式不正確').max(255, 'Email 過長'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required').max(255).regex(/^[a-f0-9]{64}$/, 'Invalid token format'),
    password: z.string()
        .trim()
        .min(8, '密碼長度至少需要 8 個字元')
        .max(100, '密碼過長')
        .regex(/[A-Z]/, '密碼必須包含至少一個大寫字母')
        .regex(/[a-z]/, '密碼必須包含至少一個小寫字母')
        .regex(/[0-9]/, '密碼必須包含至少一個數字')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, '密碼必須包含至少一個特殊字元'),
});
