"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus } from "lucide-react"

interface Tag {
  id: number
  name: string
  slug: string
  color?: string
}

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  label?: string
}

export function TagSelector({ selectedTags, onTagsChange, label = "Tags" }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3b82f6")
  const inputRef = useRef<HTMLInputElement>(null)

  // Загружаем доступные теги
  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data.tags)
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTags.find(selected => selected.id === tag.id)
  )

  const handleTagSelect = (tag: Tag) => {
    onTagsChange([...selectedTags, tag])
    setSearchTerm("")
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleTagRemove = (tagId: number) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId))
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newTagName.trim(), 
          color: newTagColor 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newTag = data.tag
        setAvailableTags(prev => [...prev, newTag])
        onTagsChange([...selectedTags, newTag])
        setNewTagName("")
        setIsCreatingTag(false)
        setSearchTerm("")
        inputRef.current?.focus()
      }
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault()
      const exactMatch = filteredTags.find(tag => 
        tag.name.toLowerCase() === searchTerm.toLowerCase()
      )
      if (exactMatch) {
        handleTagSelect(exactMatch)
      } else {
        setNewTagName(searchTerm)
        setIsCreatingTag(true)
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Выбранные теги */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
              style={{ 
                backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                borderColor: tag.color || '#d1d5db',
                color: tag.color || '#374151'
              }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleTagRemove(tag.id)}
                className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Поиск тегов */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search or create tags..."
        />

        {/* Список предложений */}
        {showSuggestions && (searchTerm || filteredTags.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
            {filteredTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => handleTagSelect(tag)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color || '#6b7280' }}
                />
                {tag.name}
              </button>
            ))}
            
            {searchTerm && !filteredTags.find(tag => 
              tag.name.toLowerCase() === searchTerm.toLowerCase()
            ) && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-blue-600"
                onClick={() => {
                  setNewTagName(searchTerm)
                  setIsCreatingTag(true)
                }}
              >
                <Plus className="w-4 h-4" />
                Create &ldquo;{searchTerm}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>

      {/* Создание нового тега */}
      {isCreatingTag && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <h4 className="font-medium">Create New Tag</h4>
          <div className="space-y-2">
            <Label htmlFor="new-tag-name">Name</Label>
            <Input
              id="new-tag-name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-tag-color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="new-tag-color"
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-8 h-8 rounded border"
              />
              <Input
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              onClick={handleCreateTag}
              size="sm"
            >
              Create Tag
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsCreatingTag(false)
                setNewTagName("")
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {/* Скрытый input для формы */}
      <input
        type="hidden"
        name="tags"
        value={JSON.stringify(selectedTags.map(tag => tag.id))}
      />
    </div>
  )
}