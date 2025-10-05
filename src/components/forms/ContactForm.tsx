'use client'

import React, { useState } from 'react'

interface FormData {
  firstName: string
  lastName: string
  position: string
  ogrn: string
  email: string
  phone: string
  message: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  position?: string
  ogrn?: string
  email?: string
  phone?: string
  message?: string
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    position: '',
    ogrn: '',
    email: '',
    phone: '',
    message: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Phone validation (Russian format)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+7|8)?[\s-]?\(?[489][0-9]{2}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  // OGRN validation (13 or 15 digits)
  const validateOGRN = (ogrn: string): boolean => {
    const ogrnRegex = /^\d{13}$|^\d{15}$/
    return ogrnRegex.test(ogrn)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно для заполнения'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна для заполнения'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Введите корректный email адрес'
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Введите корректный номер телефона'
    }

    if (formData.ogrn && !validateOGRN(formData.ogrn)) {
      newErrors.ogrn = 'ОГРН должен содержать 13 или 15 цифр'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Описание вопроса обязательно для заполнения'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Form submitted:', formData)
      
      setSubmitSuccess(true)
      setFormData({
        firstName: '',
        lastName: '',
        position: '',
        ogrn: '',
        email: '',
        phone: '',
        message: ''
      })
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="w-full max-w-2xl bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Спасибо за обращение!</h3>
        <p className="text-green-700 mb-4">Ваша заявка успешно отправлена. Мы свяжемся с вами в ближайшее время.</p>
        <button
          onClick={() => setSubmitSuccess(false)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Отправить еще одну заявку
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-base font-medium text-black">
            Имя *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Jane"
            className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
          />
          {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-base font-medium text-black">
            Фамилия *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Smitherton"
            className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
            }`}
          />
          {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>

      {/* Position */}
      <div className="space-y-2">
        <label htmlFor="position" className="block text-base font-medium text-black">
          Занимаемая должность
        </label>
        <input
          type="text"
          id="position"
          name="position"
          value={formData.position}
          onChange={handleInputChange}
          placeholder="Юрист"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
        />
      </div>

      {/* OGRN */}
      <div className="space-y-2">
        <label htmlFor="ogrn" className="block text-base font-medium text-black">
          ОГРН / ОГРНИП
        </label>
        <input
          type="text"
          id="ogrn"
          name="ogrn"
          value={formData.ogrn}
          onChange={handleInputChange}
          placeholder="1111111111111"
          maxLength={15}
          className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.ogrn ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.ogrn && <p className="text-sm text-red-600">{errors.ogrn}</p>}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-base font-medium text-black">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="email@fakedomain.com"
          className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label htmlFor="phone" className="block text-base font-medium text-black">
          Номер телефона
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="+7 (999) 123-45-67"
          className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
      </div>

      {/* Message */}
      <div className="space-y-2">
        <label htmlFor="message" className="block text-base font-medium text-black">
          Опишите Ваш вопрос *
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleInputChange}
          placeholder="Опишите вопросы и боли, которые Вам необходимо решить."
          className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
            errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black text-white font-medium text-xl py-4 px-8 rounded-lg shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Отправка...
          </div>
        ) : (
          'Отправить заявку'
        )}
      </button>
    </form>
  )
}
