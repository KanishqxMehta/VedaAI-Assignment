import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import './globals.css'
import AppLayout from '@/components/AppLayout'
import { SettingsProvider } from '@/context/SettingsContext'
import { AuthProvider } from '@/context/AuthContext'

const bricolage = Bricolage_Grotesque({ 
  subsets: ['latin'],
  variable: '--font-bricolage'
})

export const metadata: Metadata = {
  title: 'VedaAI Assessment Creator',
  description: 'AI Assessment Creator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body className={bricolage.className}>
        <AuthProvider>
          <SettingsProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
