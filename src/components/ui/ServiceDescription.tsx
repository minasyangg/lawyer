import Image from "next/image";
import ContactRedirectButton from "@/components/ui/ContactRedirectButton";

export interface ServiceDescriptionProps {
  title: string;
  shortDescription: string;
  icon?: string;
  features?: string[];
}

export default function ServiceDescription({ title, shortDescription, icon, features }: ServiceDescriptionProps) {
  return (
    <section className="container mx-auto max-w-screen-xl px-4 py-12 flex flex-col md:flex-row items-center gap-8">
      <div className="flex-1">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center md:text-left">{title}</h1>
        <p className="text-lg md:text-xl text-gray-700 mb-6 text-center md:text-left">
          {shortDescription}
        </p>
        {features && features.length > 0 && (
          <ul className="space-y-2 list-disc pl-5 mb-6">
            {features.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        )}
        <ContactRedirectButton
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          loadingLabel="Переход..."
        >
          Заказать услугу
        </ContactRedirectButton>
      </div>
      {icon && (
        <div className="flex-1 flex justify-center">
          <Image
            src={icon}
            alt={title}
            width={120}
            height={120}
            className="rounded-xl object-contain"
            priority
          />
        </div>
      )}
    </section>
  );
}
