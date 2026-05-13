'use client'

import { useState } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useRounds } from '@/lib/hooks/useRounds'
import { useIncomeSummary } from '@/lib/hooks/useIncome'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatCurrency, formatThaiDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default function IncomePage() {
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)

  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: rounds } = useRounds(selectedTypeId ?? undefined, 'resulted')
  const { data: summary, isLoading: summaryLoading } = useIncomeSummary(selectedRoundId)

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const profit = summary ? parseFloat(summary.profit) : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="รายได้" description="สรุปรายได้แยกตามงวด" />

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            {lotteryTypes?.map((lt) => (
              <button
                key={lt.id}
                onClick={() => {
                  setSelectedTypeId(lt.id)
                  setSelectedRoundId(null)
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  selectedTypeId === lt.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {lt.name}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500">งวดที่ออกผลแล้ว</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {rounds?.map((round) => (
                <button
                  key={round.id}
                  onClick={() => setSelectedRoundId(round.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-50 text-sm hover:bg-slate-50 ${
                    selectedRoundId === round.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                  }`}
                >
                  {formatThaiDate(round.draw_date)}
                </button>
              ))}
              {(!rounds || rounds.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">ไม่มีงวด</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="flex-1 space-y-4">
          {summaryLoading && <LoadingSpinner />}
          {summary && !summaryLoading && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">ยอดรับรวม</p>
                      <p className="text-xl font-bold text-slate-900">
                        {formatCurrency(summary.totalReceived)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">ยอดจ่ายรวม</p>
                      <p className="text-xl font-bold text-slate-900">
                        {formatCurrency(summary.totalPayout)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                      <TrendingUp className={`h-5 w-5 ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">กำไร/ขาดทุน</p>
                      <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {profit >= 0 ? '+' : ''}{formatCurrency(summary.profit)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* By Lottery Type */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">แยกตามประเภทหวย</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {summary.byLotteryType.map((lt) => (
                      <div key={lt.code} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <span className="text-sm font-medium text-slate-700">{lt.name}</span>
                        <div className="flex gap-6 text-sm">
                          <span className="text-slate-500">รับ {formatCurrency(lt.received)}</span>
                          <span className="text-red-500">จ่าย {formatCurrency(lt.payout)}</span>
                          <span className={parseFloat(lt.profit) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {parseFloat(lt.profit) >= 0 ? '+' : ''}{formatCurrency(lt.profit)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* By Bet Type */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">แยกตามประเภทการแทง</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {summary.byBetType.map((bt) => (
                      <div key={bt.betType} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-slate-600 mb-1">{bt.betType}</p>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(bt.received)}</p>
                        <p className="text-xs text-red-400">จ่าย {formatCurrency(bt.payout)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {!selectedRoundId && !summaryLoading && (
            <div className="flex items-center justify-center h-48 text-slate-400">
              เลือกงวดเพื่อดูรายงานรายได้
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
