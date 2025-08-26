import Image from "next/image";

const actuality = [
  {
    title: "Для успешного бизнеса",
    description: "Body text for whatever you’d like to add more to the subheading.",
    image: "/img/actuality-1.jpg",
  },
  {
    title: "Для развивающегося бизнеса",
    description: "Body text for whatever you’d like to expand on the main point.",
    image: "/img/actuality-2-5409b3.jpg",
  },
  {
    title: "Для частных клиентов",
    description: "Body text for whatever you’d like to expand on the main point.",
    image: "/img/actuality-3-5409b3.jpg",
  },
];

export default function SectionActuality() {
  return (
    <section className="w-full bg-white py-16">
      <div className="container mx-auto max-w-screen-xl px-4">
        <h2 className="font-semibold text-4xl md:text-5xl text-black mb-12">Наше предложение актуально</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {actuality.map((item, idx) => (
            <article key={idx} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
              <div className="w-full h-64 relative mb-4">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover rounded-lg"
                  priority={idx === 0}
                />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center">{item.title}</h3>
              <p className="text-gray-600 text-center text-base">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
