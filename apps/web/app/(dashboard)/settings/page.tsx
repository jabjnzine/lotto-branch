'use client'

import { useState, useEffect } from 'react'
import { useLotteryTypes, usePrizeRates, useUpdateLotteryType, useUpdatePrizeRate } from '@/lib/hooks/useLotteryTypes'
import { useGenerateRounds } from '@/lib/hooks/useRounds'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { BET_TYPE_LABEL, LOTTERY_TYPE_BET_TYPES, BetType } from '@lotto/shared'
import { Clock, Timer, Power, RefreshCw, Settings } from 'lucide-react'

export default function SettingsPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(true)
  const { data: lotteryTypes, isLoading } = useLotteryTypes(true)
  const { data: prizeRates } = usePrizeRates(selectedTypeId)
  const updateLotteryType = useUpdateLotteryType()
  const updatePrizeRate = useUpdatePrizeRate()
  const generateRounds = useGenerateRounds()

  useEffect(() => {
    if (!selectedTypeId && lotteryTypes && lotteryTypes.length > 0) {
      setSelectedTypeId(lotteryTypes[0].id)
    }
  }, [selectedTypeId, lotteryTypes])

  const selectedType = lotteryTypes?.find((lt) => lt.id === selectedTypeId)

  useEffect(() => {
    if (selectedType) setIsActive(selectedType.is_active)
  }, [selectedType?.id])

  const handleSettingChange = (field: string, value: unknown) => {
    if (!selectedTypeId) return
    updateLotteryType.mutate({ id: selectedTypeId, [field]: value })
  }

  const handleToggleActive = () => {
    const newVal = !isActive
    setIsActive(newVal)
    handleSettingChange('is_active', newVal)
  }

  const handleRateChange = (id: string, value: string) => {
    const num = parseFloat(value)
    if (!value || isNaN(num)) return
    updatePrizeRate.mutate({ id, payout_rate: num })
  }

  const handleMaxPerNumberChange = (id: string, value: string) => {
    updatePrizeRate.mutate({ id, max_per_number: value ? parseFloat(value) : null })
  }

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  const allowedBetTypes = selectedType ? LOTTERY_TYPE_BET_TYPES[selectedType.code] ?? [] : []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="ตั้งค่า" description="อัตราจ่ายและการตั้งค่าต่างๆ">
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateRounds.mutate()}
          disabled={generateRounds.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${generateRounds.isPending ? 'animate-spin' : ''}`} />
          สร้างงวด
        </Button>
      </PageHeader>

      {/* Lottery Type Tabs */}
      <div className="flex gap-2 flex-wrap">
        {lotteryTypes?.map((lt) => (
          <button
            key={lt.id}
            onClick={() => setSelectedTypeId(lt.id)}
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
        <div key={selectedTypeId} className="space-y-6">
          {/* Lottery Type Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">การตั้งค่า — {selectedType?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400" />
                    เวลาออกผล
                  </div>
                  <input
                    type="time"
                    defaultValue={selectedType?.draw_time}
                    onBlur={(e) => handleSettingChange('draw_time', e.target.value)}
                    className="h-9 border border-sky-200 rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Timer className="h-4 w-4 text-slate-400" />
                    ปิดรับก่อนออกผล
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      defaultValue={selectedType?.close_before_minutes}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val) && val > 0) handleSettingChange('close_before_minutes', val)
                      }}
                      className="w-20 h-9 border border-sky-200 rounded-md px-2 text-sm text-right font-mono bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-400">นาที</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Power className="h-4 w-4 text-slate-400" />
                    สถานะ
                  </div>
                  <Button
                    variant={isActive ? 'success' : 'secondary'}
                    size="sm"
                    onClick={handleToggleActive}
                    className="min-w-[72px]"
                  >
                    {isActive ? 'เปิด' : 'ปิด'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prize Rates */}
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
                    <div key={betType} className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">
                        {BET_TYPE_LABEL[betType]}
                      </span>
                      {rate ? (
                        <div className="flex items-center gap-2">
                          <input
                            defaultValue={rate.max_per_number ?? ''}
                            onBlur={(e) => handleMaxPerNumberChange(rate.id, e.target.value)}
                            placeholder="วงเงิน"
                            className="w-24 h-8 border border-sky-200 rounded px-2 text-xs text-right font-mono bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                          <input
                            defaultValue={rate.payout_rate}
                            onBlur={(e) => handleRateChange(rate.id, e.target.value)}
                            placeholder="อัตราจ่าย"
                            className="w-20 h-8 border border-sky-200 rounded px-2 text-sm text-right font-mono bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">ไม่มีข้อมูล</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedTypeId && (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            <Settings className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            เลือกประเภทหวยเพื่อดูการตั้งค่า
          </CardContent>
        </Card>
      )}
    </div>
  )
}
