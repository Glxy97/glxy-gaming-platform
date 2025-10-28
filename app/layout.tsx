
import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { redis } from '@/lib/redis-server'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/components/providers/auth-provider'
import { SocketProvider } from '@/components/providers/socket-provider'
import { BackgroundShell } from '@/components/providers/background-shell'
import SiteHeader from '@/components/layout/SiteHeader'
import { ConsoleSecurityWarning } from '@/components/security/console-warning'
import { BackgroundToggleButton } from '@/components/ui/background-toggle'
import { getSettings } from '@/lib/config'
import { getCSPNonce } from '@/lib/security-headers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'GLXY.AT - Ultimate Gaming Platform',
  description: 'Join the ultimate online gaming platform. Play chess, compete in tournaments, chat with friends, and climb the leaderboards!',
  keywords: 'gaming, online games, chess, multiplayer, tournaments, leaderboards',
  authors: [{ name: 'GLXY Team' }],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'GLXY.AT - Ultimate Gaming Platform',
    description: 'Join the ultimate online gaming platform. Play chess, compete in tournaments, chat with friends, and climb the leaderboards!',
    type: 'website',
    url: 'https://glxy.at',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GLXY.AT - Ultimate Gaming Platform',
    description: 'Join the ultimate online gaming platform. Play chess, compete in tournaments, chat with friends, and climb the leaderboards!',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get CSP nonce from headers - properly await in Next.js 15
  const headersList = await headers()
  const nonce = getCSPNonce(headersList)

  // Remove dynamic Redis theme loading to fix hydration mismatch
  // Theme will be loaded client-side via ThemeProvider for better performance
  const settings = getSettings();

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Meta tags for security */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className={`theme-glxy ${inter.variable} ${orbitron.variable} ${inter.className} min-h-screen bg-background text-foreground antialiased`} suppressHydrationWarning>
        <ConsoleSecurityWarning />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <SocketProvider>
              <BackgroundShell>
                <SiteHeader />
                <div className="gaming-grid min-h-screen pt-14 relative z-0">
                  {children}
                </div>
                <Toaster />
              </BackgroundShell>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
