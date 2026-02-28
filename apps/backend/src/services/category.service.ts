import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { createCategorySchema } from '../schemas/category.schema';
import { AppError } from '../utils/appError';
import { StatusCodes } from 'http-status-codes';

type CategoryInput = z.infer<typeof createCategorySchema>;

export class CategoryService {
    // [Optimization] Memory Cache for categories - cleared on mutations.
    private static cache: any = null;
    private static cacheTime: number = 0;
    private static CACHE_TTL = 60000; // 60 seconds

    // --- 取得所有分類 (含緩存與商品計數) ---
    static async findAll(includeInactive: boolean = false) {
        // Simple Memory Cache Implementation
        const now = Date.now();
        if (this.cache && !includeInactive && (now - this.cacheTime < this.CACHE_TTL)) {
            return this.cache;
        }

        const countCondition = includeInactive ? {} : { isActive: true };

        const categories = await prisma.category.findMany({
            where: { deletedAt: null } as any,
            include: {
                _count: {
                    select: {
                        products: {
                            where: {
                                deletedAt: null,
                                ...countCondition
                            }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Store in cache for requester only (front-end view)
        if (!includeInactive) {
            this.cache = categories;
            this.cacheTime = now;
        }

        return categories;
    }

    private static clearCache() {
        this.cache = null;
        this.cacheTime = 0;
    }

    static async create(data: CategoryInput) {
        // 檢查 Slug 是否重複
        const exists = await prisma.category.findUnique({ where: { slug: data.slug } });
        if (exists) throw new AppError('Slug 已存在', StatusCodes.CONFLICT);

        this.clearCache();
        return prisma.category.create({ data });
    }

    static async update(id: number, data: Partial<CategoryInput>) {
        this.clearCache();
        return prisma.category.update({ where: { id }, data });
    }

    // --- [智慧處理] 獲取或建立「未分類」項目的 ID ---
    private static async ensureUncategorized(): Promise<number> {
        const UNC_SLUG = 'uncategorized';
        const uncategorized = await prisma.category.findUnique({
            where: { slug: UNC_SLUG }
        });

        if (uncategorized) {
            // 如果已被軟刪除，將其復原
            if (uncategorized.deletedAt) {
                await prisma.category.update({
                    where: { id: uncategorized.id },
                    data: { deletedAt: null }
                });
                this.clearCache();
            }
            return uncategorized.id;
        }

        // 建立一個隱形的或系統用的預設分類
        const created = await prisma.category.create({
            data: {
                name: '未分類',
                slug: UNC_SLUG,
            }
        });
        return created.id;
    }

    // --- [修改] 智慧刪除邏輯：防止孤兒商品 (Orphaned Products) ---
    static async delete(id: number) {
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) throw new AppError('分類不存在', StatusCodes.NOT_FOUND);

        // [Security] 禁止刪除「未分類」預設分組
        if (category.slug === 'uncategorized') {
            throw new AppError('無法刪除預設的「未分類」項目', StatusCodes.FORBIDDEN);
        }

        // 1. 檢查是否有「尚未刪除」的商品
        const orphanedProductsCount = await prisma.product.count({
            where: { categoryId: id, deletedAt: null }
        });

        if (orphanedProductsCount > 0) {
            // [UX Optimization] 自動將商品移往「未分類」項目
            const uncategorizedId = await this.ensureUncategorized();

            await prisma.product.updateMany({
                where: { categoryId: id, deletedAt: null },
                data: { categoryId: uncategorizedId }
            });

            console.log(`已將 ${orphanedProductsCount} 個商品移至「未分類」項目 (${uncategorizedId})。`);
        }

        // 2. 執行軟刪除
        this.clearCache();
        const updateData: any = {
            deletedAt: new Date(),
            slug: `${category.slug}-deleted-${Date.now()}`
        };

        return prisma.category.update({
            where: { id },
            data: updateData
        });
    }
}