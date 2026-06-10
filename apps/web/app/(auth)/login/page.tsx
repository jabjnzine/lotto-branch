'use client'

import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppLogo } from '@/components/shared/AppLogo'
import { useAuthStore } from '@/lib/stores/useAuthStore'
import { useLogin } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
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
      const { accessToken, refreshToken, profile } = await loginMutation.mutateAsync(values)
      setAuth(accessToken, refreshToken, profile)
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'เกิดข้อผิดพลาด กรุณาลองใหม่'
      setError('root', { message })
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-10 flex justify-center">
          <AppLogo size="lg" showText={false} />
        </div>

        <h1 className="mb-8 text-center text-3xl font-bold text-foreground">เข้าสู่ระบบ</h1>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/25 px-4 py-3 rounded-2xl animate-shake font-medium">
                {methods.formState.errors.root.message}
              </p>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
