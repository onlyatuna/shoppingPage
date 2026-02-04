//auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Email 格式不正確'),
    password: z.string()
        .min(8, '密碼長度至少需要 8 個字元')
        .regex(/[A-Z]/, '密碼必須包含至少一個大寫字母')
        .regex(/[a-z]/, '密碼必須包含至少一個小寫字母')
        .regex(/[0-9]/, '密碼必須包含至少一個數字')
        .regex(/[^A-Za-z0-9]/, '密碼必須包含至少一個特殊字元'),
    name: z.string().min(2, '名字至少需要 2 個字元').optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Email 格式不正確'),
    password: z.string(),
});
