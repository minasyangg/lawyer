interface ServicePracticeCardProps {
  title: string
  items: string[]
}

function ServicePracticeCard({ title, items }: ServicePracticeCardProps) {
  return (
    <div className="flex-1 bg-[#F2F7FA] rounded-2xl shadow-[0px_0px_1px_0px_rgba(0,0,0,0.4),0px_12px_12px_-6px_rgba(0,0,0,0.16)] p-10">
      <h3 className="font-inter text-[40px] md:text-[48px] font-bold leading-[1.2] text-[#060606] mb-10">
        {title}
      </h3>
      <ul className="space-y-0">
        {items.map((item, index) => (
          <li key={index} className="font-inter text-xl font-normal leading-[1.5] text-[#060606]">
            {index + 1}. {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface ServicePracticeSectionProps {
  cards: {
    title: string
    items: string[]
  }[]
}

export default function ServicePracticeSection({ cards }: ServicePracticeSectionProps) {
  return (
    <section className="w-full py-12 md:py-16">
      <div className="container mx-auto max-w-screen-xl px-[25px] md:px-[40px] lg:px-[60px]">
        {cards.length === 1 && (
          <div className="max-w-5xl mx-auto">
            <ServicePracticeCard title={cards[0].title} items={cards[0].items} />
          </div>
        )}
        {cards.length === 2 && (
          <div className="flex flex-col md:flex-row gap-[34px]">
            <ServicePracticeCard title={cards[0].title} items={cards[0].items} />
            <ServicePracticeCard title={cards[1].title} items={cards[1].items} />
          </div>
        )}
        {cards.length > 2 && (
          <div className="flex flex-col md:flex-row gap-[34px]">
            <ServicePracticeCard title={cards[0].title} items={cards[0].items} />
            <ServicePracticeCard title={cards[1].title} items={cards[1].items} />
          </div>
        )}
      </div>
    </section>
  )
}
