
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string, id: number) {
    // Remove non-ASCII, toLowerCase, replace space with hyphen
    let slug = text.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // keep only alphanumeric space hyphen
        .trim()
        .replace(/\s+/g, '-');

    if (slug.length === 0) {
        return `product-${id}`;
    }

    // Append ID to ensure uniqueness and "no just number" (though name might be empty)
    // Actually, appending ID is safe.
    return `${slug}-${id}`;
}

async function main() {
    const products = await prisma.product.findMany();

    console.log('--- Fixing Slugs ---');
    for (const p of products) {
        const newSlug = slugify(p.name, p.id);
        if (newSlug !== p.slug) {
            console.log(`Updating ID ${p.id}: ${p.slug} -> ${newSlug}`);
            await prisma.product.update({
                where: { id: p.id },
                data: { slug: newSlug }
            });
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
