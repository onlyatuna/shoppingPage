//product.repository.ts
import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export class ProductRepository {
    async findAll() {
        return prisma.product.findMany({
            include: { category: true },
        });
    }

    async findById(id: number) {
        return prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });
    }

    async create(data: Prisma.ProductCreateInput) {
        return prisma.product.create({
            data,
        });
    }

    async update(id: number, data: Prisma.ProductUpdateInput) {
        return prisma.product.update({
            where: { id },
            data,
        });
    }

    async delete(id: number) {
        return prisma.product.delete({
            where: { id },
        });
    }
}
