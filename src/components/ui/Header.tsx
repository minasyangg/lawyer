import React from "react"
import { getAllServices } from "@/lib/services"
import HeaderClient from "./HeaderClient"

export default async function Header() {
  const services = await getAllServices()
  
  return <HeaderClient services={services} />
}
