'use client'

import { useState } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useCurrentRound } from '@/lib/hooks/useRounds'
import { useCreateBet } from '@/lib/hooks/useBets'
import { useBetStore } from '@/lib/stores/useBetStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { Countdown } from '@/components/shared/Countdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { BET_TYPE_DIGIT_COUNT, BET_TYPE_LABEL, LOTTERY_TYPE_BET_TYPES, BetType } from '@lotto/shared'
import { formatCurrency, formatThaiDate } from '@/lib/utils'
import { Trash2, Plus } from 'lucide-react'
function nanoid() {
  return Math.random().toString(36).slice(2, 10)
}

export default function BetPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedBetType, setSelectedBetType] = useState<BetType>(BetType.THREE_TOP)
  const [number, setNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const { data: lotteryTypes, isLoading: typesLoading } = useLotteryTypes()
  const { data: currentRound } = useCurrentRound(selectedTypeId)
  const { draftItems, addItem, removeItem, clearItems } = useBetStore()
  const createBet = useCreateBet()

  const selectedType = lotteryTypes?.find((lt) => lt.id === selectedTypeId)
  const allowedBetTypes = selectedType ? LOTTERY_TYPE_BET_TYPES[selectedType.code] ?? [] : []

  const maxLength = BET_TYPE_DIGIT_COUNT[selectedBetType] ?? 2

  const handleAddItem = () => {
    if (!number || !amount || number.length !== maxLength) return
    addItem({
      id: nanoid(),
      number,
      bet_type: selectedBetType,
      amount: parseFloat(amount),
    })
    setNumber('')
  }

  const handleSubmit = async () => {
    if (!currentRound || draftItems.length === 0 || !selectedTypeId) return

    await createBet.mutateAsync({
      round_id: currentRound.id,
      lottery_type_id: selectedTypeId,
      note: note || undefined,
      items: draftItems.map((item) => ({
        number: item.number,
        bet_type: item.bet_type,
        amount: item.amount,
      })),
    })

    clearItems()
    setNote('')
  }

  if (typesLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const totalAmount = draftItems.reduce((sum, item) => sum + item.amount, 0)
  const isClosed = !currentRound

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <PageHeader title="คีย์หวย" />

      {/* Lottery Type Selector */}
      <div className="flex flex-wrap gap-2">
        {lotteryTypes?.map((lt) => (
          <button
            key={lt.id}
            onClick={() => {
              setSelectedTypeId(lt.id)
              const types = LOTTERY_TYPE_BET_TYPES[lt.code] ?? []
              setSelectedBetType(types[0] ?? BetType.TWO_BOTTOM)
              clearItems()
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedTypeId === lt.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {lt.name}
          </button>
        ))}
      </div>

      {selectedTypeId && (
        <>
          {/* Round Info */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {currentRound ? formatThaiDate(currentRound.draw_date) : 'ไม่มีงวดที่เปิดรับ'}
                </p>
                {currentRound && (
                  <p className="text-xs text-slate-400 mt-0.5">งวดวันที่</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-0.5">ปิดรับใน</p>
                <Countdown closeAt={currentRound?.close_at} />
              </div>
            </CardContent>
          </Card>

          {/* Bet Type */}
          <div className="flex flex-wrap gap-2">
            {allowedBetTypes.map((bt) => (
              <button
                key={bt}
                onClick={() => {
                  setSelectedBetType(bt)
                  setNumber('')
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedBetType === bt
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {BET_TYPE_LABEL[bt]}
              </button>
            ))}
          </div>

          {/* Input Row */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">เลข ({maxLength} หลัก)</label>
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
                    className="w-full h-12 border border-slate-200 rounded-md px-3 text-lg font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">ยอด (บาท)</label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    placeholder="0"
                    disabled={isClosed}
                    className="w-full h-12 border border-slate-200 rounded-md px-3 text-lg font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                  />
                </div>
                <Button
                  onClick={handleAddItem}
                  disabled={isClosed || number.length !== maxLength || !amount}
                  size="lg"
                  className="h-12 px-5"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Draft Items */}
          {draftItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">รายการแทง ({draftItems.length} รายการ)</CardTitle>
                  <button onClick={clearItems} className="text-xs text-red-500 hover:text-red-600">
                    ล้างทั้งหมด
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {draftItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg text-slate-900">{item.number}</span>
                        <Badge variant="secondary" className="text-xs">
                          {BET_TYPE_LABEL[item.bet_type]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-700">{formatCurrency(item.amount)} บาท</span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="หมายเหตุ (ถ้ามี)"
                      className="flex-1 h-9 border border-slate-200 rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">รวมทั้งหมด</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(totalAmount)} บาท</span>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    className="w-full h-12 text-base"
                    disabled={createBet.isPending}
                  >
                    {createBet.isPending ? 'กำลังบันทึก...' : `บันทึกบิล ${formatCurrency(totalAmount)} บาท`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedTypeId && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">เลือกประเภทหวยเพื่อเริ่มคีย์</p>
        </div>
      )}
    </div>
  )
}
