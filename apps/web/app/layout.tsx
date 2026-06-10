import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/app/providers'

export const metadata: Metadata = {
  title: 'ระบบหวย | Back Office',
  description: 'ระบบหลังบ้านจัดการหวยไทย-ลาว',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
