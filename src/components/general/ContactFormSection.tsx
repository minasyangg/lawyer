'use client'

import React, { useState } from 'react'
import Image from 'next/image'

export default function ContactFormSection() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    ogrn: '',
    email: '',
    question: '',
    agreedToPolicy: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Логика отправки формы
    console.log('Form submitted:', formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <section className="relative w-full flex justify-center" style={{ marginBottom: '-250px', zIndex: 10 }}>
      <div className="flex w-full max-w-[1175px] h-[751px] rounded-2xl overflow-hidden shadow-lg">
        {/* Левая часть - Фон с текстом (40%) */}
        <div className="relative w-[40%] flex items-end">
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
          <div className="relative z-10 p-10 pb-[40px] pt-[80px] flex flex-col gap-[10px]">
            <h2 className="text-[48px] font-bold text-white leading-[1.2] mb-4">
              Обращение
            </h2>
            <div className="text-[20px] text-white leading-[1.5] font-medium">
              <p className="mb-4">
                Благодарим Вас за интерес к нашей компании, мы всегда рады помочь Вам.
              </p>
              <p className="mb-4">
                Просим Вас оставить обращение нам на электронную почту, чтобы мы могли связаться с Вами и дать первичную консультацию.
              </p>
              <p className="mb-4">
                Информируем Вас, что вся информация полученная от Вас является строго конфиденциальной.
              </p>
              <p>
                Первичное консультирование всегда остается бесплатным вне зависимости от объема описанных Вами вопросов.
              </p>
            </div>
          </div>
        </div>

        {/* Правая часть - Форма (60%) */}
        <div className="w-[60%] bg-white flex items-center justify-center p-10">
          <form onSubmit={handleSubmit} className="w-full max-w-[512px] flex flex-col gap-[34px]">
            <div className="flex flex-col gap-[26px]">
              {/* Заголовок */}
              <div className="h-[51px]">
                <h3 className="text-[32px] font-semibold text-black leading-[1.5]">
                  Свяжитесь со мной
                </h3>
              </div>

              {/* Поля формы */}
              <div className="flex flex-col gap-6">
                {/* Имя и Фамилия */}
                <div className="flex gap-[26px]">
                  <div className="flex-1 flex flex-col gap-2">
                    <label htmlFor="firstName" className="text-[16px] font-medium text-black leading-[1.5]">
                      Имя
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Jane"
                      className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[16px] text-[#828282] leading-[1.5] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <label htmlFor="lastName" className="text-[16px] font-medium text-black leading-[1.5]">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Smitherton"
                      className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[16px] text-[#828282] leading-[1.5] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                </div>

                {/* ОГРН и Email */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2 h-[80px]">
                    <label htmlFor="ogrn" className="text-[16px] font-medium text-black leading-[1.5]">
                      ОГРН / ОГРНИП
                    </label>
                    <input
                      type="text"
                      id="ogrn"
                      name="ogrn"
                      value={formData.ogrn}
                      onChange={handleChange}
                      placeholder="1111111111111"
                      className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[16px] text-[#828282] leading-[1.5] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2 h-[80px]">
                    <label htmlFor="email" className="text-[16px] font-medium text-black leading-[1.5]">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@janesfakedomain.net"
                      className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[16px] text-[#828282] leading-[1.5] focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  
                  {/* Вопрос */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="question" className="text-[16px] font-medium text-black leading-[1.5]">
                      Опишите Ваш вопрос
                    </label>
                    <textarea
                      id="question"
                      name="question"
                      value={formData.question}
                      onChange={handleChange}
                      placeholder="Enter your question or message"
                      rows={4}
                      className="w-full px-4 py-3 border border-[#E0E0E0] rounded-lg text-[16px] text-[#828282] leading-[1.5] focus:outline-none focus:border-primary shadow-sm resize-none"
                    />
                  </div>
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

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={!formData.agreedToPolicy}
              className="w-full px-6 py-4 bg-[#060606] text-white text-[16px] font-bold leading-[1.5] rounded-lg hover:bg-[#1a1a1a] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Обращение
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
