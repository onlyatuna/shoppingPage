//user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { updateProfileSchema, adminUpdateUserSchema } from '../schemas/user.schema';
import { StatusCodes } from 'http-status-codes';
import { Role } from '@prisma/client'; // 引入 Role

// [Developer] 取得所有使用者
export const getAllUsers = async (req: Request, res: Response) => {
    const { search } = req.query;
    const users = await UserService.findAll(search as string | undefined);
    res.json({ status: 'success', data: users });
};

// [User] 取得個人資料
export const getProfile = async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await UserService.findById(userId);
    res.json({ status: 'success', data: user });
};

// [User] 更新個人資料
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const validatedData = updateProfileSchema.parse(req.body);
        const updatedUser = await UserService.updateProfile(userId, validatedData);
        res.json({ status: 'success', data: updatedUser, message: '資料更新成功' });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

// [Admin] 更新使用者權限
export const updateUserRole = async (req: Request, res: Response) => {
    try {
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
        const parsedBody = adminUpdateUserSchema.parse(req.body);

        // 2. 取出 role
        const { role } = parsedBody;

        // 3. [關鍵修復] 手動檢查 undefined
        // 因為 Zod schema 設為 optional，這裡要防呆
        if (!role) {
            throw new Error('必須提供 Role 欄位');
        }

        // 4. 現在 TS 知道 role 一定有值，且是 Role 型別
        const user = await UserService.updateRole(requesterRole, targetUserId, role);

        res.json({ status: 'success', data: user });
    } catch (error: any) {
        console.error('Update Role Error:', error);
        res.status(StatusCodes.FORBIDDEN).json({ message: error.message });
    }
};

// [Admin] 刪除使用者
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const requesterId = req.user!.userId;
        const requesterRole = req.user!.role as Role;
        const targetUserId = Number(req.params.id);

        await UserService.deleteUser(requesterId, requesterRole, targetUserId);
        res.json({ status: 'success', message: '使用者已刪除' });
    } catch (error: any) {
        res.status(StatusCodes.FORBIDDEN).json({ message: error.message });
    }
};