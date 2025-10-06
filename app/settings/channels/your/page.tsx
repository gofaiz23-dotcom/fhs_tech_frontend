"use client"
import SettingsLayout from "../../_components/SettingsLayout";
import Link from 'next/link'
import React from 'react'
import { useSalesChannelsStore } from "../../../lib/stores/salesChannelsStore"

type SavedChannel = { id: string; provider: string; nickname: string; region: string; fba?: boolean }

export default function YourSalesChannelsPage() {
  const { channels, removeChannel } = useSalesChannelsStore()

  const remove = (id: string) => {
    removeChannel(id)
  }

  return (
    <SettingsLayout>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Your Sales Channels</h2>
        <Link href={'/settings/channels'} className="text-sm text-blue-600">+ Connect new channel</Link>
      </div>
      <div className="bg-white border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">Provider</th>
              <th className="p-3 text-left">Nickname</th>
              <th className="p-3 text-left">Region</th>
              <th className="p-3 text-left">FBA</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.length === 0 && (
              <tr><td className="p-4 text-gray-500" colSpan={5}>No channels connected yet.</td></tr>
            )}
            {channels.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3 capitalize">{c.provider}</td>
                <td className="p-3">{c.nickname}</td>
                <td className="p-3">{c.region}</td>
                <td className="p-3">{c.fba ? 'Enabled' : '-'}</td>
                <td className="p-3">
                  <button className="text-red-600" onClick={()=>remove(c.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsLayout>
  )
}


