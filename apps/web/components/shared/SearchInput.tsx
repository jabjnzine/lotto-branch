'use client'

import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'ค้นหา...' }: SearchInputProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-3 transition-colors focus-within:border-sky-500">
      <Search className="h-4 w-4 shrink-0 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
