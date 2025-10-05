const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const services = await prisma.service.findMany()
  console.log('\n📋 Услуги в БД:\n')
  services.forEach(s => {
    console.log(`ID: ${s.id} | Название: "${s.title}" | Hero: ${s.heroImage || 'не указано'}`)
  })
}

main().finally(() => prisma.$disconnect())
