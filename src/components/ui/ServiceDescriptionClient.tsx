'use client'

import ServiceDescription, { ServiceDescriptionProps } from './ServiceDescription'

interface ServiceDescriptionClientProps extends Omit<ServiceDescriptionProps, 'onOrder'> {}

export default function ServiceDescriptionClient(props: ServiceDescriptionClientProps) {
  const handleOrderService = () => {
    console.log(`Заказ услуги: ${props.title}`)
    // Здесь можно добавить логику для заказа услуги
  }

  return (
    <ServiceDescription 
      {...props} 
      onOrder={handleOrderService}
    />
  )
}