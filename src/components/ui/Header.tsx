import React from "react"
import { getAllServices } from "@/lib/services"
import type { Service } from '@prisma/client'
import HeaderClient from "./HeaderClient"

export default async function Header() {
  let services: Service[] = []
  try {
    services = await getAllServices()
  } catch (err) {
    // If DB is not reachable (dev env), fall back to empty services so header still renders
    // Log to server console for debugging
    // eslint-disable-next-line no-console
    console.error('[Header] failed to load services, falling back to empty list', err)
    services = []
  }

  return <HeaderClient services={services} />
}
