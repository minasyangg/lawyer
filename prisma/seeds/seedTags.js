const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const tags = [
    { name: 'Семейное право', color: '#ef4444' },
    { name: 'Уголовное право', color: '#8b5cf6' },
    { name: 'Гражданское право', color: '#10b981' },
    { name: 'Трудовое право', color: '#f59e0b' },
    { name: 'Налоговое право', color: '#3b82f6' }
  ];

  for (const tagData of tags) {
    const slug = tagData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    await prisma.tag.create({
      data: {
        name: tagData.name,
        slug,
        color: tagData.color
      }
    });
  }

  console.log('Tags seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });