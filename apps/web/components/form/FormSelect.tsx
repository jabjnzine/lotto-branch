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
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-medium text-foreground/90">{label}</label>
      <select
        {...register(name)}
        disabled={disabled}
        className="flex h-12 w-full rounded-full border border-[#444444] bg-secondary px-5 py-2 text-base text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs text-destructive font-medium">{error.message as string}</span>
      )}
    </div>
  )
}
