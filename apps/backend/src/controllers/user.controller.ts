// apps/backend/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { updateProfileSchema, adminUpdateUserSchema } from '../schemas/user.schema';
import { StatusCodes } from 'http-status-codes';
import { Role } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { DevLogService } from '../services/devLog.service';

// [Developer] 取得所有使用者
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { search, skip, take } = req.query;

    // 分頁防禦：限制每次最多取 100 筆
    const requestedTake = Number(take) || 20;
    const finalTake = Math.min(requestedTake, 100);

    const users = await UserService.findAll(
        search as string | undefined,
        skip ? Number(skip) : 0,
        finalTake
    );
    res.json({ status: 'success', data: users });
});

// [User] 取得個人資料
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await UserService.findById(userId);
    res.json({ status: 'success', data: user });
});

// [User] 更新個人資料
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const validatedData = updateProfileSchema.parse(req.body);
    const updatedUser = await UserService.updateProfile(userId, validatedData);
    res.json({ status: 'success', data: updatedUser, message: '資料更新成功' });
});

// [Admin] 更新使用者權限
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    // 1. 先用 Zod 解析，確保格式正確
    const { role } = adminUpdateUserSchema.parse(req.body);

    if (!role) {
        throw new Error('必須提供 Role 欄位');
    }

    const requesterId = req.user!.userId;
    const requesterRole = req.user!.role as Role;
    const targetUserId = Number(req.params.id);

    // [Security] 防止使用者修改自己的權限
    if (requesterId === targetUserId) {
        return res.status(StatusCodes.FORBIDDEN).json({
            message: '無法修改自己的權限'
        });
    }

    const user = await UserService.updateRole(requesterRole, targetUserId, role);
    res.json({ status: 'success', data: user });
});

// [Admin] 刪除使用者
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const requesterId = req.user!.userId;
    const requesterRole = req.user!.role as Role;
    const targetUserId = Number(req.params.id);

    await UserService.deleteUser(requesterId, requesterRole, targetUserId);
    res.json({ status: 'success', message: '使用者已刪除', data: { id: targetUserId } });
});

// [Developer] 手動驗證使用者
export const manualVerifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const developerId = req.user!.userId;
    const targetUserId = Number(req.params.id);

    if (isNaN(targetUserId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: '無效的使用者 ID' });
    }

    const updatedUser = await UserService.manualVerifyEmail(targetUserId);

    // [Security] 稽核日誌
    DevLogService.log('MANUAL_VERIFY_USER', developerId, '手動驗證使用者', {
        targetUserId,
        targetEmail: updatedUser.email
    });

    res.json({
        status: 'success',
        data: updatedUser,
        message: '使用者已成功手動驗證'
    });
});