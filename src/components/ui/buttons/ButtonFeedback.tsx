import React from "react";
import ContactRedirectButton, { ContactRedirectButtonProps } from "@/components/ui/ContactRedirectButton";

interface ButtonFeedbackProps {
  onClick?: ContactRedirectButtonProps["onClick"];
}

export default function ButtonFeedback({ onClick }: ButtonFeedbackProps) {
  return (
    <section className="w-full bg-gradient-to-r from-[#0426A1] to-[#0027B3] py-20">
      <div className="max-w-[1320px] mx-auto px-5 md:px-[60px] lg:px-0 lg:pl-[60px] lg:pr-[60px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-[60px]">
          <h2 className="font-inter text-3xl md:text-4xl lg:text-[48px] font-bold leading-[1.2] text-[#F2F7FA]">
            Мы всегда ждем Ваших обращений
          </h2>
          <div className="flex flex-col gap-10">
            <ContactRedirectButton
              type="button"
              onClick={onClick}
              className="inline-flex items-center justify-center gap-4 bg-white rounded-lg px-6 py-4 transition-opacity hover:opacity-90"
              loadingLabel="Переход..."
            >
              <span className="font-inter text-base font-bold leading-[1.5] text-[#060606]">
                Связаться с нами
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
            </ContactRedirectButton>
          </div>
        </div>
      </div>
    </section>
  );
}
