import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'

interface Props {
  name: string
  label: string
  placeholder?: string
  disabled?: boolean
  type?: string
  className?: string
}

export function FormInput({ name, label, placeholder, disabled, type = 'text', className }: Props) {
  const { register, formState: { errors } } = useFormContext()
  const error = errors[name]

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {error && (
        <span className="text-xs text-red-500">{error.message as string}</span>
      )}
    </div>
  )
}
