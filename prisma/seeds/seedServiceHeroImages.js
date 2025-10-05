const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🖼️  Обновление hero-изображений для услуг...')

  // Маппинг названий услуг на пути к изображениям (из шаблонов Figma)
  const serviceImageMap = {
    // 1. Услуги практики банкротства (node 28:1475)
    'Услуги практики банкротства': '/img/services/bankruptcy-hero.png',
    'Банкротство': '/img/services/bankruptcy-hero.png',
    
    // 2. Услуги налоговой практики / Разрешение споров и взыскание (node 28:1390)
    'Услуги налоговой практики': '/img/services/tax-hero.png',
    'Налоговая практика': '/img/services/tax-hero.png',
    'Налоговое право': '/img/services/tax-hero.png',
    'Разрешение споров и взыскание': '/img/services/dispute-hero.png',
    'Споры и арбитраж': '/img/services/dispute-hero.png',
    
    // 3. Услуги по комплексному сопровождению бизнеса (node 28:1645)
    'Услуги по комплексному сопровождению бизнеса': '/img/services/bankruptcy-hero.png',
    
    // 4. Услуги практики по интеллектуальным правам (node 28:1730)
    'Услуги практики по интелектуальным правам': '/img/services/intellectual-hero.png',
    'Услуги практики по интеллектуальным правам': '/img/services/intellectual-hero.png',
    'Интеллектуальная собственность': '/img/services/intellectual-hero.png',
    
    // 5. Услуги частным клиентам (используем дефолтное изображение)
    'Услуги частным клиентам': '/img/services/bankruptcy-hero.png',
    'Частная практика': '/img/services/bankruptcy-hero.png',
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
