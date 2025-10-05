import React from "react"
import { getAllServices } from "@/lib/services"
import FooterClient from "./FooterClient"

export default async function Footer() {
  const services = await getAllServices()
  
  return <FooterClient services={services} />
}
