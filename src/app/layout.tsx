import type { Metadata } from 'next'
import { Fraunces, Source_Sans_3 } from 'next/font/google'
import './globals.css'

const display = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
})

const sans = Source_Sans_3({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Chess Shuffle',
  description: 'Chess960 online — shuffled back ranks, 3D board, play with a friend.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden bg-[#1a1510] font-sans text-[#f3efe6]">
        {children}
      </body>
    </html>
  )
}
