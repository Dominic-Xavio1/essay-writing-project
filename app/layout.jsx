import { Inter, Fraunces, Newsreader } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

// Initialize WebSocket server on server side
if (typeof window === 'undefined') {
  import('@/lib/ws-server').then(({ initWebSocketServer }) => {
    initWebSocketServer();
  }).catch(err => {
    console.error('Failed to initialize WebSocket server:', err);
  });
}

/* Three families, latin only, swapped in — an expressive serif for headlines,
   a screen-reading serif for essays, and a quiet sans for the interface. */
const uiFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
});

const displayFont = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const readingFont = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-reading',
  display: 'swap',
});

export const metadata = {
  title: 'ASYV Writers',
  description:
    'A quiet creative world where young minds find their voice — stories, essays, articles and research by the students of Agahozo-Shalom Youth Village.',
  generator: 'Dominique Savio',
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
      className={`${uiFont.variable} ${displayFont.variable} ${readingFont.variable}`}
    >
      <body className="font-sans antialiased">
        <a
          href="#main"
          className="sr-only-focusable absolute left-4 top-4 z-[100] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
