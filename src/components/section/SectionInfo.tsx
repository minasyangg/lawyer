import Image from "next/image";

export default function SectionInfo() {
  return (
    <section className="container mx-auto max-w-screen-xl px-4 py-12 flex flex-col md:flex-row items-center gap-8">
      <div className="flex-1">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center md:text-left">Юридические услуги для бизнеса и частных лиц</h1>
        <p className="text-lg md:text-xl text-gray-700 mb-6 text-center md:text-left">
          Консультации, сопровождение сделок, представительство в суде и комплексная поддержка.
        </p>
        <ul className="space-y-2 list-disc pl-5">
          <li>Быстрое реагирование на запросы</li>
          <li>Опытные специалисты</li>
          <li>Индивидуальный подход</li>
        </ul>
      </div>
      <div className="flex-1 flex justify-center">
        <Image
          src="/img/lawyer-main.jpg"
          alt="Юридическая поддержка"
          width={400}
          height={400}
          className="rounded-xl shadow-lg object-cover"
          priority
        />
      </div>
    </section>
  );
}
