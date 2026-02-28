// apps/backend/src/controllers/product.controller.ts
import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { createProductSchema, queryProductSchema } from '../schemas/product.schema';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const query = queryProductSchema.parse(req.query); // 驗證並轉換 query params
    const result = await ProductService.findAll(query);
    res.json({ status: 'success', ...result });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
    const { key } = req.params;
    let product;

    // 如果 key 是純數字，先試 ID，再試 Slug
    if (/^\d+$/.test(key)) {
        try {
            product = await ProductService.findById(Number(key));
        } catch (_e) {
            product = await ProductService.findBySlug(key);
        }
    } else {
        product = await ProductService.findBySlug(key);
    }

    res.json({ status: 'success', data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const data = createProductSchema.parse(req.body);
    const product = await ProductService.create(data);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = createProductSchema.partial().parse(req.body);
    const product = await ProductService.update(id, data);
    res.json({ status: 'success', data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await ProductService.delete(id);
    res.status(StatusCodes.NO_CONTENT).send();
});

export const getAdminProducts = asyncHandler(async (req: Request, res: Response) => {
    const { search } = req.query;
    const products = await ProductService.findAllAdmin(search as string);
    res.json({ status: 'success', data: products });
});