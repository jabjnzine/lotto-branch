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
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="text-sm font-medium text-foreground/90">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className="flex h-12 w-full rounded-full border border-[#444444] bg-transparent px-5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      {error && (
        <span className="text-xs text-destructive font-medium">{error.message as string}</span>
      )}
    </div>
  )
}
