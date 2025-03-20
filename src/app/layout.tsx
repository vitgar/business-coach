import { Inter } from "next/font/google"
import "./globals.css"
import ToastProvider from "@/components/ToastProvider"
import { AuthProvider } from "@/contexts/AuthContext"
import type { Metadata } from "next"
import AuthSessionProvider from "@/components/AuthSessionProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Business Coach - Your Step-by-Step Guide to Business Success",
  description: "Get expert guidance on starting, running, and growing your business with our comprehensive business coaching platform.",
  keywords: [
    "business coaching",
    "business plan",
    "entrepreneurship",
    "startup guide",
    "business strategy",
    "business growth"
  ],
  authors: [{ name: "Business Coach Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          <AuthProvider>
            <main className="min-h-screen">
              {children}
            </main>
            <ToastProvider />
          </AuthProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
} 