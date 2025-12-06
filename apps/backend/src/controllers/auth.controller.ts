// auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

export const register = async (req: Request, res: Response) => {
    try {
        // 1. 驗證資料格式
        const validatedData = registerSchema.parse(req.body);

        // 2. 呼叫 Service
        const result = await AuthService.register(validatedData);

        // 3. 回傳成功
        res.status(StatusCodes.CREATED).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.issues });
        } else if (error instanceof Error) {
            // 處理業務邏輯錯誤 (如: Email 重複)
            const status = error.message.includes('已被註冊') ? StatusCodes.CONFLICT : StatusCodes.BAD_REQUEST;
            res.status(status).json({ message: error.message });
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '系統錯誤' });
        }
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const result = await AuthService.login(validatedData);

        res.status(StatusCodes.OK).json({
            status: 'success',
            data: result,
        });
    } catch (error: any) {
        // 針對不同錯誤回傳不同狀態碼
        if (error.message === '請先至信箱收取驗證信啟用帳號') {
            res.status(StatusCodes.FORBIDDEN).json({ message: error.message });
        } else {
            res.status(StatusCodes.UNAUTHORIZED).json({
                message: error.message || '帳號或密碼錯誤'
            });
        }
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const token = req.query.token as string;

        if (!token) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: '無效的驗證請求' });
            return;
        }

        const result = await AuthService.verifyEmail(token);

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: result.message
        });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({
            message: error.message || '驗證失敗'
        });
    }
};

export const resendVerification = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) throw new Error('Email is required');
        
        const result = await AuthService.resendVerification(email);
        res.status(StatusCodes.OK).json({ status: 'success', message: result.message });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) throw new Error('Email is required');
        
        const result = await AuthService.requestPasswordReset(email);
        res.status(StatusCodes.OK).json({ status: 'success', message: result.message });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

export const verifyResetToken = async (req: Request, res: Response) => {
    try {
        const token = req.query.token as string;
        if (!token) throw new Error('Token is required');
        
        const result = await AuthService.verifyResetToken(token);
        res.status(StatusCodes.OK).json({ status: 'success', data: result });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) throw new Error('Token and password are required');
        
        const result = await AuthService.resetPassword(token, password);
        res.status(StatusCodes.OK).json({ status: 'success', message: result.message });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};