import React from "react";
import Image from "next/image";

export interface ServiceDetailsProps {
  fullDescription: string;
  features: string[];
  benefits: string[];
  price: string;
  duration: string;
  technologies?: string[];
  portfolio?: { title: string; image: string; link?: string }[];
  faq?: { question: string; answer: string }[];
}

export default function ServiceDetails({
  fullDescription,
  features,
  benefits,
  price,
  duration,
  technologies,
  portfolio,
  faq,
}: ServiceDetailsProps) {
  return (
    <section className="container mx-auto max-w-screen-xl px-4 py-12">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Описание услуги</h2>
        <p className="text-lg text-gray-700 mb-4">{fullDescription}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xl font-semibold mb-2">Особенности</h3>
          <ul className="list-disc pl-5 space-y-1">
            {features.map((f, idx) => (
              <li key={idx}>{f}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Преимущества</h3>
          <ul className="list-disc pl-5 space-y-1">
            {benefits.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xl font-semibold mb-2">Стоимость и сроки</h3>
          <p className="mb-2"><span className="font-medium">Цена:</span> {price}</p>
          <p><span className="font-medium">Сроки:</span> {duration}</p>
        </div>
        {technologies && technologies.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-2">Технологии</h3>
            <ul className="flex flex-wrap gap-2">
              {technologies.map((tech, idx) => (
                <li key={idx} className="bg-gray-100 px-3 py-1 rounded text-sm">{tech}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {portfolio && portfolio.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Примеры работ</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolio.map((item, idx) => (
              <a key={idx} href={item.link || "#"} target="_blank" rel="noopener noreferrer" className="block">
                <Image src={item.image} alt={item.title} className="rounded-lg w-full h-40 object-cover mb-2" width={300} height={160} />
                <div className="text-base font-medium text-gray-800 text-center">{item.title}</div>
              </a>
            ))}
          </div>
        </div>
      )}
      {faq && faq.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">FAQ</h3>
          <ul className="space-y-4">
            {faq.map((item, idx) => (
              <li key={idx}>
                <div className="font-medium text-gray-900 mb-1">{item.question}</div>
                <div className="text-gray-700">{item.answer}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
