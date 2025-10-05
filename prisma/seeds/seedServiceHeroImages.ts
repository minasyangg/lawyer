import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🖼️  Обновление hero-изображений для услуг...')

  // Маппинг названий услуг на пути к изображениям
  const serviceImageMap: Record<string, string> = {
    'Налоговая практика': '/img/services/tax-hero.png',
    'Налоговое право': '/img/services/tax-hero.png',
    'Услуги налоговой практики': '/img/services/tax-hero.png',
    'Банкротство': '/img/services/bankruptcy-hero.png',
    'Услуги практики банкротства': '/img/services/bankruptcy-hero.png',
    'Споры и арбитраж': '/img/services/dispute-hero.png',
    'Разрешение споров и взыскание': '/img/services/dispute-hero.png',
    'Интеллектуальная собственность': '/img/services/intellectual-hero.png',
    'Услуги практики по интелектуальным правам': '/img/services/intellectual-hero.png',
    'Частная практика': '/img/services/bankruptcy-hero.png', // Используем дефолтное изображение
    'Услуги по комплексному сопровождению бизнеса': '/img/services/bankruptcy-hero.png', // Используем дефолтное изображение
  }

  let updatedCount = 0
  let skippedCount = 0

  for (const [serviceTitle, imagePath] of Object.entries(serviceImageMap)) {
    try {
      const service = await prisma.service.findFirst({
        where: {
          OR: [
            { title: serviceTitle },
            { title: { contains: serviceTitle } }
          ]
        }
      })

      if (service) {
        await prisma.service.update({
          where: { id: service.id },
          data: { heroImage: imagePath }
        })
        console.log(`✅ Обновлено: ${service.title} -> ${imagePath}`)
        updatedCount++
      } else {
        console.log(`⚠️  Услуга не найдена: ${serviceTitle}`)
        skippedCount++
      }
    } catch (error) {
      console.error(`❌ Ошибка при обновлении услуги "${serviceTitle}":`, error)
    }
  }

  console.log(`\n📊 Результат:`)
  console.log(`   Обновлено: ${updatedCount}`)
  console.log(`   Пропущено: ${skippedCount}`)
  console.log('✅ Seed выполнен успешно!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при выполнении seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
