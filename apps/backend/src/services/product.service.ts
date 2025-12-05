//product.service.ts
import { prisma } from '../utils/prisma';
import { createProductSchema, queryProductSchema } from '../schemas/product.schema';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

type CreateProductInput = z.infer<typeof createProductSchema>;
type QueryProductInput = z.infer<typeof queryProductSchema>;

export class ProductService {

    // --- 取得商品列表 (含分頁、搜尋、分類篩選) ---
    static async findAll(query: QueryProductInput) {
        const { page, limit, search, categoryId } = query;
        const skip = (page - 1) * limit;

        // 建立查詢條件
        const where: Prisma.ProductWhereInput = {
            isActive: true, // 只顯示上架商品
            deletedAt: null, // [新增] 排除已刪除
            AND: [
                // 搜尋名稱
                search ? { name: { contains: search } } : {},
                // 篩選分類
                categoryId ? { categoryId } : {},
            ],
        };

        // 同時執行兩個查詢：總數 (算頁數用) 與 資料
        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }, // 新的在前
                include: { category: true },    // 關聯撈出分類資料
            }),
        ]);

        return {
            data: products,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // --- 取得單一商品詳情 ---
    static async findById(id: number) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!product || product.deletedAt) throw new Error('找不到該商品'); // [新增] 檢查是否已刪除
        return product;
    }

    // [新增] 給後台用：撈出所有商品 (包含下架)，並支援搜尋
    static async findAllAdmin(search?: string) {
        const where: Prisma.ProductWhereInput = {
            deletedAt: null, // [新增] 排除已刪除
            ...(search ? { name: { contains: search } } : {})
        };

        return prisma.product.findMany({
            where,
            orderBy: { id: 'desc' }, // 新的在前
            include: { category: true },
        });
    }

    // --- 新增商品 (Admin) ---
    static async create(data: CreateProductInput) {
        // 檢查分類是否存在
        const categoryExists = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });
        if (!categoryExists) throw new Error('分類不存在');

        return prisma.product.create({
            data: {
                ...data,
                images: data.images ?? [], // 處理 JSON 欄位
            },
        });
    }

    // --- 更新商品 (Admin) ---
    static async update(id: number, data: Partial<CreateProductInput>) {
        return prisma.product.update({
            where: { id },
            data: {
                ...data,
                images: data.images ?? undefined,
            },
        });
    }

    // --- 刪除商品 (軟刪除) ---
    static async delete(id: number) {
        return prisma.product.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: new Date() // [新增] 設定刪除時間
            },
        });
    }
}