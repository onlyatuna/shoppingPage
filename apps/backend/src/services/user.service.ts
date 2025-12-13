//user.service.ts
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export class UserService {
    // --- 1. 取得所有使用者 (Developer) ---
    static async findAll(searchQuery?: string) {
        const whereClause = searchQuery ? {
            OR: [
                { email: { contains: searchQuery, mode: 'insensitive' as const } },
                { name: { contains: searchQuery, mode: 'insensitive' as const } }
            ]
        } : {};

        return prisma.user.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            select: { // 只回傳安全欄位
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                _count: { select: { orders: true } } //順便算一下訂單數
            }
        });
    }

    // --- 2. 取得個人資料 ---
    static async findById(id: number) {
        return prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true, role: true }
        });
    }

    // --- 3. 更新個人資料 (User) ---
    static async updateProfile(userId: number, data: { name?: string; password?: string }) {
        const updateData: any = {};

        if (data.name) updateData.name = data.name;

        // 如果有傳密碼，要重新加密
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        return prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, email: true, name: true, role: true }
        });
    }

    // --- 4. 更新使用者權限 (權限檢查邏輯) ---
    static async updateRole(requesterRole: Role, targetUserId: number, newRole: Role) {
        // 1. 先查出目標對象是誰
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) throw new Error('使用者不存在');

        // 2. 只有 DEVELOPER 才能執行此功能 (在 route 層已檢查)
        // 不需要額外的權限限制，DEVELOPER 可以修改任何人的權限

        // 3. 執行更新
        return prisma.user.update({
            where: { id: targetUserId },
            data: { role: newRole },
            select: { id: true, email: true, name: true, role: true }
        });
    }

    // --- 5. 刪除使用者 (權限檢查邏輯) ---
    static async deleteUser(requesterId: number, requesterRole: Role, targetUserId: number) {
        // 防止刪除自己
        if (targetUserId === requesterId) {
            throw new Error('無法刪除自己的帳號');
        }

        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) throw new Error('使用者不存在');

        // 只有 DEVELOPER 才能執行此功能 (在 route 層已檢查)
        // DEVELOPER 可以刪除任何人 (除了自己)

        // 執行刪除
        return prisma.user.delete({
            where: { id: targetUserId }
        });
    }
}