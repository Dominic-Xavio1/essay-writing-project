import { Nunito, Bricolage_Grotesque, Caveat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// Initialize WebSocket server on server side
if (typeof window === 'undefined') {
  import('@/lib/ws-server').then(({ initWebSocketServer }) => {
    initWebSocketServer();
  }).catch(err => {
    console.error('Failed to initialize WebSocket server:', err);
  });
}

const bodyFont = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const headingFont = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-heading', display: 'swap' });
const handFont = Caveat({ subsets: ['latin'], variable: '--font-handwritten', display: 'swap' });

export const metadata = {
  title: 'ASYV Writing',
  description: 'ASYV Writing is the creative wall of Agahozo-Shalom Youth Village: where students pin their essays, stories and ideas.',
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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable} ${handFont.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
