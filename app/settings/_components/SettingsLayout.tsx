"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAuth } from '../../lib/auth'
import HydrationSafe from '../../components/HydrationSafe'
// import SideNav from './SideNav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { state } = useAuth()
  const { resolvedTheme } = useTheme()
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')
  const itemClass = (href: string) => isActive(href)
    ? 'text-purple-700 font-medium'
    : 'text-gray-700 hover:text-purple-700'

  return (
    <HydrationSafe fallback={<div className="min-h-screen bg-secondary-50"><div className="max-w-7xl mx-auto p-6"><div className="flex flex-col md:flex-row lg:flex-row gap-6"><main className="flex-1 space-y-8">{children}</main></div></div></div>}>
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-secondary-50'}`}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col md:flex-row lg:flex-row gap-6">
            {/* <SideNav /> */}
            <main className="flex-1 space-y-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </HydrationSafe>
  )
}




