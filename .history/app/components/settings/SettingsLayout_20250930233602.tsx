"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')
  const itemClass = (href: string) => isActive(href)
    ? 'text-purple-700 font-medium'
    : 'text-gray-700 hover:text-purple-700'

  return (
    <div className="p-4">
      <div className="flex  flex-col md:flex-row lg:flex-row gap-4">
        <aside className="w-64 bg-white border rounded p-4 h-fit">
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 mb-2">ACCOUNT SETTINGS</div>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-700">Account Info</span></li>
              <li><span className="text-sm text-gray-700">Change Password</span></li>
              <li><span className="text-sm text-gray-700">Users</span></li>
              <li><span className="text-sm text-gray-700">API</span></li>
            </ul>
          </div>

          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 mb-2">BILLING SETTINGS</div>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-700">Payment Info</span></li>
              <li><span className="text-sm text-gray-700">Your Subscription</span></li>
              <li><span className="text-sm text-gray-700">Postage Wallet</span></li>
            </ul>
          </div>

          <div className="mb-2">
            <div className="text-xs font-semibold text-gray-500 mb-2">APPLICATION SETTINGS</div>
            <ul className="space-y-2">
              <li><Link href={'/settings/channels'} className={`text-sm ${itemClass('/settings/channels')}`}>Sales Channel Integrations</Link></li>
              <li><Link href='/appstore' className="text-sm text-gray-700">App Store</Link></li>
              <li><span className="text-sm text-gray-700">Shipping Carriers</span></li>
              <li><span className="text-sm text-gray-700">Warehouse Locations</span></li>
              <li><span className="text-sm text-gray-700">Listing Presets</span></li>
              <li><span className="text-sm text-gray-700">Export Data</span></li>
              <li><span className="text-sm text-gray-700">Import Data</span></li>
              <li><span className="text-sm text-gray-700">Product Categories</span></li>
              <li><span className="text-sm text-gray-700">Custom Product Attributes</span></li>
              <li><span className="text-sm text-gray-700">Listing Templates & Recipes</span></li>
            </ul>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}


