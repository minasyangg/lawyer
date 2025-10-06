import Link from "next/link";

export default function ReadPublicationsCTA() {
  return (
    <section className="w-full py-20 bg-gradient-to-r from-[#0426A1] to-[#0027B3]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-[60px] lg:px-0 lg:pl-[60px] lg:pr-[60px]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-[60px]">
          {/* Заголовок */}
          <h2 className="font-inter text-3xl md:text-4xl lg:text-[48px] font-bold leading-[1.2] text-[#F2F7FA]">
            Читать другие наши публикации
          </h2>

          {/* Кнопка */}
          <div className="flex flex-col gap-10">
            <Link
              href="/publications"
              className="inline-flex items-center justify-center gap-4 bg-white rounded-lg px-6 py-4 transition-opacity hover:opacity-90"
            >
              <span className="font-inter text-base font-bold leading-[1.5] text-[#060606]">
                Читать
              </span>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
              >
                <path
                  d="M9.75 7.5L14.25 12L9.75 16.5"
                  stroke="#060606"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
