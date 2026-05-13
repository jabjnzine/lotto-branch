'use client'

import React, { useState, useMemo } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useRounds, type LotteryRound } from '@/lib/hooks/useRounds'
import { useBets } from '@/lib/hooks/useBets'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatThaiDate, formatCurrency, formatTime } from '@/lib/utils'
import { BET_TYPE_LABEL, BetType } from '@lotto/shared'
import { Download, ChevronDown, ChevronRight, User, FileText } from 'lucide-react'

const roundStatusBadge: Record<string, { label: string; variant: 'success' | 'destructive' | 'warning' | 'default' }> = {
  open: { label: 'เปิด', variant: 'success' },
  closed: { label: 'ปิด', variant: 'warning' },
  resulted: { label: 'ออกผล', variant: 'default' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
}

const statusLabel: Record<string, { label: string; variant: 'success' | 'destructive' | 'warning' | 'default' }> = {
  pending: { label: 'รอผล', variant: 'warning' },
  won: { label: 'ถูก', variant: 'success' },
  lost: { label: 'ไม่ถูก', variant: 'default' },
  cancelled: { label: 'ยกเลิก', variant: 'destructive' },
}

export default function ReportsPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null)

  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: rounds } = useRounds(selectedTypeId ?? undefined)
  const { data: betsData, isLoading: betsLoading } = useBets(selectedRoundId, page, 20)

  const selectedRound = rounds?.find((r) => r.id === selectedRoundId)

  const sortedRounds = useMemo(() => {
    if (!rounds) return []
    const statusOrder: Record<string, number> = { open: 0, closed: 1, resulted: 2, cancelled: 3 }
    return [...rounds].sort((a, b) => {
      const s = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
      if (s !== 0) return s
      // OPEN: เรียงน้อยไปมาก (วันนี้ก่อน, งวดถัดไปตามหลัง)
      // อื่นๆ: เรียงมากไปน้อย (ล่าสุดก่อน)
      if (a.status === 'open') {
        return new Date(a.draw_date).getTime() - new Date(b.draw_date).getTime()
      }
      return new Date(b.draw_date).getTime() - new Date(a.draw_date).getTime()
    })
  }, [rounds])

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const totalAmount = betsData?.items?.reduce(
    (sum: number, bet: { total_amount: string }) => sum + Number(bet.total_amount),
    0,
  ) ?? 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="รายงาน">
        {selectedRoundId && (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
        )}
      </PageHeader>

      {/* Type Selector */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-sky-200 bg-white p-3 shadow-sm">
        {lotteryTypes?.map((lt) => (
          <button
            key={lt.id}
            onClick={() => {
              setSelectedTypeId(lt.id)
              setSelectedRoundId(null)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedTypeId === lt.id
                ? 'bg-sky-600 text-white'
                : 'bg-white border border-sky-200 text-slate-700 hover:bg-sky-50'
            }`}
          >
            {lt.name}
          </button>
        ))}
      </div>

      {selectedTypeId && (
        <div className="grid md:grid-cols-4 gap-4">
          {/* Round List */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500">เลือกงวด</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {sortedRounds.map((round) => {
                const rStatus = roundStatusBadge[round.status] ?? { label: round.status, variant: 'default' as const }
                return (
                  <button
                    key={round.id}
                    onClick={() => {
                      setSelectedRoundId(round.id)
                      setPage(1)
                      setExpandedBetId(null)
                    }}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-50 text-sm hover:bg-slate-50 transition-colors ${
                      selectedRoundId === round.id
                        ? 'bg-sky-50 text-sky-700 font-medium border-l-2 border-l-sky-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{formatThaiDate(round.draw_date)}</span>
                      <Badge variant={rStatus.variant} className="text-[10px] px-1.5 py-0">
                        {rStatus.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{round.lottery_type?.name}</div>
                  </button>
                )
              })}
              {(!rounds || rounds.length === 0) && (
                <p className="text-center text-xs text-slate-400 py-8">ไม่มีงวด</p>
              )}
            </CardContent>
          </Card>

          {/* Bets Table */}
          <div className="md:col-span-3">
            {!selectedRoundId && !betsLoading && (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
                เลือกงวดเพื่อดูรายงาน
              </div>
            )}

            {betsLoading && <LoadingSpinner className="py-12" />}

            {betsData && !betsLoading && (
              <>
                {/* Round Summary */}
                {selectedRound && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-400">งวด</p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        {formatThaiDate(selectedRound.draw_date)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedRound.lottery_type?.name}</p>
                    </div>
                    <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-400">จำนวนบิล</p>
                      <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                        {betsData.total.toLocaleString()} <span className="text-sm font-normal text-slate-500">รายการ</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-400">ยอดรับรวม</p>
                      <p className="text-xl font-bold text-sky-600 tabular-nums mt-0.5">
                        {formatCurrency(totalAmount)} <span className="text-sm font-normal text-slate-500">บาท</span>
                      </p>
                    </div>
                  </div>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        รายการบิล ({betsData.total} รายการ)
                      </CardTitle>
                      <span className="text-xs text-slate-400">
                        หน้า {page} / {betsData.totalPages}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-sky-200 bg-sky-50">
                            <th className="w-8 px-3 py-2.5" />
                            <th className="text-left px-3 py-2.5 text-xs text-slate-500 font-medium">เวลา</th>
                            <th className="text-left px-3 py-2.5 text-xs text-slate-500 font-medium">คนซื้อ</th>
                            <th className="text-center px-3 py-2.5 text-xs text-slate-500 font-medium">รายการ</th>
                            <th className="text-right px-3 py-2.5 text-xs text-slate-500 font-medium">ยอด</th>
                            <th className="text-center px-3 py-2.5 text-xs text-slate-500 font-medium">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {betsData.items.map((bet: {
                            id: string
                            created_at: string
                            buyer_name?: string | null
                            note?: string | null
                            total_amount: string
                            status: string
                            items?: Array<{
                              id: string
                              number: string
                              bet_type: string
                              amount: string
                            }>
                          }) => {
                            const isExpanded = expandedBetId === bet.id
                            const status = statusLabel[bet.status] ?? { label: bet.status, variant: 'default' as const }
                            const itemCount = bet.items?.length ?? 0
                            return (
                              <React.Fragment key={bet.id}>
                                <tr
                                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                                  onClick={() => setExpandedBetId(isExpanded ? null : bet.id)}
                                >
                                  <td className="px-3 py-2.5 text-slate-400">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-slate-500">
                                    {formatTime(bet.created_at)}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <User className="h-3.5 w-3.5 text-slate-300" />
                                      <span className="text-slate-700">
                                        {bet.buyer_name ?? '—'}
                                      </span>
                                    </div>
                                    {bet.note && (
                                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {bet.note}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className="text-xs text-slate-500">{itemCount} รายการ</span>
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                                    {formatCurrency(bet.total_amount)}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <Badge variant={status.variant} className="text-xs">
                                      {status.label}
                                    </Badge>
                                  </td>
                                </tr>

                                {/* Expanded Items */}
                                {isExpanded && bet.items && bet.items.length > 0 && (
                                  <tr key={`${bet.id}-items`}>
                                    <td colSpan={6} className="px-0 py-0 bg-slate-50/60">
                                      <div className="px-8 py-3 border-b border-slate-100">
                                        <table className="w-full text-sm">
                                          <thead>
                                            <tr className="text-xs text-slate-400">
                                              <th className="text-left py-1 font-normal">#</th>
                                              <th className="text-left py-1 font-normal">เลข</th>
                                              <th className="text-left py-1 font-normal">ประเภท</th>
                                              <th className="text-right py-1 font-normal">ยอด</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {bet.items.map((item, idx) => (
                                              <tr key={item.id}>
                                                <td className="py-1.5 text-xs text-slate-400">{idx + 1}</td>
                                                <td className="py-1.5 font-mono font-semibold text-slate-800">
                                                  {item.number}
                                                </td>
                                                <td className="py-1.5">
                                                  <Badge variant="secondary" className="text-xs font-normal">
                                                    {BET_TYPE_LABEL[item.bet_type as BetType] ?? item.bet_type}
                                                  </Badge>
                                                </td>
                                                <td className="py-1.5 text-right font-medium tabular-nums">
                                                  {formatCurrency(item.amount)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {betsData.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 p-3 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          ก่อนหน้า
                        </Button>
                        <span className="text-sm text-slate-600">
                          {page} / {betsData.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === betsData.totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          ถัดไป
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
