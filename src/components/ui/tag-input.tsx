"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface TagInputProps {
  value?: string[]
  onChange?: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Type and press Enter...",
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      const newTag = inputValue.trim()
      if (!value.includes(newTag)) {
        onChange?.([...value, newTag])
      }
      setInputValue("")
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      onChange?.(value.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange?.(value.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
