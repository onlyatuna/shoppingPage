import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { createCategorySchema } from '../schemas/category.schema';

type CategoryInput = z.infer<typeof createCategorySchema>;

export class CategoryService {

    // --- [修改] 支援查看所有商品數量 ---
    // includeInactive: true (後台用，算全部), false (前台用，只算上架)
    static async findAll(includeInactive: boolean = false) {
        // 設定計數的過濾條件
        const countCondition = includeInactive ? {} : { isActive: true };

        return prisma.category.findMany({
            where: { deletedAt: null } as any,
            include: {
                _count: {
                    select: {
                        products: {
                            where: countCondition
                        }
                    }
                }
            }
        });
    }
    static async create(data: CategoryInput) {
        // 檢查 Slug 是否重複
        const exists = await prisma.category.findUnique({ where: { slug: data.slug } });
        if (exists) throw new Error('Slug 已存在');

        return prisma.category.create({ data });
    }

    static async update(id: number, data: Partial<CategoryInput>) {
        return prisma.category.update({ where: { id }, data });
    }

    // --- [修改] 智慧刪除邏輯 ---
    static async delete(id: number) {
        // 1. 檢查是否有「上架中 (Active)」的商品
        // 我們只保護上架中的商品不被誤刪
        const activeProductsCount = await prisma.product.count({
            where: { categoryId: id, isActive: true, deletedAt: null }
        });

        if (activeProductsCount > 0) {
            throw new Error(`該分類下還有 ${activeProductsCount} 個上架商品，請先轉移或下架`);
        }

        // 2. 執行軟刪除
        // 改名 slug 釋放空間，並設定 deletedAt
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) throw new Error('分類不存在');

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