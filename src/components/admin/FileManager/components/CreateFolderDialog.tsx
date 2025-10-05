"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface CreateFolderDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<void>
  isCreating: boolean
}

export function CreateFolderDialog({
  isOpen,
  onClose,
  onCreate,
  isCreating
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("")

  const handleCreate = async () => {
    if (!folderName.trim()) return
    
    try {
      await onCreate(folderName.trim())
      setFolderName("")
      onClose()
    } catch (error) {
      console.error('Create folder error:', error)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setFolderName("")
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && folderName.trim() && !isCreating) {
      handleCreate()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать папку</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="folderName">Название папки</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите название папки"
              disabled={isCreating}
              autoFocus
              className="mt-1"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!folderName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}