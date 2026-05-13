'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useRounds } from '@/lib/hooks/useRounds'
import { useIncomeSummary } from '@/lib/hooks/useIncome'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn, formatCurrency, formatThaiDate } from '@/lib/utils'
import { BET_TYPE_LABEL, BetType } from '@lotto/shared'
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3 } from 'lucide-react'

const POS_BLUE = '#0284c7'

const roundStatusBadge: Record<string, { label: string; variant: 'success' | 'destructive' | 'warning' | 'default' }> = {
  open: { label: 'เปิดรับ', variant: 'success' },
  closed: { label: 'ปิดรับ', variant: 'warning' },
  resulted: { label: 'ออกผล', variant: 'default' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
}

export default function IncomePage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)

  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: rounds } = useRounds(selectedTypeId ?? undefined, 'resulted')
  const { data: summary, isLoading: summaryLoading } = useIncomeSummary(selectedRoundId)

  useEffect(() => {
    if (!selectedTypeId && lotteryTypes && lotteryTypes.length > 0) {
      setSelectedTypeId(lotteryTypes[0].id)
    }
  }, [selectedTypeId, lotteryTypes])

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const sortedRounds = useMemo(() => {
    if (!rounds) return []
    return [...rounds].sort((a, b) => {
      return new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime()
    })
  }, [rounds])

  const profit = summary ? parseFloat(summary.profit) : 0

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-6">
      <PageHeader title="รายได้" description="สรุปกำไร-ขาดทุนแยกตามงวด" />

      {/* ประเภทหวย */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-sky-200 bg-white p-3 shadow-sm">
        {lotteryTypes?.map((lt) => (
          <button
            key={lt.id}
            type="button"
            onClick={() => {
              setSelectedTypeId(lt.id)
              setSelectedRoundId(null)
            }}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              selectedTypeId === lt.id
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {lt.name}
          </button>
        ))}
      </div>

      {!selectedTypeId && (
        <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/40 py-16 text-center text-slate-500">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-sky-300" />
          <p className="text-lg">เลือกประเภทหวยเพื่อดูรายได้</p>
        </div>
      )}

      {selectedTypeId && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-lg border border-sky-200 bg-white shadow-sm">
              <div
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: POS_BLUE }}
              >
                <Target className="h-4 w-4" />
                งวดที่ออกผลแล้ว
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {sortedRounds.map((round) => {
                  const rStatus = roundStatusBadge[round.status] ?? { label: round.status, variant: 'default' as const }
                  return (
                    <button
                      key={round.id}
                      onClick={() => setSelectedRoundId(round.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-slate-100 transition-colors hover:bg-slate-50',
                        selectedRoundId === round.id && 'bg-sky-50 border-l-2 border-l-[#0284c7]',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{formatThaiDate(round.draw_date)}</span>
                        <Badge variant={rStatus.variant} className="text-[10px] px-1.5 py-0">
                          {rStatus.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{round.lottery_type?.name}</p>
                    </button>
                  )
                })}
                {(!rounds || rounds.length === 0) && (
                  <p className="text-xs text-slate-400 text-center py-8">ไม่มีงวดที่ออกผลแล้ว</p>
                )}
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-9 space-y-4">
            {summaryLoading && <LoadingSpinner className="py-12" />}

            {summary && !summaryLoading && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50">
                        <DollarSign className="h-5 w-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">ยอดรับรวม</p>
                        <p className="text-xl font-bold tabular-nums text-slate-900">
                          {formatCurrency(summary.totalReceived)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">ยอดจ่ายรวม</p>
                        <p className="text-xl font-bold tabular-nums text-slate-900">
                          {formatCurrency(summary.totalPayout)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        profit >= 0 ? 'bg-green-50' : 'bg-red-50',
                      )}>
                        <TrendingUp className={cn(
                          'h-5 w-5',
                          profit >= 0 ? 'text-green-600' : 'text-red-500',
                        )} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">กำไร/ขาดทุน</p>
                        <p className={cn(
                          'text-xl font-bold tabular-nums',
                          profit >= 0 ? 'text-green-600' : 'text-red-500',
                        )}>
                          {profit >= 0 ? '+' : ''}{formatCurrency(summary.profit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* By Lottery Type */}
                  <div className="overflow-hidden rounded-lg border border-sky-200 bg-white shadow-sm">
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: POS_BLUE }}
                    >
                      <BarChart3 className="h-4 w-4" />
                      แยกตามประเภทหวย
                    </div>
                    <div className="divide-y divide-slate-100 overflow-x-auto">
                      {summary.byLotteryType.map((lt: { code: string; name: string; received: string; payout: string; profit: string }) => {
                        const ltProfit = parseFloat(lt.profit)
                        return (
                          <div key={lt.code} className="flex items-center justify-between px-4 py-3 min-w-[320px]">
                            <span className="text-sm font-medium text-slate-700">{lt.name}</span>
                            <div className="flex items-center gap-2 sm:gap-4 text-sm tabular-nums">
                              <span className="text-slate-500">รับ {formatCurrency(lt.received)}</span>
                              <span className="text-red-500">จ่าย {formatCurrency(lt.payout)}</span>
                              <span className={cn(
                                'font-semibold',
                                ltProfit >= 0 ? 'text-green-600' : 'text-red-600',
                              )}>
                                {ltProfit >= 0 ? '+' : ''}{formatCurrency(lt.profit)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* By Bet Type */}
                  <div className="overflow-hidden rounded-lg border border-sky-200 bg-white shadow-sm">
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: POS_BLUE }}
                    >
                      <Target className="h-4 w-4" />
                      แยกตามประเภทการแทง
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                      {summary.byBetType.map((bt: { betType: string; received: string; payout: string }) => {
                        const btProfit = parseFloat(bt.received) - parseFloat(bt.payout)
                        return (
                          <div key={bt.betType} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-medium text-slate-600 mb-1.5">
                              {BET_TYPE_LABEL[bt.betType as BetType] ?? bt.betType}
                            </p>
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold tabular-nums text-slate-900">
                                รับ {formatCurrency(bt.received)}
                              </p>
                              <p className="text-xs text-red-500 tabular-nums">
                                จ่าย {formatCurrency(bt.payout)}
                              </p>
                              <p className={cn(
                                'text-xs font-semibold tabular-nums',
                                btProfit >= 0 ? 'text-green-600' : 'text-red-600',
                              )}>
                                {btProfit >= 0 ? '+' : ''}{formatCurrency(String(btProfit))}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {!selectedRoundId && !summaryLoading && (
              <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/40 py-16 text-center text-slate-500">
                <Target className="h-10 w-10 mx-auto mb-3 text-sky-300" />
                <p className="text-lg">เลือกงวดเพื่อดูรายงานรายได้</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
