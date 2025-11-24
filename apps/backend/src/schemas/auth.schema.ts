import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Email 格式不正確'),
    password: z.string().min(6, '密碼長度至少需要 6 個字元'),
    name: z.string().min(2, '名字至少需要 2 個字元').optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});