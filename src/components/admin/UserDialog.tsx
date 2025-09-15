"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createUser, updateUser, User } from "@/lib/actions/user-actions"

function RoleSelect({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)
  
  return (
    <>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USER">User</SelectItem>
          <SelectItem value="EDITOR">Editor</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
      <input type="hidden" name="role" value={value} />
    </>
  )
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const isEditing = !!user

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrors({})

    try {
      let result
      if (isEditing && user) {
        result = await updateUser(user.id, formData)
      } else {
        result = await createUser(formData)
      }

      if (result.success) {
        onOpenChange(false)
      } else if (result.errors) {
        setErrors(result.errors)
      }
    } catch {
      setErrors({ general: ['Something went wrong'] })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit User' : 'Create New User'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user?.name || ''}
                placeholder="Enter user name"
                required
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name[0]}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email || ''}
                placeholder="Enter email address"
                required
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email[0]}</p>
              )}
            </div>

            {!isEditing && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  required
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password[0]}</p>
                )}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <RoleSelect defaultValue={user?.role || 'USER'} />
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role[0]}</p>
              )}
            </div>

            {errors.general && (
              <p className="text-sm text-red-600">{errors.general[0]}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}