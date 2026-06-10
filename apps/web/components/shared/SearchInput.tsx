'use client'

import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'ค้นหา...' }: SearchInputProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 transition-colors focus-within:border-primary">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
