//user.schema.ts
import { z } from 'zod';
import { Role } from '@prisma/client';

// 使用者更新自己的資料
export const updateProfileSchema = z.object({
    name: z.string().min(2, '名字至少需要 2 個字元').max(100, '名字過長').optional(),
    oldPassword: z.string().trim().min(1, '必須提供舊密碼以更新密碼').optional(),
    password: z.string().trim().min(6, '密碼長度至少需要 6 個字元').max(100, '密碼過長').optional(), // 密碼是選填的
    // 這裡不允許更新 email 或 role
}).refine((data) => {
    // 如果傳了新密碼，就必須傳舊密碼
    if (data.password && !data.oldPassword) {
        return false;
    }
    return true;
}, {
    message: "更新密碼時必須提供舊密碼",
    path: ["oldPassword"]
});

// 管理員更新使用者 (例如改權限)
export const adminUpdateUserSchema = z.object({
    role: z.enum([Role.USER, Role.ADMIN, Role.DEVELOPER]),
});