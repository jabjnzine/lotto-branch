'use client'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Home } from 'lucide-react'

export default function HousesPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="บ้าน" description="จัดการบ้าน/Agent" />
      <Card>
        <CardContent className="py-16 text-center">
          <Home className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">ระบบบ้านจะเปิดใช้งานในอนาคต</p>
        </CardContent>
      </Card>
    </div>
  )
}
