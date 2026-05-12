'use client'

import { useState } from 'react'
import { useLotteryTypes, usePrizeRates } from '@/lib/hooks/useLotteryTypes'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { BET_TYPE_LABEL, LOTTERY_TYPE_BET_TYPES, BetType } from '@lotto/shared'
import api from '@/lib/api'

export default function SettingsPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: prizeRates } = usePrizeRates(selectedTypeId)

  const handleRateChange = async (rateId: string, value: string) => {
    if (!value || isNaN(parseFloat(value))) return
    await api.patch(`/prize-rates/${rateId}`, { payout_rate: parseFloat(value) })
  }

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const selectedType = lotteryTypes?.find((lt) => lt.id === selectedTypeId)
  const allowedBetTypes = selectedType ? LOTTERY_TYPE_BET_TYPES[selectedType.code] ?? [] : []

  return (
    <div className="space-y-4 max-w-2xl">
      <PageHeader title="ตั้งค่า" description="อัตราจ่ายและการตั้งค่าต่างๆ" />

      {/* Lottery Type Tabs */}
      <div className="flex gap-2 flex-wrap">
        {lotteryTypes?.map((lt) => (
          <button
            key={lt.id}
            onClick={() => setSelectedTypeId(lt.id)}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">อัตราจ่าย — {selectedType?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {allowedBetTypes.map((betType) => {
                const rate = prizeRates?.find(
                  (pr: { bet_type: string }) => pr.bet_type === betType,
                )
                return (
                  <div key={betType} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">
                      {BET_TYPE_LABEL[betType]}
                    </span>
                    {rate ? (
                      <input
                        defaultValue={rate.payout_rate}
                        onBlur={(e) => handleRateChange(rate.id, e.target.value)}
                        className="w-24 h-8 border border-slate-200 rounded px-2 text-sm text-right font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">ไม่มีข้อมูล</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedTypeId && (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            เลือกประเภทหวยเพื่อดูอัตราจ่าย
          </CardContent>
        </Card>
      )}
    </div>
  )
}
