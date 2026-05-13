'use client'

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
} from '@/components/ui/toast'
import { useToastStore } from '@/lib/stores/useToastStore'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Info } from 'lucide-react'

const iconMap = {
  success: CheckCircle,
  destructive: XCircle,
  default: Info,
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <ToastProvider>
      {toasts.map((t) => {
        const Icon = iconMap[t.variant ?? 'default']
        return (
          <Toast
            key={t.id}
            variant={t.variant}
            onOpenChange={(open) => { if (!open) dismiss(t.id) }}
          >
            <div className="flex items-start gap-3 w-full">
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 mt-0.5',
                  t.variant === 'success' && 'text-green-500',
                  t.variant === 'destructive' && 'text-red-500',
                  t.variant === 'default' && 'text-sky-500',
                )}
              />
              <div className="min-w-0">
                <ToastTitle>{t.title}</ToastTitle>
                {t.description && (
                  <ToastDescription>{t.description}</ToastDescription>
                )}
              </div>
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
