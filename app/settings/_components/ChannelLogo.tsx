export default function ChannelLogo({ name }: { name: string }) {
  const key = name.toLowerCase()
  const bg: Record<string, string> = {
    amazon: 'bg-amber-100 text-amber-700',
    ebay: 'bg-blue-100 text-blue-700',
    etsy: 'bg-orange-100 text-orange-700',
    google: 'bg-green-100 text-green-700',
    newegg: 'bg-indigo-100 text-indigo-700',
    sears: 'bg-sky-100 text-sky-700',
    walmart: 'bg-yellow-100 text-yellow-700',
  }
  const cls = bg[key] || 'bg-purple-100 text-purple-700'
  return (
    <div className={`w-14 h-14 rounded flex items-center justify-center font-bold ${cls}`}>{name[0]}</div>
  )
}

