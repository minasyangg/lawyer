const { PrismaClient } = require('@prisma/client')
const fs = require('fs/promises')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  const userDirName = 'user_1'
  const userDir = path.join(uploadsDir, userDirName)

  try {
    const files = await fs.readdir(userDir)
    console.log('Found', files.length, 'files in', userDirName)

    for (const file of files) {
      const relPath = `uploads/${userDirName}/${file}`
      const exists = await prisma.fileEntity.findFirst({ where: { path: relPath } })
      if (exists) {
        console.log('Already exists in DB:', relPath)
        continue
      }

      const stats = await fs.stat(path.join(userDir, file))
      const created = await prisma.fileEntity.create({
        data: {
          userId: 1,
          name: file,
          isFolder: false,
          parentId: null,
          path: relPath,
          size: Number(stats.size),
          mimeType: '',
          url: `/${relPath.replace(/\\/g, '/')}`
        }
      })
      console.log('Inserted:', created.id, relPath)
    }

    console.log('Sync complete')
  } catch (e) {
    console.error('Sync error', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
