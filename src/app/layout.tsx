import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Medical Scribe - Ambient Medical Documentation',
  description: 'AI-powered ambient scribe for automated medical documentation using real-time transcription and SOAP note generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <main className="min-h-full">
          {children}
        </main>
      </body>
    </html>
  )
}