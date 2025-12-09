import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // --- 1. 建立預設分類 (使用 upsert 防止重複建立) ---
    const electronics = await prisma.category.upsert({
        where: { slug: 'Muji' },
        update: {},
        create: {
            name: '無印良品',
            slug: 'Muji',
        },
    });

    const clothing = await prisma.category.upsert({
        where: { slug: 'Afternoon Tea LIVING' },
        update: {},
        create: {
            name: 'Afternoon Tea LIVING',
            slug: 'Afternoon Tea LIVING',
        },
    });

    console.log(`✅ Categories created: ${electronics.name}, ${clothing.name}`);

    // --- 2. 建立管理員 (Admin) ---
    const adminPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {}, // 如果已存在就不動
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            password: adminPassword,
            role: 'ADMIN',
            cart: { create: {} } // 順便建購物車
        },
    });
    console.log(`✅ Admin created: ${admin.email} (pwd: admin123)`);

    // --- 3. 建立開發者 (Developer) ---
    const devPassword = await bcrypt.hash('dev123456', 10);

    const dev = await prisma.user.upsert({
        where: { email: 'dev@example.com' },
        update: {},
        create: {
            email: 'dev@example.com',
            name: 'Super Developer',
            password: devPassword,
            role: 'DEVELOPER', // 記得先確認 schema.prisma 有加入這個 Enum
            cart: { create: {} }
        },
    });
    console.log(`✅ Developer created: ${dev.email} (pwd: dev123456)`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });