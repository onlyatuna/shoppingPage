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
        const user = await AuthService.register(validatedData);

        // 3. 回傳成功
        res.status(StatusCodes.CREATED).json({
            status: 'success',
            data: user,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(StatusCodes.BAD_REQUEST).json({ message: error.issues });
        } else if (error instanceof Error) {
            res.status(StatusCodes.CONFLICT).json({ message: error.message });
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
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({
            message: '帳號或密碼錯誤'
        });
    }
};