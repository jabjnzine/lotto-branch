'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { formatThaiDate, formatCurrency, formatTime } from '@/lib/utils'
import { BET_TYPE_LABEL, type BetType } from '@lotto/shared'

const BET_STATUS_LABEL: Record<string, string> = {
  pending: 'รอผล',
  won: 'ถูกรางวัล',
  lost: 'ไม่ถูก',
  cancelled: 'ยกเลิก',
}

export interface ReceiptLineItem {
  number: string
  bet_type: string
  amount: string
  payout_rate?: string | number | null
}

export interface ReceiptProps {
  billNo: string
  betFullId?: string | null
  drawDate: string
  typeName: string
  buyerName: string
  note?: string | null
  betStatus?: string | null
  items: ReceiptLineItem[]
  totalAmount: number | string
  createdAt?: string
  onClose?: () => void
  onPrint?: () => void
}

function formatPayoutRate(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === '') return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (Number.isNaN(n)) return '—'
  if (Number.isInteger(n)) return n.toLocaleString('th-TH')
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function Receipt({
  billNo,
  betFullId,
  drawDate,
  typeName,
  buyerName,
  note,
  betStatus,
  items,
  totalAmount,
  createdAt,
  onClose,
  onPrint,
}: ReceiptProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `ใบเสร็จ-${billNo}`,
    pageStyle: `
      @page {
        size: A6;
        margin: 4mm;
      }
      @media print {
        html, body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  })

  const printHandler = onPrint ?? handlePrint
  const statusLabel = betStatus ? BET_STATUS_LABEL[betStatus] ?? betStatus : null
  const itemCount = items.length
  const hasAnyRate = items.some((i) => i.payout_rate != null && String(i.payout_rate).trim() !== '')

  return (
    <div className="mx-auto w-full max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col sm:w-[300px] text-[13px]"
      style={{ fontFamily: 'var(--font-sans, sans-serif)' }}
    >
      <div
        ref={contentRef}
        className="max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col sm:rounded-2xl sm:overflow-hidden sm:border"
        style={{ backgroundColor: '#E3F2FD', borderColor: '#90CAF9' }}
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-4 text-center text-white" style={{ backgroundColor: '#42A5F5' }}>
          <div className="text-[17px] font-medium mb-0.5">ใบเสร็จรับเงิน</div>
          <div className="text-xs opacity-85">ระบบหวย Back Office</div>
        </div>

        {/* Body */}
        <div className="px-4 py-4 max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col max-sm:pb-2">
          <div className="max-sm:min-h-0 max-sm:flex-1 max-sm:overflow-y-auto max-sm:overscroll-contain print:overflow-visible print:max-sm:flex-none">
          {/* Info rows */}
          <div className="space-y-[5px]">
            <Row label="เลขที่บิล" value={billNo} />
            {betFullId ? (
              <div className="flex flex-col gap-0.5 pb-1.5 border-b" style={{ borderColor: '#90CAF9' }}>
                <span className="text-xs" style={{ color: '#1565C0' }}>รหัสบิล (เต็ม)</span>
                <span className="break-all text-[10px] font-medium leading-snug" style={{ color: '#0D47A1' }}>
                  {betFullId}
                </span>
              </div>
            ) : null}
            <Row label="งวดวันที่" value={formatThaiDate(drawDate)} />
            <Row label="ประเภท" value={typeName} />
            {statusLabel ? <Row label="สถานะบิล" value={statusLabel} /> : null}
            <Row label="ลูกค้า" value={buyerName || 'ลูกค้าทั่วไป'} />
            {note?.trim() ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs" style={{ color: '#1565C0' }}>หมายเหตุ</span>
                <span className="whitespace-pre-wrap break-words text-[11px] font-medium" style={{ color: '#0D47A1' }}>
                  {note.trim()}
                </span>
              </div>
            ) : null}
            <Row label="เวลา" value={createdAt ? formatTime(createdAt) : '—'} />
            <Row label="จำนวนรายการ" value={`${itemCount} รายการ`} />
          </div>

          <hr className="my-3" style={{ borderColor: '#90CAF9' }} />

          {/* Column headers */}
          <div
            className="flex justify-between px-3 pb-1.5"
            style={{ paddingRight: hasAnyRate ? 0 : undefined }}
          >
            <span className="text-[11px] font-medium" style={{ color: '#1565C0' }}>เลข</span>
            <span className="text-[11px] font-medium" style={{ color: '#1565C0' }}>ประเภท</span>
            {hasAnyRate ? (
              <span className="text-[11px] font-medium text-right w-12" style={{ color: '#1565C0' }}>จ่าย</span>
            ) : null}
            <span className="text-[11px] font-medium" style={{ color: '#1565C0' }}>ยอด</span>
          </div>

          {/* Item cards */}
          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-white rounded-[10px] px-3 py-2.5 border"
                style={{ borderColor: '#BBDEFB' }}
              >
                <div className="flex gap-2.5 items-center min-w-0 flex-1">
                  <span
                    className="text-white rounded-md px-2.5 py-1 text-sm font-medium shrink-0"
                    style={{ backgroundColor: '#1565C0' }}
                  >
                    {item.number}
                  </span>
                  <span className="text-xs truncate" style={{ color: '#1565C0' }}>
                    {BET_TYPE_LABEL[item.bet_type as BetType] ?? item.bet_type}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasAnyRate ? (
                    <span className="text-[10px] tabular-nums w-12 text-right" style={{ color: '#1565C0' }}>
                      {formatPayoutRate(item.payout_rate)}
                    </span>
                  ) : null}
                  <span className="font-medium text-[13px] tabular-nums" style={{ color: '#0D47A1' }}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div
            className="flex justify-between items-center rounded-[10px] px-3.5 py-3 mt-2"
            style={{ backgroundColor: '#1565C0' }}
          >
            <span className="text-white text-sm font-medium">รวมทั้งสิ้น</span>
            <span className="text-white text-xl font-medium tabular-nums">
              {formatCurrency(totalAmount)} บาท
            </span>
          </div>

          {/* Footer */}
          <div className="text-center text-[11px] mt-3 mb-1 leading-relaxed" style={{ color: '#1976D2' }}>
            <p>ขอบคุณที่ใช้บริการ</p>
            <p>พิมพ์เมื่อ {new Date().toLocaleString('th-TH')}</p>
          </div>
          </div>

          {/* Action buttons — hidden when printing */}
          <div className="mt-2.5 flex gap-2 print:hidden max-sm:mt-auto max-sm:shrink-0 max-sm:pt-2 pb-[env(safe-area-inset-bottom,0px)]">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border text-[13px] cursor-pointer text-center transition-colors hover:bg-sky-50"
                style={{ borderColor: '#90CAF9', backgroundColor: '#fff', color: '#1565C0' }}
              >
                ปิด
              </button>
            )}
            <button
              type="button"
              onClick={printHandler}
              className="flex-1 py-2 rounded-lg border-none text-[13px] cursor-pointer flex items-center justify-center gap-1.5 transition-colors hover:opacity-90"
              style={{ backgroundColor: '#1976D2', color: '#fff' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 12H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              พิมพ์
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs" style={{ color: '#1565C0' }}>{label}</span>
      <span className="text-xs font-medium max-w-[60%] text-right leading-snug" style={{ color: '#0D47A1' }}>
        {value}
      </span>
    </div>
  )
}
