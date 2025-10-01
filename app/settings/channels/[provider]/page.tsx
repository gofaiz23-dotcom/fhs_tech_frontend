import SettingsLayout from "../../_components/SettingsLayout";
import ChannelLogo from "../../_components/ChannelLogo";
import ChannelConnectForm, { ChannelOption } from "../../_components/ChannelConnectForm";

const channelRegions: Record<string, ChannelOption[]> = {
  amazon: [
    { label: 'Amazon.com (United States)', value: 'us' },
    { label: 'Amazon.ca (Canada)', value: 'ca' },
    { label: 'Amazon.co.uk (United Kingdom)', value: 'uk' },
  ],
  ebay: [
    { label: 'eBay (Global)', value: 'global' },
  ],
  etsy: [
    { label: 'Etsy (Global)', value: 'global' },
  ],
  google: [
    { label: 'Google Channel (Global)', value: 'global' },
  ],
  newegg: [
    { label: 'Newegg (Global)', value: 'global' },
  ],
  sears: [
    { label: 'Sears (US)', value: 'us' },
  ],
  walmart: [
    { label: 'Walmart (US)', value: 'us' },
  ],
}

export default function ProviderPage({ params }: { params: { provider: string } }) {
  const key = params.provider.toLowerCase()
  const pretty = key.charAt(0).toUpperCase() + key.slice(1)
  const regions = channelRegions[key] || [{ label: `${pretty} (Global)`, value: 'global' }]
  const showFba = key === 'amazon'

  return (
    <SettingsLayout>
      <div className="flex items-center gap-3 mb-2">
        <ChannelLogo name={pretty} />
        <div className="text-lg font-semibold text-gray-800">{pretty}</div>
      </div>
      <ChannelConnectForm channelName={pretty} regions={regions} showFbaToggle={showFba} />
    </SettingsLayout>
  )
}


