"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

export type ChannelOption = {
  label: string
  value: string
}

export default function ChannelConnectForm({
  channelName,
  regions,
  showFbaToggle = false,
}: {
  channelName: string
  regions: ChannelOption[]
  showFbaToggle?: boolean
}) {
  const router = useRouter()
  const [nickname, setNickname] = React.useState('')
  const [region, setRegion] = React.useState(regions[0]?.value || '')
  const [fba, setFba] = React.useState(false)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Connect a New Sales Channel</h2>

      <div className="text-gray-800 font-medium">Connecting your {channelName} account is easy!</div>
      <div className="text-sm text-gray-600">You may need a seller account on {channelName} to list and sell. Learn more</div>

      <div className="max-w-2xl space-y-3">
        <div>
          <div className="text-sm text-gray-700 mb-1">Channel Nickname<span className="text-red-500">*</span></div>
          <input value={nickname} onChange={(e)=>setNickname(e.target.value)} placeholder="Give your account a nickname" className="w-full border rounded px-3 py-2 text-sm" />
        </div>

        <div>
          <select className="border rounded px-3 py-2 text-sm" value={region} onChange={(e)=>setRegion(e.target.value)}>
            {regions.map(r => (<option key={r.value} value={r.value}>{r.label}</option>))}
          </select>
        </div>

        {showFbaToggle && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={fba} onChange={(e)=>setFba(e.target.checked)} />
            <span>Enable Fulfillment by Amazon (FBA)</span>
          </label>
        )}

        <div className="pt-2 flex items-center gap-2">
          <button
            className="bg-white border rounded px-4 py-3 flex items-center gap-3 shadow-sm"
            onClick={() => {
              const payload = { id: `${channelName}-${Date.now()}`, provider: channelName.toLowerCase(), nickname: nickname || `${channelName} Store`, region, fba }
              try {
                const raw = typeof window !== 'undefined' ? window.localStorage.getItem('salesChannels') : null
                const list = raw ? JSON.parse(raw) : []
                list.push(payload)
                window.localStorage.setItem('salesChannels', JSON.stringify(list))
              } catch {}
              router.push('/settings/channels/your')
            }}
          >
            <span className="w-6 h-6 rounded bg-purple-100 text-purple-700 flex items-center justify-center">{channelName[0]}</span>
            <span className="text-sm text-gray-800">Connect Your Account</span>
          </button>
          <Link href={'/settings/channels'} className="text-sm text-gray-700 border rounded px-3 py-2">Back</Link>
        </div>
      </div>
    </div>
  )
}


