"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../lib/auth'
// import SideNav from './SideNav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { state } = useAuth()
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')
  const itemClass = (href: string) => isActive(href)
    ? 'text-purple-700 font-medium'
    : 'text-gray-700 hover:text-purple-700'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="flex flex-col md:flex-row lg:flex-row gap-4">
          {/* <SideNav /> */}
          <main className="flex-1 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}




