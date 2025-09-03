const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const list = await prisma.fileEntity.findMany({ where: { userId: 1 } })
  console.log('FileEntities for user 1:', list.length)
  for (const f of list) {
    console.log(f.id, f.name, f.path, f.isFolder)
  }
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
