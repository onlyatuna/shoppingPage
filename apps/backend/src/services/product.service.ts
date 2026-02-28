//product.service.ts
import { prisma } from '../utils/prisma';
import { createProductSchema, queryProductSchema } from '../schemas/product.schema';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import { AppError } from '../utils/appError';
import { StatusCodes } from 'http-status-codes';

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
            include: {
                category: true,
            },
        });
        if (!product || product.deletedAt) throw new AppError('找不到該商品', StatusCodes.NOT_FOUND); // [新增] 檢查是否已刪除
        return product;
    }

    // --- 透過 Slug 取得單一商品詳情 ---
    static async findBySlug(slug: string) {
        const product = await prisma.product.findUnique({
            where: { slug },
            include: {
                category: true,
            },
        });
        if (!product || product.deletedAt) throw new AppError('找不到該商品', StatusCodes.NOT_FOUND);
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
            include: { category: true }, // Admin List doesn't necessarily need variants, but good for potential filtering
        });
    }

    // --- 新增商品 (Admin) ---
    static async create(data: CreateProductInput) {
        // [Security Enhancement] 檢查分類是否存在且未被刪除
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });
        if (!category || category.deletedAt) {
            throw new AppError('分類不存在或已被刪除', StatusCodes.NOT_FOUND);
        }

        // 生成 Slug
        const baseSlug = slugify(data.name, { lower: true, strict: true });
        const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

        const createData: any = {
            ...data,
            slug,
            images: data.images ?? [],
            options: data.options ?? [],
            variants: data.variants ?? [],
        };

        return prisma.product.create({
            data: createData,
        });
    }

    // --- 更新商品 (Admin) ---
    static async update(id: number, data: Partial<CreateProductInput>) {
        // [Security Enhancement] 如果有提供 categoryId，檢查分類是否存在且未被刪除
        if (data.categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: data.categoryId },
            });
            if (!category || category.deletedAt) {
                throw new AppError('分類不存在或已被刪除', StatusCodes.NOT_FOUND);
            }
        }

        const updateData: any = {
            ...data,
            images: data.images ?? undefined,
            options: data.options ?? undefined,
            variants: data.variants ?? undefined,
        };

        // 如果名稱有變動，同步更新 Slug
        if (data.name) {
            const baseSlug = slugify(data.name, { lower: true, strict: true });
            updateData.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
        }

        return prisma.product.update({
            where: { id },
            data: updateData,
        });
    }

    // --- 刪除商品 (軟刪除) ---
    static async delete(id: number) {
        // 先找出該商品以獲取原始 slug
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new AppError('找不到該商品', StatusCodes.NOT_FOUND);

        return prisma.product.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: new Date(), // [新增] 設定刪除時間
                slug: `${product.slug}-deleted-${Date.now()}` // [修正] 改名釋放 slug
            },
        });
    }
}