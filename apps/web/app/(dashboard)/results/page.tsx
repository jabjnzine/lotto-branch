'use client'

import { useState } from 'react'
import { useLotteryTypes } from '@/lib/hooks/useLotteryTypes'
import { useRounds } from '@/lib/hooks/useRounds'
import { useResult, useSaveResult } from '@/lib/hooks/useResults'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatThaiDate } from '@/lib/utils'
import { ResultStructure } from '@lotto/shared'

function ResultForm({
  roundId,
  resultStructure,
}: {
  roundId: string
  resultStructure: string
}) {
  const { data: result } = useResult(roundId)
  const saveResult = useSaveResult(roundId)

  const [firstPrize, setFirstPrize] = useState(result?.first_prize ?? '')
  const [threeTop, setThreeTop] = useState(result?.three_top ?? '')
  const [twoLast, setTwoLast] = useState(result?.two_last ?? '')

  const handleSave = () => {
    saveResult.mutate({
      first_prize: firstPrize || null,
      three_top: threeTop || null,
      two_last: twoLast || null,
      source: 'manual',
      is_official: false,
    })
  }

  const isThaiFull = resultStructure === ResultStructure.THAI_FULL
  const isLao5 = resultStructure === ResultStructure.LAO_5DIGIT
  const isLao32 = resultStructure === ResultStructure.LAO_3_2

  return (
    <div className="space-y-3">
      {(isThaiFull || isLao5) && (
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            รางวัลที่ 1 ({isThaiFull ? '6' : '5'} หลัก)
          </label>
          <input
            value={firstPrize}
            onChange={(e) => setFirstPrize(e.target.value.replace(/\D/g, '').slice(0, isThaiFull ? 6 : 5))}
            inputMode="numeric"
            placeholder={isThaiFull ? '------' : '-----'}
            className="w-full h-12 border-2 border-slate-200 rounded-lg px-4 text-2xl font-mono text-center tracking-[0.5em] focus:outline-none focus:border-blue-500"
          />
        </div>
      )}
      {isLao32 && (
        <div>
          <label className="text-xs text-slate-500 block mb-1">3 ตัวบน</label>
          <input
            value={threeTop}
            onChange={(e) => setThreeTop(e.target.value.replace(/\D/g, '').slice(0, 3))}
            inputMode="numeric"
            placeholder="---"
            className="w-full h-12 border-2 border-slate-200 rounded-lg px-4 text-2xl font-mono text-center tracking-[0.5em] focus:outline-none focus:border-blue-500"
          />
        </div>
      )}
      <div>
        <label className="text-xs text-slate-500 block mb-1">2 ตัวล่าง</label>
        <input
          value={twoLast}
          onChange={(e) => setTwoLast(e.target.value.replace(/\D/g, '').slice(0, 2))}
          inputMode="numeric"
          placeholder="--"
          className="w-full h-12 border-2 border-slate-200 rounded-lg px-4 text-2xl font-mono text-center tracking-[0.5em] focus:outline-none focus:border-blue-500"
        />
      </div>
      {result && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Badge variant={result.is_official ? 'success' : 'secondary'}>
            {result.is_official ? 'Official' : 'Manual'}
          </Badge>
          <span>บันทึกแล้ว</span>
        </div>
      )}
      <Button onClick={handleSave} disabled={saveResult.isPending} className="w-full">
        {saveResult.isPending ? 'กำลังบันทึก...' : 'บันทึกผล'}
      </Button>
    </div>
  )
}

export default function ResultsPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)

  const { data: lotteryTypes, isLoading } = useLotteryTypes()
  const { data: rounds } = useRounds(selectedTypeId ?? undefined)

  const selectedType = lotteryTypes?.find((lt) => lt.id === selectedTypeId)

  if (isLoading) return <LoadingSpinner className="mt-20" size="lg" />

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <PageHeader title="ผลหวย" />

      {/* Type Selector */}
      <div className="flex flex-wrap gap-2">
        {lotteryTypes?.map((lt) => (
          <button
            key={lt.id}
            onClick={() => {
              setSelectedTypeId(lt.id)
              setSelectedRoundId(null)
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
        <div className="grid md:grid-cols-2 gap-4">
          {/* Round List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">เลือกงวด</CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {rounds?.map((round) => (
                <button
                  key={round.id}
                  onClick={() => setSelectedRoundId(round.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    selectedRoundId === round.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-sm font-medium">{formatThaiDate(round.draw_date)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{round.status}</p>
                </button>
              ))}
              {(!rounds || rounds.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-6">ไม่มีงวด</p>
              )}
            </CardContent>
          </Card>

          {/* Result Form */}
          {selectedRoundId && selectedType && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">บันทึกผล</CardTitle>
              </CardHeader>
              <CardContent>
                <ResultForm
                  roundId={selectedRoundId}
                  resultStructure={selectedType.result_structure}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
