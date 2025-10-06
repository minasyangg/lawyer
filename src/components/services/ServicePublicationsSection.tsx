import Image from "next/image";
import Link from "next/link";

interface Article {
  id: number;
  title: string;
  excerpt: string | null;
  slug: string;
}

interface ServicePublicationsSectionProps {
  articles: Article[];
}

export default function ServicePublicationsSection({
  articles,
}: ServicePublicationsSectionProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-10 md:py-16 lg:py-20">
      <div className="container mx-auto max-w-screen-xl px-[25px] md:px-[40px] lg:px-[60px]">
        {/* Заголовок */}
        <h2 className="font-inter text-3xl md:text-4xl lg:text-[48px] font-bold leading-[1.2] text-[#060606] mb-8 md:mb-12 lg:mb-[60px]">
          Последние публикации
        </h2>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/publications/${article.slug}`}
              className="group"
            >
              <div className="bg-[#F2F7FA] rounded-2xl overflow-hidden shadow-[0px_0px_1px_0px_rgba(0,0,0,0.4),0px_12px_12px_-6px_rgba(0,0,0,0.16)] w-[344px] h-[460px] flex flex-col justify-end transition-transform hover:scale-[1.02]">
                {/* Изображение */}
                <div className="relative w-full h-[145px] overflow-hidden">
                  <Image
                    src="/img/publication-placeholder-7fe93d.png"
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Контент */}
                <div className="flex flex-col gap-6 p-5 pb-[26px] flex-1">
                  <div className="flex flex-col gap-3 flex-1">
                    {/* Заголовок */}
                    <h3 className="font-inter text-[32px] font-bold leading-[1.2] text-[#060606] line-clamp-2">
                      {article.title}
                    </h3>

                    {/* Описание */}
                    <p className="font-inter text-base font-normal leading-[1.2] text-[#060606] line-clamp-3">
                      {article.excerpt || "Узнайте больше о данной публикации"}
                    </p>
                  </div>

                  {/* Кнопка */}
                  <button className="flex items-center justify-center bg-[#0426A1] rounded-lg p-4 w-fit transition-opacity hover:opacity-90">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                    >
                      <path
                        d="M19.12 4.88L4.88 19.12M19.12 4.88H9.38M19.12 4.88V14.62"
                        stroke="#F2F7FA"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
