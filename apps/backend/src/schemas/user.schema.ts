//user.schema.ts
import { z } from 'zod';
import { Role } from '@prisma/client';

// 使用者更新自己的資料
export const updateProfileSchema = z.object({
    name: z.string().min(2, '名字至少需要 2 個字元').optional(),
    password: z.string().min(6, '密碼長度至少需要 6 個字元').optional(), // 密碼是選填的
    // 這裡不允許更新 email 或 role
});

// 管理員更新使用者 (例如改權限)
export const adminUpdateUserSchema = z.object({
    role: z.enum([Role.USER, Role.ADMIN, Role.DEVELOPER]),
});