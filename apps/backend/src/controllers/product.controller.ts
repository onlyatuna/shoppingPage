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

export const getProduct = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        let product;

        // Check if key is numeric (and not just a slug that happens to be a number, though unlikely given slug rules)
        // Strong assumption: IDs are numeric, Slugs are strings.
        // Actually, simple regex check: if purely digits, treat as ID.
        if (/^\d+$/.test(key)) {
            product = await ProductService.findById(Number(key));
        } else {
            product = await ProductService.findBySlug(key);
        }

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
        console.log(`Updating Product ${id} Payload:`, JSON.stringify(req.body, null, 2));
        const data = createProductSchema.partial().parse(req.body); // partial() 允許只傳部分欄位
        const product = await ProductService.update(id, data);
        res.json({ status: 'success', data: product });
    } catch (error) {
        console.error('Update Product Error:', error);
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