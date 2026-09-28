import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ICMAI Student Registration Finder',
  description: 'Find ICMAI student registration numbers quickly and securely.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
