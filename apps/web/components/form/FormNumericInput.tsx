import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'

interface Props {
  name: string
  label: string
  maxLength?: number
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function FormNumericInput({ name, label, maxLength, placeholder, disabled, className }: Props) {
  const { register, formState: { errors } } = useFormContext()
  const error = errors[name]

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        {...register(name)}
        inputMode="numeric"
        pattern="\d*"
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        className="flex h-10 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-center font-mono tracking-widest placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {error && (
        <span className="text-xs text-red-500">{error.message as string}</span>
      )}
    </div>
  )
}
