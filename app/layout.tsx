import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ASYV Writing',
  description: 'ASYV Writing is a platform for sharing thoughtful essays and engaging with writers from around the world.',
  generator:'Dominique Savio',
  icons: {
    icon: [
      {
        url: '/agahozo.png',
        media: '(prefers-color-scheme: light)',
        sizes: '32x32',
      },
      {
        url: '/agahozo.png',
        media: '(prefers-color-scheme: dark)',
        sizes: '32x32',
      },
      {
        url: '/agahozo.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/agahozo.png',
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
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
