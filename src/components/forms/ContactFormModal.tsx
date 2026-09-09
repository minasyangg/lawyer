'use client'

import React, { useState } from "react";
import { submitContactRequest } from '@/lib/actions/contact-actions'

export default function ContactFormModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Поле "Имя" в модалке — одно на ФИО целиком, серверная форма ждёт
    // firstName/lastName раздельно: делим по первому пробелу, а если
    // пробела нет — фамилию оставляем пустой (в БД допустима).
    const [firstName, ...rest] = form.name.trim().split(/\s+/);
    const lastName = rest.join(' ');

    try {
      const payload = new FormData();
      payload.set('firstName', firstName || '');
      payload.set('lastName', lastName || '');
      payload.set('email', form.email);
      payload.set('message', form.message);

      const result = await submitContactRequest(payload);

      if ('success' in result) {
        setSubmitted(true);
      } else {
        const firstError = Object.values(result.errors)[0]?.[0];
        setSubmitError(firstError || 'Не удалось отправить заявку. Попробуйте ещё раз позже.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError('Не удалось отправить заявку. Попробуйте ещё раз позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Закрыть форму"
        >
          ×
        </button>
        {submitted ? (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Спасибо за обращение!</h2>
            <p className="text-gray-600">Мы свяжемся с вами в ближайшее время.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Связаться с нами</h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Сообщение</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}