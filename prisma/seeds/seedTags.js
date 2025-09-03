const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
	const tags = [
		{ name: 'Консультация', color: '#FF5733' },
		{ name: 'Суд', color: '#33FF57' },
		{ name: 'Документы', color: '#5733FF' },
		{ name: 'Срочно', color: '#FF3333' },
		{ name: 'Важно', color: '#33FFFF' }
	];

	for (const tag of tags) {
		const { name, color } = tag;
		
		// Create URL-friendly slug from name
		const slug = name
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/-+/g, '-')
			.trim();

		await prisma.tag.upsert({
			where: { slug },
			update: { name, color },
			create: {
				name,
				slug,
				color
			}
		});
	}

	console.log('Tags seeded successfully');
}

main()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
