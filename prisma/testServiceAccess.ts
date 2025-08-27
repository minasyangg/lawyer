
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testServiceAccess() {
  // Добавим тестовую услугу
  await prisma.service.create({
    data: {
      title: "Тестовая услуга",
      description: "Описание тестовой услуги",
      extraInfo: "Дополнительная информация",
    },
  });

  // Получим все услуги
  const services = await prisma.service.findMany();
  console.log("Список услуг:", services);
}

testServiceAccess()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
