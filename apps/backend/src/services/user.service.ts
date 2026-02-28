//user.service.ts
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { AppError } from '../utils/appError';
import { StatusCodes } from 'http-status-codes';

export class UserService {
    // --- 1. 取得所有使用者 (Developer) ---
    static async findAll(searchQuery?: string, skip = 0, take = 20) {
        const whereClause = searchQuery ? {
            OR: [
                { email: { contains: searchQuery, mode: 'insensitive' as const } },
                { name: { contains: searchQuery, mode: 'insensitive' as const } }
            ]
        } : {};

        return prisma.user.findMany({
            where: whereClause,
            skip,
            take,
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
    static async updateProfile(userId: number, data: { name?: string; oldPassword?: string; password?: string }) {
        const updateData: any = {};

        if (data.name) updateData.name = data.name;

        // 如果要更新密碼，實施加固邏輯
        if (data.password) {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true }
            });

            if (!currentUser) throw new AppError('使用者不存在', StatusCodes.NOT_FOUND);
            if (!data.oldPassword) throw new AppError('更新密碼必須提供舊密碼', StatusCodes.BAD_REQUEST);

            // [Security] 比對舊密碼，防止時序攻擊與未授權修改
            const isMatch = await bcrypt.compare(data.oldPassword, currentUser.password);
            if (!isMatch) throw new AppError('舊密碼提供錯誤', StatusCodes.BAD_REQUEST);

            // 加密新密碼
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        // 如果沒有任何資料要更新，直接回傳當前資料
        if (Object.keys(updateData).length === 0) {
            const user = await this.findById(userId);
            if (!user) throw new AppError('使用者不存在', StatusCodes.NOT_FOUND);
            return user;
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
        if (!targetUser) throw new AppError('使用者不存在', StatusCodes.NOT_FOUND);

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
            throw new AppError('無法刪除自己的帳號', StatusCodes.BAD_REQUEST);
        }

        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) throw new AppError('使用者不存在', StatusCodes.NOT_FOUND);

        // 只有 DEVELOPER 才能執行此功能 (在 route 層已檢查)
        // DEVELOPER 可以刪除任何人 (除了自己)

        // 執行刪除
        return prisma.user.delete({
            where: { id: targetUserId }
        });
    }

    // --- 6. 手動驗證使用者電子信箱 (Developer) ---
    static async manualVerifyEmail(targetUserId: number) {
        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, isVerified: true }
        });

        if (!user) throw new AppError('使用者不存在', StatusCodes.NOT_FOUND);
        if (user.isVerified) throw new AppError('該使用者電子信箱已驗證', StatusCodes.BAD_REQUEST);

        return prisma.user.update({
            where: { id: targetUserId },
            data: {
                isVerified: true,
                verificationToken: null,
                verificationTokenExpiresAt: null,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isVerified: true,
                updatedAt: true
            }
        });
    }
}