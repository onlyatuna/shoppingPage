// apps/backend/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { updateProfileSchema, adminUpdateUserSchema } from '../schemas/user.schema';
import { StatusCodes } from 'http-status-codes';
import { Role } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';

// [Developer] 取得所有使用者
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { search } = req.query;
    const users = await UserService.findAll(search as string | undefined);
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
    const requesterId = req.user!.userId;
    const requesterRole = req.user!.role as Role;
    const targetUserId = Number(req.params.id);

    // [Security] 防止使用者修改自己的權限
    if (requesterId === targetUserId) {
        return res.status(StatusCodes.FORBIDDEN).json({
            message: '無法修改自己的權限'
        });
    }

    // 1. 先用 Zod 解析，確保格式正確
    const { role } = adminUpdateUserSchema.parse(req.body);

    if (!role) {
        throw new Error('必須提供 Role 欄位');
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
    res.json({ status: 'success', message: '使用者已刪除' });
});