const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@lawyer.com'
  const newPassword = 'admin'
  const hash = await bcrypt.hash(newPassword, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      name: 'Administrator',
      role: 'ADMIN'
    },
    create: {
      name: 'Administrator',
      email,
      password: hash,
      role: 'ADMIN'
    }
  })

  console.log('Admin password set for:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
