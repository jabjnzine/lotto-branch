import { cn } from '@/lib/utils'

interface Props {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: Props) {
  return (
    <div className={cn('flex flex-col gap-1 md:flex-row md:items-center md:justify-between', className)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
