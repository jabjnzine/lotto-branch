'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'default'
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  variant = 'destructive',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 [&>button]:hidden">
        <div className="flex flex-col items-center px-6 pt-8 pb-2">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full mb-4 ${
            variant === 'destructive' ? 'bg-red-100' : 'bg-sky-100'
          }`}>
            <AlertTriangle className={`h-7 w-7 ${
              variant === 'destructive' ? 'text-red-500' : 'text-sky-500'
            }`} />
          </div>
          <DialogTitle className="text-center text-lg mb-1.5">{title}</DialogTitle>
          <DialogDescription className="text-center text-base text-slate-600">
            {message}
          </DialogDescription>
        </div>
        <DialogFooter className="px-6 pb-6 pt-3 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${
              variant === 'destructive'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-[#0284c7] hover:bg-[#0369a1]'
            }`}
          >
            {loading ? 'กำลังดำเนินการ...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
