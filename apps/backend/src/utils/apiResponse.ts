//apiResponse.ts
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@shop/shared';

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode: number = StatusCodes.OK) => {
    const response: ApiResponse<T> = {
        success: true,
        data,
        message,
    };
    res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode: number = StatusCodes.BAD_REQUEST, error?: any) => {
    const response: ApiResponse<null> = {
        success: false,
        message,
        error,
    };
    res.status(statusCode).json(response);
};
