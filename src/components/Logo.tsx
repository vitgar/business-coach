'use client'

import Link from 'next/link'
import { BrainCog } from 'lucide-react'

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
      <BrainCog className="h-8 w-8" />
      <span className="font-bold text-xl">Business Coach</span>
    </Link>
  )
} 