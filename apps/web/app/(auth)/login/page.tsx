'use client'

import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Clover, LogIn } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useLogin } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormInput } from '@/components/form/FormInput'

const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const loginMutation = useLogin()

  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = methods

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { accessToken, profile } = await loginMutation.mutateAsync(values)
      setAuth(accessToken, profile)
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'เกิดข้อผิดพลาด กรุณาลองใหม่'
      setError('root', { message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-sky-100/40 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-50/50 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <Card className="w-full max-w-md shadow-xl shadow-sky-200/50 ring-1 ring-sky-100/50 animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="text-center pb-0 pt-8 px-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-sky-50 ring-1 ring-sky-100">
            <Clover className="h-7 w-7 text-sky-600" strokeWidth={1.5} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">ระบบหวย</CardTitle>
          <p className="text-sm text-sky-400 font-medium">Back Office</p>
        </CardHeader>

        <div className="mx-8 mt-5 border-b border-sky-100" />

        <CardContent className="px-8 pb-8 pt-5">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormInput
                name="email"
                label="อีเมล"
                type="email"
                placeholder="admin@example.com"
              />
              <FormInput
                name="password"
                label="รหัสผ่าน"
                type="password"
                placeholder="••••••••"
              />

              {methods.formState.errors.root && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg animate-shake">
                  {methods.formState.errors.root.message}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  'กำลังเข้าสู่ระบบ...'
                ) : (
                  <>
                    เข้าสู่ระบบ
                    <LogIn className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  )
}
