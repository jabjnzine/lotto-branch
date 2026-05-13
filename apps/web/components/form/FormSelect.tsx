import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface Props {
  name: string
  label: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function FormSelect({ name, label, options, placeholder, disabled, className }: Props) {
  const { register, formState: { errors } } = useFormContext()
  const error = errors[name]

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <select
        {...register(name)}
        disabled={disabled}
        className="flex h-10 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-red-500">{error.message as string}</span>
      )}
    </div>
  )
}
