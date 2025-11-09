"use client"

import React, { Suspense } from 'react'
import LoginFormClient from './LoginFormClient'

// Avoid prerender issues; this page relies on client-only hooks
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-600">Загрузка...</div></div>}>
      <LoginFormClient />
    </Suspense>
  )
}
