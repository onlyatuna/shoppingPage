import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema';
import { StatusCodes } from 'http-status-codes';

export const getAll = async (req: Request, res: Response) => {
    const categories = await CategoryService.findAll();
    res.json({ status: 'success', data: categories });
};

export const create = async (req: Request, res: Response) => {
    try {
        const data = createCategorySchema.parse(req.body);
        const category = await CategoryService.create(data);
        res.status(StatusCodes.CREATED).json({ status: 'success', data: category });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const data = updateCategorySchema.parse(req.body);
        const category = await CategoryService.update(id, data);
        res.json({ status: 'success', data: category });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        await CategoryService.delete(id);
        res.json({ status: 'success', message: '刪除成功' });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
    }
};