// apps/backend/src/utils/appError.ts
import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = StatusCodes.BAD_REQUEST) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // 用於區分預期內的業務錯誤與未預期的程式錯誤

        Error.captureStackTrace(this, this.constructor);
    }
}
