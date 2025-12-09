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
            where: { categoryId: id, isActive: true }
        });

        if (activeProductsCount > 0) {
            throw new Error(`該分類下還有 ${activeProductsCount} 個上架商品，請先轉移或下架`);
        }

        // 2. 如果只剩下「已下架 (Soft Deleted)」的商品，我們就執行「硬刪除」
        // 使用 Transaction 確保乾淨
        return prisma.$transaction(async (tx) => {
            // 先清空該分類下的所有商品 (反正都是下架的垃圾資料了)
            await tx.product.deleteMany({
                where: { categoryId: id }
            });

            // 再刪除分類
            return tx.category.delete({
                where: { id }
            });
        });
    }
}