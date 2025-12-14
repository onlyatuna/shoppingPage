
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: { id: true, name: true, slug: true }
    });

    console.log('--- Product Slugs Check ---');
    products.forEach(p => {
        console.log(`ID: ${p.id}, Name: ${p.name}, Slug: '${p.slug}'`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
