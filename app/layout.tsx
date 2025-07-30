import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QA Test Management',
  description: 'Comprehensive QA Test Management System for organizing, tracking, and managing test cases and test suites',
  generator: 'QA Test Management',
  icons: {
    icon: [
      {
        url: '/favicon.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
    ],
    apple: '/favicon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
