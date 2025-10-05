'use client'

import ButtonFeedback from './buttons/ButtonFeedback'

export default function ButtonFeedbackClient() {
  const handleContactClick = () => {
    console.log('Переход к контактам')
    // Здесь можно добавить логику для перехода к контактам
  }

  return <ButtonFeedback onClick={handleContactClick} />
}