"use client"

import { useState } from "react"
import { FileManager } from "@/components/admin/FileManager"
import { Button } from "@/components/ui/button"

export default function FileManagerTestPage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Тест File Manager</h1>
      
      <Button onClick={() => setIsOpen(true)}>
        Открыть File Manager
      </Button>

      <FileManager 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectMode={false}
      />
    </div>
  )
}
