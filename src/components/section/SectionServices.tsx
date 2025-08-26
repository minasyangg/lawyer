import Image from "next/image";

const services = [
  {
    title: "Услуги налоговой практики",
    description: "Body text for whatever you’d like to add more to the subheading.",
    image: "/img/services-1.jpg",
  },
  {
    title: "Услуги практики банкротства",
    description: "Body text for whatever you’d like to expand on the main point.",
    image: "/img/services-2.jpg",
  },
  {
    title: "Разрешение споров и взыскание",
    description: "Body text for whatever you’d like to share more.",
    image: "/img/services-3.jpg",
  },
  {
    title: "Услуги частным клиентам",
    description: "Body text for whatever you’d like to add more to the subheading.",
    image: "/img/services-1.jpg",
  },
  {
    title: "Услуги по комплексному сопровождению бизнеса",
    description: "Body text for whatever you’d like to expand on the main point.",
    image: "/img/services-2.jpg",
  },
  {
    title: "Услуги практики по интелектуальным правам",
    description: "Body text for whatever you’d like to share more.",
    image: "/img/services-3.jpg",
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
