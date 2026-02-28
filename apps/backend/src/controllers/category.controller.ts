// apps/backend/src/controllers/category.controller.ts
import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';

export const getAll = asyncHandler(async (req: Request, res: Response) => {
    const isForAdmin = req.query.scope === 'admin';
    const categories = await CategoryService.findAll(isForAdmin);
    res.json({ status: 'success', data: categories });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
    const data = createCategorySchema.parse(req.body);
    const category = await CategoryService.create(data);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: category });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = updateCategorySchema.parse(req.body);
    const category = await CategoryService.update(id, data);
    res.json({ status: 'success', data: category });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await CategoryService.delete(id);
    res.json({ status: 'success', message: '刪除成功' });
});