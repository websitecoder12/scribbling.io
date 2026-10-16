// @ts-expect-error CSS imports are handled by the app bundler.
import '../components/globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'SCRIBBLING.IO',
  description: 'A multiplayer game lobby',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}