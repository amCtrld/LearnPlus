import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { WebVitalsReporter } from '@/components/web-vitals-reporter'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Research Calculus LMS',
  description: 'Interactive learning management system for calculus research study',
  openGraph: {
    title: 'LearnPlus — AI-Assisted Calculus Learning',
    description:
      'A research platform exploring how AI-assisted tutoring impacts calculus learning outcomes and engagement.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LearnPlus — AI-Assisted Calculus Learning',
    description:
      'A research platform exploring how AI-assisted tutoring impacts calculus learning outcomes and engagement.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <WebVitalsReporter />
        <Analytics />
      </body>
    </html>
  )
}
