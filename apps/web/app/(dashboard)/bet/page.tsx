'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLotteryTypes, usePrizeRates } from '@/lib/hooks/useLotteryTypes'
import { useCurrentRound } from '@/lib/hooks/useRounds'
import { useCreateBet } from '@/lib/hooks/useBets'
import { useBetStore } from '@/lib/stores/useBetStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { Countdown } from '@/components/shared/Countdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
  BET_TYPE_DIGIT_COUNT,
  BET_TYPE_LABEL,
  LOTTERY_TYPE_BET_TYPES,
  BetType,
  type BetTypeGroupId,
  groupBetTypesForUi,
} from '@lotto/shared'
import { cn, dayjs, formatCurrency, formatThaiDate } from '@/lib/utils'
import {
  CalendarDays,
  FileSpreadsheet,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'

/** จำนวนแถวขั้นต่ำในตาราง (ช่องว่าง) เมื่อรายการยังไม่ถึงเท่านี้ */
const TABLE_MIN_ROWS = 10
/** ความสูงสูงสุดของตาราง — ถ้ามีรายการมาก ให้เลื่อนดูภายในกรอบ */
const TABLE_BODY_MAX_H = 'min(28rem, 55vh)'
const POS_BLUE = '#007bff'

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
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [note, setNote] = useState('')
  const [isReverse, setIsReverse] = useState(false)
  const [draftBillNo, setDraftBillNo] = useState(
    () => `BT-${dayjs().format('YYMMDD')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  )
  const [activeBetGroupId, setActiveBetGroupId] = useState<BetTypeGroupId | null>(null)

  const { data: lotteryTypes, isLoading: typesLoading } = useLotteryTypes()
  const { data: prizeRates } = usePrizeRates(selectedTypeId)
  const { data: currentRound } = useCurrentRound(selectedTypeId)
  const { draftItems, addItem, removeItem, clearItems } = useBetStore()
  const createBet = useCreateBet()

  const selectedType = lotteryTypes?.find((lt) => lt.id === selectedTypeId)
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
    if (!number || !amount || number.length !== maxLength) return
    const numAmount = parseFloat(amount)

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

    await createBet.mutateAsync({
      round_id: currentRound.id,
      lottery_type_id: selectedTypeId,
      buyer_name: buyerName || undefined,
      note: note || undefined,
      items: draftItems.map((item) => ({
        number: item.number,
        bet_type: item.bet_type,
        amount: item.amount,
      })),
    })

    clearItems()
    setBuyerName('')
    setBuyerPhone('')
    setNote('')
    setDraftBillNo(
      `BT-${dayjs().format('YYMMDD')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    )
  }, [
    buyerName,
    clearItems,
    createBet,
    currentRound,
    draftItems,
    note,
    selectedTypeId,
  ])

  const handleClearForm = useCallback(() => {
    clearItems()
    setBuyerName('')
    setBuyerPhone('')
    setNote('')
    setNumber('')
    setAmount('')
    setIsReverse(false)
  }, [clearItems])

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
      if (e.key === 'F4' || e.key === 'F5') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClearForm, handleSubmit, selectedTypeId])

  if (typesLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const totalAmount = draftItems.reduce((sum, item) => sum + item.amount, 0)
  const isClosed = !currentRound

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-6">
      <PageHeader title="คีย์หวย" />

      {/* ประเภทหวย — แท็บด้านบน */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-blue-200 bg-white p-3 shadow-sm">
        {lotteryTypes?.map((lt) => (
          <button
            key={lt.id}
            type="button"
            onClick={() => {
              setSelectedTypeId(lt.id)
              const types = LOTTERY_TYPE_BET_TYPES[lt.code] ?? []
              setSelectedBetType(types[0] ?? BetType.TWO_BOTTOM)
              clearItems()
              setIsReverse(false)
            }}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              selectedTypeId === lt.id
                ? 'bg-[#007bff] text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {lt.name}
          </button>
        ))}
      </div>

      {!selectedTypeId && (
        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 py-16 text-center text-slate-500">
          <p className="text-lg">เลือกประเภทหวยเพื่อเริ่มคีย์</p>
        </div>
      )}

      {selectedTypeId && (
        <>
          {/* แถบงวด + countdown */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">งวด</p>
              <p className="text-sm font-semibold text-slate-800">
                {currentRound ? formatThaiDate(currentRound.draw_date) : 'ไม่มีงวดที่เปิดรับ'}
              </p>
              {selectedType && (
                <p className="text-xs text-slate-500">{selectedType.name}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">ปิดรับใน</p>
              <div className="text-lg font-semibold tabular-nums text-[#007bff]">
                <Countdown closeAt={currentRound?.close_at} />
              </div>
            </div>
          </div>

          {/* หัวบิล — สไตล์ POS */}
          <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">เลขที่บิล</span>
                <input
                  readOnly
                  value={draftBillNo}
                  className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-mono text-slate-800"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">วันที่ (งวด)</span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#007bff]" />
                  <input
                    readOnly
                    value={drawDateLabel}
                    className="w-full rounded-md border border-blue-200 bg-white py-2 pl-10 pr-3 text-sm"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">ชื่อลูกค้า</span>
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="ลูกค้าทั่วไป"
                  disabled={isClosed}
                  className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007bff]/40 disabled:bg-slate-50"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">เบอร์โทร</span>
                <input
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="—"
                  inputMode="numeric"
                  disabled={isClosed}
                  className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007bff]/40 disabled:bg-slate-50"
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
                <span className="text-xs font-medium text-slate-600">หมายเหตุ</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ระบุหมายเหตุ (ถ้ามี)"
                  disabled={isClosed}
                  className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007bff]/40 disabled:bg-slate-50"
                />
              </label>
            </div>
          </div>

          {/* ตารางรายการ — รายการเกิน 10 แถวยังแสดงครบ; เลื่อนในกรอบเมื่อสูงเกิน TABLE_BODY_MAX_H */}
          <div className="overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
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
              className="overflow-x-auto overflow-y-auto border-t border-blue-300/30"
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
                        'border-b border-slate-200',
                        item ? 'bg-white' : 'bg-slate-50/80',
                      )}
                    >
                      <td className="border border-slate-200 px-3 py-2 text-center text-slate-600">
                        {index + 1}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 font-mono font-semibold text-slate-900">
                        {item ? item.number : ''}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        {item ? (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {BET_TYPE_LABEL[item.bet_type]}
                          </Badge>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-medium tabular-nums">
                        {item ? formatCurrency(item.amount) : ''}
                      </td>
                      <td className="border border-slate-200 px-2 py-1 text-center">
                        {item ? (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#007bff] transition-colors hover:bg-blue-50 hover:text-red-600"
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
            <section className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm lg:col-span-7">
              <h3 className="mb-3 border-b border-blue-100 pb-2 text-sm font-semibold text-slate-800">
                เพิ่มรายการแทง
              </h3>

              <p className="mb-2 text-xs font-medium text-slate-600">ประเภทการแทง</p>
              {/* แท็บหมวดหลัก + กริดประเภทย่อย + อัตราช่องขวา — โทน POS ฟ้า–ขาวเดียวกับหน้า */}
              {betTypeGroups.length > 0 && (
                <div className="mb-3 rounded-xl border border-blue-200 bg-white p-3 shadow-sm">
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
                              ? 'border-[#007bff] bg-[#007bff] text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
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
                                ? 'border-[#007bff] bg-[#007bff] text-white shadow-sm'
                                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
                            )}
                          >
                            <span
                              className={cn(
                                'flex flex-1 items-center px-3 py-2 leading-tight',
                                isSel ? 'text-white' : 'text-slate-800',
                              )}
                            >
                              {BET_TYPE_LABEL[bt]}
                            </span>
                            <span
                              className={cn(
                                'flex w-[4.25rem] shrink-0 items-center justify-center border-l px-2 py-2 font-mono text-sm tabular-nums',
                                isSel
                                  ? 'border-white/25 bg-[#0062cc] text-white'
                                  : 'border-blue-200 bg-blue-50 text-slate-800',
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
                              : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
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
                                : 'border-blue-200 bg-blue-50 text-slate-800',
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
                    <span className="text-xs font-medium text-slate-600">เลข ({maxLength} หลัก)</span>
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
                    className="h-11 rounded-md border border-blue-200 px-3 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#007bff]/40 disabled:bg-slate-50"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-600">ยอด (บาท)</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    placeholder="0"
                    disabled={isClosed}
                    className="h-11 rounded-md border border-blue-200 px-3 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#007bff]/40 disabled:bg-slate-50"
                  />
                </label>
              </div>

              <Button
                type="button"
                onClick={handleAddItem}
                disabled={isClosed || number.length !== maxLength || !amount}
                className="mt-4 h-11 w-full gap-2 bg-[#007bff] text-base font-semibold hover:bg-[#0069d9]"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                เพิ่มรายการ
              </Button>
            </section>

            <section className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm lg:col-span-5">
              <h3 className="mb-3 border-b border-blue-100 pb-2 text-sm font-semibold text-slate-800">
                สรุปยอดเงิน
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>รวมยอดแทง</dt>
                  <dd className="font-semibold tabular-nums text-slate-900">
                    {formatCurrency(totalAmount)}
                  </dd>
                </div>
                <div className="flex justify-between text-slate-500">
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
          <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200/90 p-3 shadow-inner">
            <Button
              type="button"
              variant="secondary"
              className="h-12 flex-1 min-w-[140px] gap-2 border border-slate-300 bg-white shadow-sm hover:bg-slate-50"
              onClick={() => void handleSubmit()}
              disabled={createBet.isPending || draftItems.length === 0 || isClosed}
            >
              <Save className="h-4 w-4 text-[#007bff]" />
              <span className="font-medium">
                {createBet.isPending ? 'กำลังบันทึก...' : 'บันทึกบิล'}
              </span>
              <kbd className="ml-1 hidden rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                F2
              </kbd>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-12 flex-1 min-w-[140px] gap-2 border border-slate-300 bg-white shadow-sm hover:bg-slate-50"
              onClick={handleClearForm}
            >
              <RotateCcw className="h-4 w-4 text-slate-600" />
              <span className="font-medium">ล้างข้อมูล</span>
              <kbd className="ml-1 hidden rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                F3
              </kbd>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-12 flex-1 min-w-[140px] gap-2 border border-slate-300 bg-white text-slate-400 shadow-sm"
              disabled
              title="เร็วๆ นี้"
            >
              <Printer className="h-4 w-4" />
              <span>พิมพ์ใบเสร็จ</span>
              <kbd className="ml-1 hidden rounded border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                F4
              </kbd>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-12 flex-1 min-w-[140px] gap-2 border border-slate-300 bg-white text-slate-400 shadow-sm"
              disabled
              title="เร็วๆ นี้"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>ส่งออก Excel</span>
              <kbd className="ml-1 hidden rounded border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                F5
              </kbd>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
