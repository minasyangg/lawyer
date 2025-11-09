import Image from "next/image";

const services = [
  {
    title: "Налоговая практика",
    description: "Консультирование и защита по налогам",
    image: "/img/services-1.jpg",
  },
  {
    title: "Практика банкротства",
    description: "Сопровождение интересов всех участников банкротства",
    image: "/img/services-2.jpg",
  },
  {
    title: "Споры и взыскание",
    description: "Анализ, сопровождение и взыскание в рамках споров",
    image: "/img/services-3.jpg",
  },
  {
    title: "Частным клиентам",
    description: "Услуги физическим лицам по частным вопросам",
    image: "/img/services-1.jpg",
  },
  {
    title: "Комплексное сопровождение бизнеса",
    description: "Набор услуг, оказываемых на длительной основе",
    image: "/img/services-2.jpg",
  },
];

export default function SectionServices() {
  return (
    <section className="container mx-auto max-w-screen-xl px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">Услуги ПФК</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((service, idx) => (
          <article key={idx} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="w-full h-64 relative mb-4">
              <Image
                src={service.image}
                alt={service.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover rounded-lg"
                priority={idx < 3}
              />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-center">{service.title}</h3>
            <p className="text-gray-600 text-center text-base">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
