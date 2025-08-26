import React from "react";

interface ContactButtonProps {
  onClick?: () => void;
}

export default function ContactButton({ onClick }: ContactButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
    >
      Связаться
    </button>
  );
}
