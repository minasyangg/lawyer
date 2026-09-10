'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { submitContactRequest } from '@/lib/actions/contact-actions'

export default function ContactFormSection() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    ogrn: '',
    email: '',
    question: '',
    agreedToPolicy: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = new FormData()
      payload.set('firstName', formData.firstName)
      payload.set('lastName', formData.lastName)
      payload.set('ogrn', formData.ogrn)
      payload.set('email', formData.email)
      payload.set('message', formData.question)

      const result = await submitContactRequest(payload)

      if ('success' in result) {
        setSubmitSuccess(true)
        setFormData({
          firstName: '',
          lastName: '',
          ogrn: '',
          email: '',
          question: '',
          agreedToPolicy: false
        })
      } else {
        const firstError = Object.values(result.errors)[0]?.[0]
        setSubmitError(firstError || 'Не удалось отправить заявку. Попробуйте ещё раз позже.')
      }
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitError('Не удалось отправить заявку. Попробуйте ещё раз позже.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <section className="relative w-full flex justify-center  mb-[-150px] md:mb-[-200px] lg:mb-[-250px]" style={{ zIndex: 10 }}>
      <div className="flex flex-col md:flex-row w-full max-w-[1175px] h-auto md:h-[751px] rounded-2xl overflow-hidden shadow-lg mx-[25px] md:mx-[40px]">
        {/* Левая часть - Фон с текстом (40%) - скрываем на mobile */}
        <div className="relative w-full md:w-[40%] hidden md:flex items-end">
          {/* Фоновое изображение */}
          <Image
            src="/img/contact-background-7d3ad3.png"
            alt="Контакты"
            fill
            className="object-cover"
          />
          
          {/* Градиент overlay */}
          <div 
            className="absolute inset-0" 
            style={{
              background: 'linear-gradient(180deg, rgba(4, 38, 161, 0.6) 63%, rgba(11, 28, 72, 1) 100%)'
            }}
          />

          {/* Контент */}
          <div className="relative z-10 p-6 md:p-8 lg:p-10 pb-[30px] md:pb-[35px] lg:pb-[40px] pt-[60px] md:pt-[70px] lg:pt-[80px] flex flex-col gap-[8px] md:gap-[9px] lg:gap-[10px]">
            <h2 className="text-[36px] md:text-[42px] lg:text-[48px] font-bold text-white leading-[1.2] mb-3 md:mb-3.5 lg:mb-4">
              Обращение
            </h2>
            <div className="text-[16px] md:text-[18px] lg:text-[20px] text-white leading-[1.5] font-medium">
              <p className="mb-3 md:mb-3.5 lg:mb-4">
                Благодарим Вас за интерес к нашей компании, мы всегда рады помочь Вам.
              </p>
              <p className="mb-3 md:mb-3.5 lg:mb-4">
                Просим Вас оставить обращение нам на электронную почту, чтобы мы могли связаться с Вами и дать первичную консультацию.
              </p>
              <p className="mb-3 md:mb-3.5 lg:mb-4">
                Информируем Вас, что вся информация полученная от Вас является строго конфиденциальной.
              </p>
              <p>
                Первичное консультирование всегда остается бесплатным вне зависимости от объема описанных Вами вопросов.
              </p>
            </div>
          </div>
        </div>

        {/* Правая часть - Форма (60% на desktop, 100% на mobile) */}
        <div className="relative w-full md:w-[60%] bg-white flex items-center justify-center p-6 md:p-8 lg:p-10">
          {/* Подтверждение отправки — оверлеем поверх формы, а не в потоке:
              вставка блока в разметку сдвигала кнопку вниз (см. UX-правку). */}
          {submitSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm p-6"
            >
              <div className="max-w-[420px] rounded-2xl border border-green-200 bg-white px-6 py-8 text-center shadow-lg">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="mb-2 text-[20px] font-semibold text-black">Спасибо за обращение!</h4>
                <p className="mb-6 text-[15px] leading-[1.5] text-[#4F4F4F]">
                  Мы свяжемся с вами в ближайшее время.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="rounded-lg bg-[#060606] px-6 py-3 text-[15px] font-bold text-white transition-colors duration-300 hover:bg-[#1a1a1a]"
                >
                  Отправить ещё одно
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            aria-hidden={submitSuccess}
            className={`w-full max-w-[512px] flex flex-col gap-[24px] md:gap-[29px] lg:gap-[34px] transition-all duration-300 ${
              submitSuccess ? 'pointer-events-none blur-sm select-none' : ''
            }`}
          >
            <div className="flex flex-col gap-[20px] md:gap-[23px] lg:gap-[26px]">
              {/* Заголовок */}
              <div className="h-auto md:h-[51px]">
                <h3 className="text-[24px] md:text-[28px] lg:text-[32px] font-semibold text-black leading-[1.5]">
                  Свяжитесь со мной
                </h3>
              </div>

              {/* Поля формы */}
              <div className="flex flex-col gap-2">
                {/* Имя */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="firstName" className="text-[14px] md:text-[15px] lg:text-[16px] font-medium text-black leading-[1.5]">
                    Имя <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Иван"
                    className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[14px] md:text-[15px] lg:text-[16px] text-[#828282] leading-[1.5] focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
                
                {/* Фамилия */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="lastName" className="text-[14px] md:text-[15px] lg:text-[16px] font-medium text-black leading-[1.5]">
                    Фамилия <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Иванов"
                    className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[14px] md:text-[15px] lg:text-[16px] text-[#828282] leading-[1.5] focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>

                {/* ОГРН */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="ogrn" className="text-[14px] md:text-[15px] lg:text-[16px] font-medium text-black leading-[1.5]">
                    ОГРН / ОГРНИП <span className="text-[#828282] font-normal">(необязательно)</span>
                  </label>
                  <input
                    type="text"
                    id="ogrn"
                    name="ogrn"
                    value={formData.ogrn}
                    onChange={handleChange}
                    placeholder="1027700132195"
                    className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[14px] md:text-[15px] lg:text-[16px] text-[#828282] leading-[1.5] focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
                
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-[14px] md:text-[15px] lg:text-[16px] font-medium text-black leading-[1.5]">
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ivanov@mail.ru"
                    className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[14px] md:text-[15px] lg:text-[16px] text-[#828282] leading-[1.5] focus:outline-none focus:border-primary shadow-sm"
                  />
                </div>
                  
                {/* Вопрос */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="question" className="text-[14px] md:text-[15px] lg:text-[16px] font-medium text-black leading-[1.5]">
                    Опишите Ваш вопрос <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="question"
                    name="question"
                    required
                    value={formData.question}
                    onChange={handleChange}
                    placeholder="Кратко опишите вашу ситуацию — мы свяжемся для уточнения деталей"
                    rows={4}
                    className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[14px] md:text-[15px] lg:text-[16px] text-[#828282] leading-[1.5] focus:outline-none focus:border-primary shadow-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Чекбокс политики конфиденциальности */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="agreedToPolicy"
                name="agreedToPolicy"
                checked={formData.agreedToPolicy}
                onChange={(e) => setFormData({ ...formData, agreedToPolicy: e.target.checked })}
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="agreedToPolicy" className="text-[14px] text-[#828282] leading-[1.5]">
                Я согласен с{' '}
                <a
                  href="/docs/confidence.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  политикой конфиденциальности
                </a>
              </label>
            </div>

            {/* Успех показывается оверлеем над формой (см. выше). Ошибка остаётся
                в потоке — рядом с полями, чтобы можно было исправить ввод. */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={!formData.agreedToPolicy || isSubmitting}
              className="w-full px-6 py-4 bg-[#060606] text-white text-[16px] font-bold leading-[1.5] rounded-lg hover:bg-[#1a1a1a] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed md:mb-8 lg:mb-10"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить обращение'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
