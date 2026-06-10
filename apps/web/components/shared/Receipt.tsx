'use client'

import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { toPng, toBlob } from 'html-to-image'
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

/* สีที่ใช้ทั้งหมด — ปรับที่เดียว */
const C = {
  primary: '#ff9824',
  primaryDark: '#ea580c',
  primaryLight: '#fff7ed',   // พื้นหลังใบเสร็จ (print-friendly สีอ่อน)
  border: '#fed7aa',          // orange-200
  labelText: '#9a3412',       // orange-800
  valueText: '#1c1917',       // stone-900
  mutedText: '#78716c',       // stone-500
  badgeBg: '#ff9824',
  totalBg: '#ff9824',
  rowBg: '#ffffff',
  rowBorder: '#ffedd5',       // orange-100
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

  const [savingImage, setSavingImage] = useState(false)

  const actionsRef = useRef<HTMLDivElement>(null)
  const scrollBodyRef = useRef<HTMLDivElement>(null)

  const handleSaveImage = async () => {
    if (!contentRef.current) return
    setSavingImage(true)

    // ซ่อนปุ่ม
    if (actionsRef.current) actionsRef.current.style.display = 'none'

    // เปิด overflow ชั่วคราวเพื่อให้ capture ได้ครบทุก item
    const prevOuter = contentRef.current.style.overflow
    contentRef.current.style.overflow = 'visible'
    let prevInner = ''
    let prevInnerHeight = ''
    if (scrollBodyRef.current) {
      prevInner = scrollBodyRef.current.style.overflow
      prevInnerHeight = scrollBodyRef.current.style.maxHeight
      scrollBodyRef.current.style.overflow = 'visible'
      scrollBodyRef.current.style.maxHeight = 'none'
    }

    try {
      const filename = `ใบเสร็จ-${billNo}.png`
      const canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function'

      if (canShare) {
        const blob = await toBlob(contentRef.current, { cacheBust: true, pixelRatio: 2 })
        if (!blob) throw new Error('capture failed')
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `ใบเสร็จ ${billNo}` })
        } else {
          // share ไม่ support files — fallback download
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = filename
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
      } else {
        const dataUrl = await toPng(contentRef.current, { cacheBust: true, pixelRatio: 2 })
        const link = document.createElement('a')
        link.download = filename
        link.href = dataUrl
        link.click()
      }
    } finally {
      // คืนค่าทุกอย่าง
      contentRef.current.style.overflow = prevOuter
      if (scrollBodyRef.current) {
        scrollBodyRef.current.style.overflow = prevInner
        scrollBodyRef.current.style.maxHeight = prevInnerHeight
      }
      if (actionsRef.current) actionsRef.current.style.display = ''
      setSavingImage(false)
    }
  }

  const printHandler = onPrint ?? handlePrint
  const statusLabel = betStatus ? BET_STATUS_LABEL[betStatus] ?? betStatus : null
  const itemCount = items.length
  const hasAnyRate = items.some((i) => i.payout_rate != null && String(i.payout_rate).trim() !== '')

  return (
    <div
      className="mx-auto w-full max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col sm:w-[300px] text-[13px]"
      style={{ fontFamily: 'var(--font-sans, sans-serif)' }}
    >
      <div
        ref={contentRef}
        className="max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col sm:rounded-2xl sm:overflow-hidden sm:border"
        style={{ backgroundColor: C.primaryLight, borderColor: C.border }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-4 py-4 text-center text-white"
          style={{ backgroundColor: C.primary }}
        >
          <div className="text-[17px] font-semibold mb-0.5">ใบเสร็จรับเงิน</div>
          <div className="text-xs opacity-85">ระบบหวย Back Office</div>
        </div>

        {/* Body */}
        <div className="px-4 py-4 max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col max-sm:pb-2">
          <div ref={scrollBodyRef} className="max-sm:min-h-0 max-sm:flex-1 max-sm:overflow-y-auto max-sm:overscroll-contain print:overflow-visible print:max-sm:flex-none">

            {/* Info rows */}
            <div className="space-y-[5px]">
              <Row label="เลขที่บิล" value={billNo} />
              {betFullId ? (
                <div className="flex flex-col gap-0.5 pb-1.5 border-b" style={{ borderColor: C.border }}>
                  <span className="text-xs" style={{ color: C.labelText }}>รหัสบิล (เต็ม)</span>
                  <span className="break-all text-[10px] font-medium leading-snug" style={{ color: C.valueText }}>
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
                  <span className="text-xs" style={{ color: C.labelText }}>หมายเหตุ</span>
                  <span className="whitespace-pre-wrap break-words text-[11px] font-medium" style={{ color: C.valueText }}>
                    {note.trim()}
                  </span>
                </div>
              ) : null}
              <Row label="เวลา" value={createdAt ? formatTime(createdAt) : '—'} />
              <Row label="จำนวนรายการ" value={`${itemCount} รายการ`} />
            </div>

            <hr className="my-3" style={{ borderColor: C.border }} />

            {/* Column headers */}
            <div className="flex justify-between px-3 pb-1.5">
              <span className="text-[11px] font-medium" style={{ color: C.labelText }}>เลข</span>
              <span className="text-[11px] font-medium" style={{ color: C.labelText }}>ประเภท</span>
              {hasAnyRate ? (
                <span className="text-[11px] font-medium text-right w-12" style={{ color: C.labelText }}>จ่าย</span>
              ) : null}
              <span className="text-[11px] font-medium" style={{ color: C.labelText }}>ยอด</span>
            </div>

            {/* Item cards */}
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center rounded-[10px] px-3 py-2.5 border"
                  style={{ backgroundColor: C.rowBg, borderColor: C.rowBorder }}
                >
                  <div className="flex gap-2.5 items-center min-w-0 flex-1">
                    <span
                      className="text-white rounded-md px-2.5 py-1 text-sm font-medium shrink-0"
                      style={{ backgroundColor: C.badgeBg }}
                    >
                      {item.number}
                    </span>
                    <span className="text-xs truncate" style={{ color: C.labelText }}>
                      {BET_TYPE_LABEL[item.bet_type as BetType] ?? item.bet_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasAnyRate ? (
                      <span className="text-[10px] tabular-nums w-12 text-right" style={{ color: C.mutedText }}>
                        {formatPayoutRate(item.payout_rate)}
                      </span>
                    ) : null}
                    <span className="font-semibold text-[13px] tabular-nums" style={{ color: C.valueText }}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div
              className="flex justify-between items-center rounded-[10px] px-3.5 py-3 mt-2"
              style={{ backgroundColor: C.totalBg }}
            >
              <span className="text-white text-sm font-medium">รวมทั้งสิ้น</span>
              <span className="text-white text-xl font-semibold tabular-nums">
                {formatCurrency(totalAmount)} บาท
              </span>
            </div>

            {/* Footer */}
            <div className="text-center text-[11px] mt-3 mb-1 leading-relaxed" style={{ color: C.mutedText }}>
              <p>ขอบคุณที่ใช้บริการ</p>
              <p>พิมพ์เมื่อ {new Date().toLocaleString('th-TH')}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div ref={actionsRef} className="mt-2.5 flex gap-2 print:hidden max-sm:mt-auto max-sm:shrink-0 max-sm:pt-2 pb-[env(safe-area-inset-bottom,0px)]">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border text-[13px] cursor-pointer text-center transition-colors"
                style={{ borderColor: C.border, backgroundColor: C.primaryLight, color: C.labelText }}
              >
                ปิด
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveImage}
              disabled={savingImage}
              className="flex-1 py-2 rounded-lg border text-[13px] cursor-pointer flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80 disabled:opacity-50 font-medium"
              style={{ borderColor: C.border, backgroundColor: C.primaryLight, color: C.labelText }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {savingImage ? 'กำลังบันทึก...' : 'บันทึกรูป'}
            </button>
            <button
              type="button"
              onClick={printHandler}
              className="flex-1 py-2 rounded-lg text-[13px] cursor-pointer flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 text-white font-medium"
              style={{ backgroundColor: C.primary }}
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
      <span className="text-xs" style={{ color: C.labelText }}>{label}</span>
      <span className="text-xs font-medium max-w-[60%] text-right leading-snug" style={{ color: C.valueText }}>
        {value}
      </span>
    </div>
  )
}
