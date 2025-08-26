import React from "react";

interface ButtonFeedbackProps {
  onClick?: () => void;
}

export default function ButtonFeedback({ onClick }: ButtonFeedbackProps) {
  return (
    <section className="w-full bg-[#F7F7F7] py-10">
      <div className="container mx-auto max-w-screen-xl px-4 flex flex-col md:flex-row items-center justify-between">
        <h2 className="font-semibold text-4xl md:text-5xl text-black mb-6 md:mb-0">Мы всегда ждем Ваших обращений</h2>
        <button
          type="button"
          onClick={onClick}
          className="bg-black text-white font-medium text-2xl md:text-3xl py-5 px-8 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
        >
          Связаться
        </button>
      </div>
    </section>
  );
}
