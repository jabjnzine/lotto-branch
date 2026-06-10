'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLotteryTypes, usePrizeRates } from '@/lib/hooks/useLotteryTypes'
import { useCurrentRound } from '@/lib/hooks/useRounds'
import { useCreateBet } from '@/lib/hooks/useBets'
import { useRestrictions } from '@/lib/hooks/useRestrictions'
import { useBetStore } from '@/lib/stores/useBetStore'
import { useHouses } from '@/lib/hooks/useHouses'
import { HouseSelect } from '@/components/ui/select-ark'
import { PageHeader } from '@/components/shared/PageHeader'
import { LotteryTypeSelector } from '@/components/lottery/LotteryTypeSelector'
import { Receipt } from '@/components/shared/Receipt'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  BET_TYPE_DIGIT_COUNT,
  BET_TYPE_LABEL,
  LOTTERY_TYPE_BET_TYPES,
  BetType,
  RestrictionType,
  type BetTypeGroupId,
  groupBetTypesForUi,
} from '@lotto/shared'
import { cn, dayjs, formatCurrency } from '@/lib/utils'
import { useToastStore } from '@/lib/stores/useToastStore'
import { downloadHtmlAsXls } from '@/lib/export-utils'
import {
  CalendarDays,
  FileSpreadsheet,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

/** จำนวนแถวขั้นต่ำในตาราง (ช่องว่าง) เมื่อรายการยังไม่ถึงเท่านี้ */
const TABLE_MIN_ROWS = 10
/** ความสูงสูงสุดของตาราง — ถ้ามีรายการมาก ให้เลื่อนดูภายในกรอบ */
const TABLE_BODY_MAX_H = 'min(28rem, 55vh)'
const POS_BLUE = '#ff9824'

/** แสดงอัตราจ่ายในช่องมุมขวา — ค่าว่างคืน em dash */
function formatRateBox(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === '') return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (Number.isNaN(n)) return '—'
  if (Number.isInteger(n)) return n.toLocaleString('th-TH')
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function itemId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function BetPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedBetType, setSelectedBetType] = useState<BetType>(BetType.THREE_TOP)
  const [number, setNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null)
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [note, setNote] = useState('')
  const [isReverse, setIsReverse] = useState(false)
  const [draftBillNo, setDraftBillNo] = useState(
    () => `BT-${dayjs().format('YYMMDD')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  )
  const [activeBetGroupId, setActiveBetGroupId] = useState<BetTypeGroupId | null>(null)
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: '',
  })
  const [receiptDialog, setReceiptDialog] = useState<{
    show: boolean
    billNo: string
    betFullId?: string
    drawDate: string
    typeName: string
    buyerName: string
    note?: string | null
    betStatus?: string | null
    items: Array<{ number: string; bet_type: string; amount: string; payout_rate?: string | number | null }>
    totalAmount: number
    createdAt: string
  }>({
    show: false,
    billNo: '',
    drawDate: '',
    typeName: '',
    buyerName: '',
    items: [],
    totalAmount: 0,
    createdAt: '',
  })

  const { data: houses } = useHouses()
  const { data: lotteryTypes, isLoading: typesLoading } = useLotteryTypes()
  const { data: prizeRates } = usePrizeRates(selectedTypeId)
  const { data: currentRound } = useCurrentRound(selectedTypeId)
  const { data: restrictions } = useRestrictions(currentRound?.id ?? null)
  const { draftItems, addItem, removeItem, clearItems } = useBetStore()
  const createBet = useCreateBet()
  const toast = useToastStore((s) => s.toast)

  const selectedType = lotteryTypes?.find((lt) => lt.id === selectedTypeId)

  useEffect(() => {
    if (!selectedTypeId && lotteryTypes && lotteryTypes.length > 0) {
      setSelectedTypeId(lotteryTypes[0].id)
    }
  }, [selectedTypeId, lotteryTypes])

  const allowedBetTypes = useMemo(
    () => (selectedType ? LOTTERY_TYPE_BET_TYPES[selectedType.code] ?? [] : []),
    [selectedType],
  )

  const betTypeGroups = useMemo(() => groupBetTypesForUi(allowedBetTypes), [allowedBetTypes])

  const resolvedTabGroupId = activeBetGroupId ?? betTypeGroups[0]?.groupId ?? null
  const activeBetGroup =
    betTypeGroups.find((g) => g.groupId === resolvedTabGroupId) ?? betTypeGroups[0] ?? null

  useEffect(() => {
    if (!selectedTypeId || !betTypeGroups.length) {
      setActiveBetGroupId(null)
      return
    }
    const firstBt = allowedBetTypes[0]
    const grp = betTypeGroups.find((g) => g.betTypes.includes(firstBt))
    setActiveBetGroupId(grp?.groupId ?? betTypeGroups[0].groupId)
  }, [selectedTypeId, betTypeGroups, allowedBetTypes])

  useEffect(() => {
    if (!activeBetGroupId) return
    const group = betTypeGroups.find((g) => g.groupId === activeBetGroupId)
    if (!group) return
    if (!group.betTypes.includes(selectedBetType)) {
      setSelectedBetType(group.betTypes[0])
      setNumber('')
      setIsReverse(false)
    }
  }, [activeBetGroupId, betTypeGroups, selectedBetType])

  const maxLength = BET_TYPE_DIGIT_COUNT[selectedBetType] ?? 2
  const canReverse = maxLength === 2 || maxLength === 3

  const drawDateLabel = currentRound
    ? dayjs(currentRound.draw_date).format('DD/MM/BBBB')
    : '—'

  /** แสดงทุกรายการเสมอ — ถ้าน้อยกว่า TABLE_MIN_ROWS จะเติมแถวว่างให้ครบ */
  const tableRows = useMemo(() => {
    const n = Math.max(TABLE_MIN_ROWS, draftItems.length)
    return Array.from({ length: n }, (_, i) => draftItems[i] ?? null)
  }, [draftItems])

  const handleAddItem = () => {
    if (!number || number.length !== maxLength) {
      setAlertDialog({ show: true, title: 'กรอกเลขไม่ครบ', message: `กรุณากรอกเลข ${maxLength} หลักให้ครบ` })
      return
    }
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setAlertDialog({ show: true, title: 'ยอดไม่ถูกต้อง', message: 'กรุณากรอกยอดเงินที่ถูกต้อง' })
      return
    }

    // เช็คเลขอั้น
    const restriction = restrictions?.find(
      (r: { number: string; bet_type: string; restriction_type: string; limit_amount?: string | null }) =>
        r.number === number && r.bet_type === selectedBetType,
    )
    if (restriction) {
      if (restriction.restriction_type === RestrictionType.CLOSED) {
        setAlertDialog({
          show: true,
          title: 'เลขอั้น',
          message: `เลข ${number} (${BET_TYPE_LABEL[selectedBetType]}) ปิดรับแล้ว`,
        })
        return
      }
      if (restriction.restriction_type === RestrictionType.LIMITED && restriction.limit_amount) {
        const limit = parseFloat(restriction.limit_amount)
        const alreadyInDraft = draftItems
          .filter((item) => item.number === number && item.bet_type === selectedBetType)
          .reduce((sum, item) => sum + item.amount, 0)
        if (alreadyInDraft + numAmount > limit) {
          setAlertDialog({
            show: true,
            title: 'วงเงินอั้นเต็ม',
            message: `เลข ${number} รับได้อีก ${Math.max(0, limit - alreadyInDraft).toLocaleString()} บาท`,
          })
          return
        }
      }
    }

    addItem({ id: itemId(), number, bet_type: selectedBetType, amount: numAmount })

    if (isReverse && canReverse) {
      const reverseNum = number.split('').reverse().join('')
      if (reverseNum !== number) {
        addItem({ id: itemId(), number: reverseNum, bet_type: selectedBetType, amount: numAmount })
      }
    }

    setNumber('')
  }

  const handleSubmit = useCallback(async () => {
    if (!currentRound || draftItems.length === 0 || !selectedTypeId) return

    const total = draftItems.reduce((sum, item) => sum + item.amount, 0)

    try {
      const savedBet = await createBet.mutateAsync({
        round_id: currentRound.id,
        lottery_type_id: selectedTypeId,
        house_id: selectedHouseId || null,
        buyer_name: buyerName || undefined,
        note: note || undefined,
        items: draftItems.map((item) => ({
          number: item.number,
          bet_type: item.bet_type,
          amount: item.amount,
        })),
      })

      toast({
        title: 'บันทึกบิลสำเร็จ',
        description: `เลขที่บิล ${draftBillNo} จำนวน ${draftItems.length} รายการ`,
        variant: 'success',
      })

      setReceiptDialog({
        show: true,
        billNo: savedBet.id?.slice(-8).toUpperCase() ?? draftBillNo,
        betFullId: savedBet.id,
        drawDate: currentRound.draw_date,
        typeName: selectedType?.name ?? '',
        buyerName: buyerName || 'ลูกค้าทั่วไป',
        note: savedBet.note ?? note ?? null,
        betStatus: savedBet.status ?? 'pending',
        items: (savedBet.items ?? draftItems).map(
          (item: {
            number: string
            bet_type: string
            amount: string | number
            payout_rate?: string | number | null
          }) => ({
            number: item.number,
            bet_type: item.bet_type,
            amount: String(item.amount),
            payout_rate: item.payout_rate ?? null,
          }),
        ),
        totalAmount: Number(savedBet.total_amount ?? total),
        createdAt: savedBet.created_at ?? new Date().toISOString(),
      })

      clearItems()
      setBuyerName('')
      setBuyerPhone('')
      setNote('')
      setDraftBillNo(
        `BT-${dayjs().format('YYMMDD')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      )
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      setAlertDialog({
        show: true,
        title: 'บันทึกบิลไม่สำเร็จ',
        message: Array.isArray(message) ? message.join(', ') : String(message),
      })
    }
  }, [
    buyerName,
    clearItems,
    createBet,
    currentRound,
    draftBillNo,
    draftItems,
    note,
    selectedHouseId,
    selectedType?.name,
    selectedTypeId,
  ])

  const handleExportDraft = useCallback(() => {
    if (draftItems.length === 0) return
    const rows = draftItems.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-weight:bold">${item.number}</td>
        <td>${BET_TYPE_LABEL[item.bet_type] ?? item.bet_type}</td>
        <td style="text-align:right">${item.amount.toLocaleString()}</td>
      </tr>`).join('')

    const total = draftItems.reduce((sum, item) => sum + item.amount, 0)
    const table = `
      <h3>${draftBillNo}</h3>
      <p>งวด: ${drawDateLabel} | ${selectedType?.name ?? ''} | ลูกค้า: ${buyerName || 'ทั่วไป'}</p>
      <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;max-width:400px">
        <thead><tr style="background:#ff9824;color:white">
          <th>#</th><th>เลข</th><th>ประเภท</th><th>ยอด (บาท)</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr style="font-weight:bold;background:#f0f9ff">
          <td colspan="3" style="text-align:right">รวมทั้งสิ้น</td>
          <td style="text-align:right">${total.toLocaleString()}</td>
        </tr></tfoot>
      </table>`
    downloadHtmlAsXls(draftBillNo, table)
  }, [draftItems, draftBillNo, drawDateLabel, selectedType?.name, buyerName])

  const handleClearForm = useCallback(() => {
    clearItems()
    setBuyerName('')
    setBuyerPhone('')
    setNote('')
    setNumber('')
    setAmount('')
    setIsReverse(false)
  }, [clearItems])

  const totalAmount = draftItems.reduce((sum, item) => sum + item.amount, 0)
  const isClosed = !currentRound || (!!currentRound?.close_at && new Date(currentRound.close_at) < new Date())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedTypeId) return
      if (e.key === 'F2') {
        e.preventDefault()
        void handleSubmit()
      }
      if (e.key === 'F3') {
        e.preventDefault()
        handleClearForm()
      }
      if (e.key === 'F4') {
        e.preventDefault()
        if (receiptDialog.show) {
          window.print()
        } else if (draftItems.length > 0 && !isClosed) {
          void handleSubmit()
        }
      }
      if (e.key === 'F5') {
        e.preventDefault()
        handleExportDraft()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClearForm, handleSubmit, handleExportDraft, receiptDialog.show, draftItems.length, isClosed, selectedTypeId])

  if (typesLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-6">
      <PageHeader title="คีย์หวย" />

      {lotteryTypes && lotteryTypes.length > 0 && (
        <LotteryTypeSelector
          lotteryTypes={lotteryTypes}
          selectedTypeId={selectedTypeId}
          onSelect={(id) => {
            const lt = lotteryTypes.find((t) => t.id === id)
            setSelectedTypeId(id)
            const types = LOTTERY_TYPE_BET_TYPES[lt?.code ?? ''] ?? []
            setSelectedBetType(types[0] ?? BetType.TWO_BOTTOM)
            clearItems()
            setIsReverse(false)
          }}
        />
      )}

      {!selectedTypeId && (
        <div className="rounded-xl border border-dashed border-border bg-primary/5 py-16 text-center text-muted-foreground">
          <p className="text-lg">เลือกประเภทหวยเพื่อเริ่มคีย์</p>
        </div>
      )}

      {selectedTypeId && (
        <>
          {/* หัวบิล — สไตล์ POS */}
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">เลขที่บิล</span>
                <input
                  readOnly
                  value={draftBillNo}
                  className="rounded-md border border-border bg-primary/10 px-3 py-2 text-sm font-mono text-foreground"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">วันที่ (งวด)</span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ff9824]" />
                  <input
                    readOnly
                    value={drawDateLabel}
                    className="w-full rounded-md border border-border bg-card py-2 pl-10 pr-3 text-sm"
                  />
                </div>
              </label>
              <div>
                <HouseSelect
                  label="บ้าน"
                  houses={houses}
                  value={selectedHouseId}
                  onChange={setSelectedHouseId}
                  disabled={isClosed}
                />
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">ชื่อลูกค้า</span>
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="ลูกค้าทั่วไป"
                  disabled={isClosed}
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff9824]/40 disabled:bg-muted"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">เบอร์โทร</span>
                <input
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="—"
                  inputMode="numeric"
                  disabled={isClosed}
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff9824]/40 disabled:bg-muted"
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
                <span className="text-xs font-medium text-muted-foreground">หมายเหตุ</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ระบุหมายเหตุ (ถ้ามี)"
                  disabled={isClosed}
                  className="rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff9824]/40 disabled:bg-muted"
                />
              </label>
            </div>
          </div>

          {/* ตารางรายการ — รายการเกิน 10 แถวยังแสดงครบ; เลื่อนในกรอบเมื่อสูงเกิน TABLE_BODY_MAX_H */}
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: POS_BLUE }}
            >
              <span>รายการแทง</span>
              {draftItems.length > 0 && (
                <span className="text-xs font-normal opacity-95">
                  ทั้งหมด {draftItems.length} รายการ
                  {draftItems.length > TABLE_MIN_ROWS ? ' · เลื่อนตารางด้านล่างเพื่อดูทั้งหมด' : ''}
                </span>
              )}
            </div>
            <div
              className="overflow-x-auto overflow-y-auto border-t border-primary/20"
              style={{ maxHeight: TABLE_BODY_MAX_H }}
            >
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 shadow-sm">
                  <tr className="text-left text-white" style={{ backgroundColor: POS_BLUE }}>
                    <th className="border border-white/20 px-3 py-2 font-medium">ลำดับ</th>
                    <th className="border border-white/20 px-3 py-2 font-medium">เลข</th>
                    <th className="border border-white/20 px-3 py-2 font-medium">ประเภท</th>
                    <th className="border border-white/20 px-3 py-2 text-right font-medium">ยอด (บาท)</th>
                    <th className="border border-white/20 px-3 py-2 text-center font-medium w-16">ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((item, index) => (
                    <tr
                      key={item?.id ?? `empty-${index}`}
                      className={cn(
                        'border-b border-border',
                        item ? 'bg-card' : 'bg-muted/80',
                      )}
                    >
                      <td className="border border-border px-3 py-2 text-center text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="border border-border px-3 py-2 font-mono font-semibold text-foreground">
                        {item ? item.number : ''}
                      </td>
                      <td className="border border-border px-3 py-2">
                        {item ? (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {BET_TYPE_LABEL[item.bet_type]}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="border border-border px-3 py-2 text-right font-medium tabular-nums">
                        {item ? formatCurrency(item.amount) : ''}
                      </td>
                      <td className="border border-border px-2 py-1 text-center">
                        {item ? (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#ff9824] transition-colors hover:bg-primary/10 hover:text-red-600"
                            aria-label="ลบรายการ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="inline-block h-9 w-9" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* เพิ่มรายการ + สรุปยอด */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <section className="rounded-lg border border-border bg-card p-4 shadow-sm lg:col-span-7">
              <h3 className="mb-3 border-b border-border pb-2 text-sm font-semibold text-foreground">
                เพิ่มรายการแทง
              </h3>

              <p className="mb-2 text-xs font-medium text-muted-foreground">ประเภทการแทง</p>
              {/* แท็บหมวดหลัก + กริดประเภทย่อย + อัตราช่องขวา — โทน POS ฟ้า–ขาวเดียวกับหน้า */}
              {betTypeGroups.length > 0 && (
                <div className="mb-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                  <div className="flex gap-2">
                    {betTypeGroups.map((group) => {
                      const tabOn = resolvedTabGroupId === group.groupId
                      return (
                        <button
                          key={group.groupId}
                          type="button"
                          onClick={() => {
                            setActiveBetGroupId(group.groupId)
                            const first = group.betTypes[0]
                            setSelectedBetType(first)
                            setNumber('')
                            if (BET_TYPE_DIGIT_COUNT[first] !== 2 && BET_TYPE_DIGIT_COUNT[first] !== 3) {
                              setIsReverse(false)
                            }
                          }}
                          className={cn(
                            'flex-1 rounded-lg border py-2.5 text-center text-sm font-semibold transition-colors',
                            tabOn
                              ? 'border-[#ff9824] bg-primary text-primary-foreground font-bold border border-primary'
                              : 'border border-[#444444] bg-secondary text-foreground font-semibold hover:border-primary/60 hover:bg-[#333333] active:scale-[0.98]',
                          )}
                        >
                          {group.title}
                        </button>
                      )
                    })}
                  </div>

                  {activeBetGroup && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {activeBetGroup.betTypes.map((bt) => {
                        const row = prizeRates?.find(
                          (pr: { bet_type: string }) => pr.bet_type === bt,
                        )
                        const rateText = formatRateBox(row?.payout_rate)
                        const isSel = selectedBetType === bt
                        return (
                          <button
                            key={bt}
                            type="button"
                            disabled={isClosed}
                            onClick={() => {
                              setSelectedBetType(bt)
                              setNumber('')
                              if (BET_TYPE_DIGIT_COUNT[bt] !== 2 && BET_TYPE_DIGIT_COUNT[bt] !== 3) {
                                setIsReverse(false)
                              }
                            }}
                            className={cn(
                              'flex min-h-[52px] w-full overflow-hidden rounded-lg border text-left text-sm font-semibold transition-colors disabled:opacity-50',
                              isSel
                                ? 'border-[#ff9824] bg-primary text-primary-foreground font-bold border border-primary'
                                : 'border border-[#444444] bg-secondary text-foreground font-semibold hover:border-primary/60 hover:bg-[#333333] active:scale-[0.98]',
                            )}
                          >
                            <span
                              className={cn(
                                'flex flex-1 items-center px-3 py-2 leading-tight',
                                isSel ? 'text-white' : 'text-foreground',
                              )}
                            >
                              {BET_TYPE_LABEL[bt]}
                            </span>
                            <span
                              className={cn(
                                'flex w-[4.25rem] shrink-0 items-center justify-center border-l px-2 py-2 font-mono text-sm tabular-nums',
                                isSel
                                  ? 'border-white/25 bg-[#ea580c] text-white'
                                  : 'border-border bg-primary/10 text-foreground',
                              )}
                            >
                              {rateText}
                            </span>
                          </button>
                        )
                      })}

                      {canReverse && (
                        <button
                          type="button"
                          disabled={isClosed}
                          onClick={() => setIsReverse(!isReverse)}
                          className={cn(
                            'flex min-h-[52px] w-full overflow-hidden rounded-lg border text-left text-sm font-semibold transition-colors disabled:opacity-50',
                            isReverse
                              ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                              : 'border border-[#444444] bg-secondary text-foreground font-semibold hover:border-primary/60 hover:bg-[#333333] active:scale-[0.98]',
                          )}
                        >
                          <span className="flex flex-1 items-center px-3 py-2 leading-tight">
                            เลขกลับ
                          </span>
                          <span
                            className={cn(
                              'flex w-[4.25rem] shrink-0 items-center justify-center border-l px-2 py-2 font-mono text-sm tabular-nums',
                              isReverse
                                ? 'border-white/25 bg-amber-600 text-white'
                                : 'border-border bg-primary/10 text-foreground',
                            )}
                          >
                            {isReverse ? '✓' : ''}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">เลข ({maxLength} หลัก)</span>
                  </div>
                  <input
                    value={number}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, maxLength)
                      setNumber(val)
                    }}
                    inputMode="numeric"
                    maxLength={maxLength}
                    placeholder={'0'.repeat(maxLength)}
                    disabled={isClosed}
                    className="h-11 rounded-md border border-border px-3 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#ff9824]/40 disabled:bg-muted"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">ยอด (บาท)</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    placeholder="0"
                    disabled={isClosed}
                    className="h-11 rounded-md border border-border px-3 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#ff9824]/40 disabled:bg-muted"
                  />
                </label>
              </div>

              <Button
                type="button"
                onClick={handleAddItem}
                disabled={isClosed || number.length !== maxLength || !amount}
                className="mt-4 h-11 w-full gap-2 bg-[#ff9824] text-base font-semibold hover:bg-[#ea580c]"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                เพิ่มรายการ
              </Button>
            </section>

            <section className="rounded-lg border border-border bg-card p-4 shadow-sm lg:col-span-5">
              <h3 className="mb-3 border-b border-border pb-2 text-sm font-semibold text-foreground">
                สรุปยอดเงิน
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <dt>รวมยอดแทง</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(totalAmount)}
                  </dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>จำนวนรายการ</dt>
                  <dd className="tabular-nums">{draftItems.length} รายการ</dd>
                </div>
              </dl>
              <div
                className="mt-4 flex items-center justify-between rounded-md px-4 py-3 text-white"
                style={{ backgroundColor: POS_BLUE }}
              >
                <span className="text-sm font-semibold">ยอดรวมทั้งสิ้น</span>
                <span className="text-xl font-bold tabular-nums">{formatCurrency(totalAmount)} บาท</span>
              </div>
            </section>
          </div>

          {/* ปุ่มลัดด้านล่าง */}
          <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-gradient-to-b from-muted to-accent p-3 shadow-inner">
            <Button
              type="button"
              variant="action"
              className="flex-1 min-w-[140px] gap-2"
              onClick={() => void handleSubmit()}
              disabled={createBet.isPending || draftItems.length === 0 || isClosed}
            >
              <Save className="h-4 w-4 text-[#ff9824]" />
              <span className="font-medium">
                {createBet.isPending ? 'กำลังบันทึก...' : 'บันทึกบิล'}
              </span>
              <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                F2
              </kbd>
            </Button>
            <Button
              type="button"
              variant="action"
              className="flex-1 min-w-[140px] gap-2"
              onClick={handleClearForm}
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">ล้างข้อมูล</span>
              <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                F3
              </kbd>
            </Button>
            <Button
              type="button"
              variant="action"
              className="flex-1 min-w-[140px] gap-2"
              onClick={() => {
                if (receiptDialog.show) {
                  window.print()
                } else if (draftItems.length > 0 && !isClosed) {
                  void handleSubmit()
                }
              }}
              disabled={draftItems.length === 0 || isClosed}
              title={draftItems.length === 0 ? 'กรุณาเพิ่มรายการ' : isClosed ? 'งวดนี้ปิดรับแล้ว' : receiptDialog.show ? 'พิมพ์ใบเสร็จ (F4)' : 'บันทึกและพิมพ์ใบเสร็จ (F4)'}
            >
              <Printer className="h-4 w-4 text-[#ff9824]" />
              <span className="font-medium">พิมพ์ใบเสร็จ</span>
              <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                F4
              </kbd>
            </Button>
            <Button
              type="button"
              variant="action"
              className="flex-1 min-w-[140px] gap-2"
              onClick={handleExportDraft}
              disabled={draftItems.length === 0}
              title={draftItems.length === 0 ? 'กรุณาเพิ่มรายการ' : 'ส่งออกเป็น Excel (F5)'}
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span className="font-medium">ส่งออก Excel</span>
              <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                F5
              </kbd>
            </Button>
          </div>
        </>
      )}

      {/* Alert Dialog */}
      <Dialog open={alertDialog.show} onOpenChange={(open) => { if (!open) setAlertDialog({ show: false, title: '', message: '' }) }}>
        <DialogContent className="max-w-sm p-0 [&>button]:hidden">
          <div className="flex flex-col items-center px-6 pt-8 pb-2">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <DialogTitle className="text-center text-lg mb-1.5">{alertDialog.title}</DialogTitle>
            <DialogDescription className="text-center text-base text-muted-foreground">
              {alertDialog.message}
            </DialogDescription>
          </div>
          <div className="px-6 pb-6 pt-3">
            <Button
              onClick={() => setAlertDialog({ show: false, title: '', message: '' })}
              className="w-full bg-red-500 hover:bg-red-600 text-white h-11 text-base font-semibold"
            >
              รับทราบ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog
        open={receiptDialog.show}
        onOpenChange={(open) => {
          if (!open) setReceiptDialog((s) => ({ ...s, show: false }))
        }}
      >
        <DialogContent
          overlayClassName="max-sm:hidden"
          className="w-full max-w-none min-w-0 gap-0 border-0 !bg-transparent p-0 !shadow-none rounded-none max-sm:!top-0 max-sm:!left-0 max-sm:!right-0 max-sm:!h-[100dvh] max-sm:!w-full max-sm:!max-w-none max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!rounded-none max-sm:!max-h-none max-sm:overflow-hidden max-sm:overscroll-contain max-sm:bg-background max-sm:flex max-sm:flex-col sm:left-1/2 sm:top-1/2 sm:w-fit sm:max-w-[min(100vw,360px)] sm:max-h-[92dvh] sm:overflow-y-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl [&>button]:hidden"
        >
          <DialogTitle className="sr-only">ใบเสร็จ</DialogTitle>
          <DialogDescription className="sr-only">รายละเอียดใบเสร็จรับเงิน</DialogDescription>
          <Receipt
            billNo={receiptDialog.billNo}
            betFullId={receiptDialog.betFullId}
            drawDate={receiptDialog.drawDate}
            typeName={receiptDialog.typeName}
            buyerName={receiptDialog.buyerName}
            note={receiptDialog.note}
            betStatus={receiptDialog.betStatus}
            items={receiptDialog.items}
            totalAmount={receiptDialog.totalAmount}
            createdAt={receiptDialog.createdAt}
            onClose={() => setReceiptDialog((s) => ({ ...s, show: false }))}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
