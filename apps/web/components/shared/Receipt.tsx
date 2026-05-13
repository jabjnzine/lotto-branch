'use client'

import { formatThaiDate, formatCurrency, formatTime } from '@/lib/utils'
import { BET_TYPE_LABEL, type BetType } from '@lotto/shared'

interface ReceiptItem {
  number: string
  bet_type: string
  amount: string
}

interface ReceiptProps {
  billNo: string
  drawDate: string
  typeName: string
  buyerName: string
  items: ReceiptItem[]
  totalAmount: number | string
  createdAt?: string
}

export function Receipt({ billNo, drawDate, typeName, buyerName, items, totalAmount, createdAt }: ReceiptProps) {
  return (
    <div className="receipt-printable max-w-[300px] mx-auto text-sm" style={{ fontFamily: 'monospace' }}>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-printable, .receipt-printable * { visibility: visible; }
          .receipt-printable { position: absolute; left: 0; top: 0; width: 100%; padding: 16px; }
        }
      `}</style>

      <div className="text-center mb-4 border-b border-dashed border-slate-300 pb-3">
        <h2 className="text-base font-bold">ใบเสร็จรับเงิน</h2>
        <p className="text-xs text-slate-500 mt-1">ระบบหวย Back Office</p>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">เลขที่บิล</span>
          <span className="font-semibold">{billNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">งวดวันที่</span>
          <span className="font-semibold">{formatThaiDate(drawDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">ประเภท</span>
          <span className="font-semibold">{typeName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">ลูกค้า</span>
          <span className="font-semibold">{buyerName || 'ลูกค้าทั่วไป'}</span>
        </div>
        {createdAt && (
          <div className="flex justify-between">
            <span className="text-slate-500">เวลา</span>
            <span className="font-semibold">{formatTime(createdAt)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-b border-dashed border-slate-300 py-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="text-left py-1 font-normal">เลข</th>
              <th className="text-left py-1 font-normal">ประเภท</th>
              <th className="text-right py-1 font-normal">ยอด</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="py-1 font-semibold">{item.number}</td>
                <td className="py-1 text-slate-600">
                  {BET_TYPE_LABEL[item.bet_type as BetType] ?? item.bet_type}
                </td>
                <td className="py-1 text-right tabular-nums">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-3 font-bold text-base border-t border-dashed border-slate-300 pt-2">
        <span>รวมทั้งสิ้น</span>
        <span className="tabular-nums">{formatCurrency(totalAmount)} บาท</span>
      </div>

      <div className="text-center text-xs text-slate-400 mt-6">
        <p>ขอบคุณที่ใช้บริการ</p>
        <p className="mt-1">พิมพ์เมื่อ {new Date().toLocaleString('th-TH')}</p>
      </div>
    </div>
  )
}
