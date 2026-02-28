// auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, verificationSchema, resetPasswordSchema, requestPasswordResetSchema } from '../schemas/auth.schema';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
    // 1. 驗證資料格式
    const validatedData = registerSchema.parse(req.body);

    // 2. 呼叫 Service
    const result = await AuthService.register(validatedData);

    // 3. 回傳成功
    res.status(StatusCodes.CREATED).json({
        status: 'success',
        data: result,
    });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);
    const result = await AuthService.login(validatedData);

    // 設定 HTTP-only Cookie
    res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
        signed: true // [SECURITY] 使用 Signed Cookie 滿足 CodeQL 靜態分析安全要求並強化防禦
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
            user: result.user
        },
    });
});

export const logout = (req: Request, res: Response) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        signed: true // 對應簽署過的 Cookie
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: '登出成功'
    });
};

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    // 從 Query String 取得資料，並使用 Zod 驗證格式
    const { token, email } = verificationSchema.parse(req.query);

    const result = await AuthService.verifyEmail(token, email);

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: result.message
    });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
    const { email } = requestPasswordResetSchema.parse(req.body);

    const result = await AuthService.resendVerification(email);
    res.status(StatusCodes.OK).json({ status: 'success', message: result.message });
});

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = requestPasswordResetSchema.parse(req.body);

    const result = await AuthService.requestPasswordReset(email);
    res.status(StatusCodes.OK).json({ status: 'success', message: result.message });
});

export const verifyResetToken = asyncHandler(async (req: Request, res: Response) => {
    const { token, email } = verificationSchema.parse(req.query);

    const result = await AuthService.verifyResetToken(token, email);
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    // [SECURITY] 這裡優先從 Body 取得 Token 與 密碼
    const { token, password } = resetPasswordSchema.parse(req.body);

    // [SECURITY補強] 用戶可能會從 URL Query 傳入 Email，或是我們從 Token 內部/資料庫中查找
    // 這裡我們維持 Service 的介面，但讓 Controller 也能同時處理 Query 參數作為輔助（用於時序安全比對）
    const email = (req.body.email || req.query.email) as string | undefined;

    const result = await AuthService.resetPassword(token, password, email);
    res.status(StatusCodes.OK).json({ status: 'success', message: result.message });
});