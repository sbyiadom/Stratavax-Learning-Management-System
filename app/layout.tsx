import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SupabaseProvider from './providers'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StrataVax - Learning Management System',
  description: 'Enterprise-grade learning management platform',
  keywords: 'LMS, learning management, courses, education',
  authors: [{ name: 'StrataVax' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <SupabaseProvider>
          <main className="min-h-full">
            {children}
          </main>
          <Analytics />
        </SupabaseProvider>
      </body>
    </html>
  )
}
