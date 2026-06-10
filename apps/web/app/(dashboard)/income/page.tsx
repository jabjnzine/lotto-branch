'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useRounds } from '@/lib/hooks/useRounds'
import { useIncomeSummary, useIncomePerHouse } from '@/lib/hooks/useIncome'
import { PageHeader } from '@/components/shared/PageHeader'
import { LotteryTypeSelector } from '@/components/lottery/LotteryTypeSelector'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn, formatCurrency, formatThaiDate } from '@/lib/utils'
import { BET_TYPE_LABEL, BetType } from '@lotto/shared'
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Home, Users } from 'lucide-react'

const POS_BLUE = '#ff9824'

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
  const { data: perHouse } = useIncomePerHouse(selectedRoundId)

  useEffect(() => {
    if (!selectedTypeId && lotteryTypes && lotteryTypes.length > 0) {
      setSelectedTypeId(lotteryTypes[0].id)
    }
  }, [selectedTypeId, lotteryTypes])

  const sortedRounds = useMemo(() => {
    if (!rounds) return []
    return [...rounds].sort((a, b) => {
      return new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime()
    })
  }, [rounds])

  const profit = summary ? parseFloat(summary.profit) : 0

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-6">
      <PageHeader title="รายได้" description="สรุปกำไร-ขาดทุนแยกตามงวด" />

      {lotteryTypes && lotteryTypes.length > 0 && (
        <LotteryTypeSelector
          lotteryTypes={lotteryTypes}
          selectedTypeId={selectedTypeId}
          onSelect={(id) => {
            setSelectedTypeId(id)
            setSelectedRoundId(null)
          }}
        />
      )}

      {!selectedTypeId && (
        <div className="rounded-xl border border-dashed border-border bg-primary/5 py-16 text-center text-muted-foreground">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-primary/50" />
          <p className="text-lg">เลือกประเภทหวยเพื่อดูรายได้</p>
        </div>
      )}

      {selectedTypeId && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
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
                        'w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-accent',
                        selectedRoundId === round.id && 'bg-primary/10 border-l-2 border-l-[#ff9824]',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{formatThaiDate(round.draw_date)}</span>
                        <Badge variant={rStatus.variant} className="text-[10px] px-1.5 py-0">
                          {rStatus.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{round.lottery_type?.name}</p>
                    </button>
                  )
                })}
                {(!rounds || rounds.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-8">ไม่มีงวดที่ออกผลแล้ว</p>
                )}
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-9 space-y-4">
            {summaryLoading && <LoadingSpinner className="py-12" />}

            {summary && !summaryLoading && (
              <>
                {/* Commission summary */}
                {(parseFloat(summary.totalHouseCommission ?? '0') > 0 ||
                  parseFloat(summary.totalAgentCommission ?? '0') > 0) && (
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      สรุปค่าคอม
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm tabular-nums">
                      <span className="text-muted-foreground">จ่ายให้บ้าน <span className="font-semibold text-foreground">{formatCurrency(summary.totalHouseCommission ?? '0')}</span></span>
                      <span className="text-muted-foreground">รายได้เจ้า <span className="font-semibold text-primary">{formatCurrency(summary.totalAgentCommission ?? '0')}</span></span>
                    </div>
                  </div>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ยอดรับรวม</p>
                        <p className="text-xl font-bold tabular-nums text-foreground">
                          {formatCurrency(summary.totalReceived)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ยอดจ่ายรวม</p>
                        <p className="text-xl font-bold tabular-nums text-foreground">
                          {formatCurrency(summary.totalPayout)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
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
                        <p className="text-xs text-muted-foreground">กำไร/ขาดทุน</p>
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
                  <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: POS_BLUE }}
                    >
                      <BarChart3 className="h-4 w-4" />
                      แยกตามประเภทหวย
                    </div>
                    <div className="divide-y divide-border overflow-x-auto">
                      {summary.byLotteryType.map((lt) => {
                        const ltProfit = parseFloat(lt.profit)
                        return (
                          <div key={lt.code} className="flex items-center justify-between px-4 py-3 min-w-[320px]">
                            <span className="text-sm font-medium text-foreground">{lt.name}</span>
                            <div className="flex items-center gap-2 sm:gap-4 text-sm tabular-nums">
                              <span className="text-muted-foreground">รับ {formatCurrency(lt.received)}</span>
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
                  <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
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
                          <div key={bt.betType} className="rounded-lg border border-border bg-muted p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">
                              {BET_TYPE_LABEL[bt.betType as BetType] ?? bt.betType}
                            </p>
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold tabular-nums text-foreground">
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

                {/* Per-house breakdown */}
                {perHouse && perHouse.length > 0 && (
                  <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: POS_BLUE }}
                    >
                      <Home className="h-4 w-4" />
                      แยกตามบ้าน
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted-foreground">
                            <th className="px-4 py-2 text-left">บ้าน</th>
                            <th className="px-4 py-2 text-right">ยอดรับ</th>
                            <th className="px-4 py-2 text-right">จ่ายให้บ้าน</th>
                            <th className="px-4 py-2 text-right">รายได้เจ้า</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {perHouse.map((h) => (
                            <tr key={h.houseId ?? 'none'} className="hover:bg-muted/50">
                              <td className="px-4 py-2.5 font-medium text-foreground">{h.houseName}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums text-foreground">{formatCurrency(h.received)}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatCurrency(h.houseCommission)}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-primary">{formatCurrency(h.agentCommission)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {!selectedRoundId && !summaryLoading && (
              <div className="rounded-xl border border-dashed border-border bg-primary/5 py-16 text-center text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-3 text-primary/50" />
                <p className="text-lg">เลือกงวดเพื่อดูรายงานรายได้</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
