//user.repository.ts
import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export class UserRepository {
    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data: Prisma.UserCreateInput) {
        return prisma.user.create({
            data,
        });
    }
}
