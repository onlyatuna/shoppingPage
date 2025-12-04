import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { createCategorySchema } from '../schemas/category.schema';

type CategoryInput = z.infer<typeof createCategorySchema>;

export class CategoryService {
    static async findAll() {
        return prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        // [關鍵修正] 只計算 isActive 為 true 的商品
                        products: {
                            where: { isActive: true }
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

    static async delete(id: number) {
        // 檢查是否還有商品關聯，避免刪除導致資料庫錯誤
        const category = await prisma.category.findUnique({
            where: { id },
            include: { _count: { select: { products: true } } }
        });

        if (category && category._count.products > 0) {
            throw new Error(`該分類下還有 ${category._count.products} 個商品，無法刪除`);
        }

        return prisma.category.delete({ where: { id } });
    }
}