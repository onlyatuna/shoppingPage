//product.controller.ts
import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { createProductSchema, queryProductSchema } from '../schemas/product.schema';
import { StatusCodes } from 'http-status-codes';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const query = queryProductSchema.parse(req.query); // 驗證並轉換 query params
        const result = await ProductService.findAll(query);
        res.json({ status: 'success', ...result });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '取得列表失敗' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const product = await ProductService.findById(id);
        res.json({ status: 'success', data: product });
    } catch (error) {
        res.status(StatusCodes.NOT_FOUND).json({ message: '找不到商品' });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const data = createProductSchema.parse(req.body);
        const product = await ProductService.create(data);
        res.status(StatusCodes.CREATED).json({ status: 'success', data: product });
    } catch (error: any) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: error.message || '輸入資料錯誤' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const data = createProductSchema.partial().parse(req.body); // partial() 允許只傳部分欄位
        const product = await ProductService.update(id, data);
        res.json({ status: 'success', data: product });
    } catch (error) {
        res.status(StatusCodes.BAD_REQUEST).json({ message: '更新失敗' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        await ProductService.delete(id);
        res.status(StatusCodes.NO_CONTENT).send(); // 204 No Content
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '刪除失敗' });
    }
};

export const getAdminProducts = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        const products = await ProductService.findAllAdmin(search as string);
        res.json({ status: 'success', data: products });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '取得列表失敗' });
    }
};