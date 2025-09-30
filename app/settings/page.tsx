import SettingsLayout from "../components/settings/SettingsLayout";

export default function SettingsPage() {
  const marketplaces = [
    { name: 'Amazon', desc: "World's largest, with tens of millions of shoppers.", href: '#'},
    { name: 'eBay', desc: 'Sell everything to millions of shoppers.', href: '#'},
    { name: 'Etsy', desc: 'Specialized for handmade, vintage goods and craft supplies.', href: '#'},
    { name: 'Google Channel', desc: 'Increase sales by reaching hundreds of millions of people looking to buy products like yours.', href: '#'},
    { name: 'Newegg', desc: 'A trusted shopping destination, particularly among tech-minded shoppers.', href: '#'},
    { name: 'Sears', desc: 'A leading global retailer of home merchandise, apparel, and automotive products.', href: '#'},
    { name: 'Walmart', desc: 'Exclusive, but opens the door to sell to millions of shoppers.', href: '#'},
  ]

  const SidebarSection = ({ title, items }: { title: string; items: string[] }) => (
    <div className="mb-6">
      <div className="text-xs font-semibold text-gray-500 mb-2">{title}</div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm text-gray-700 hover:text-purple-700 cursor-pointer">{item}</li>
        ))}
      </ul>
    </div>
  )

  return (
    <SettingsLayout>
      <h2 className="text-xl font-semibold text-gray-800">Connect a New Sales Channel</h2>
      <div>
        <div className="text-sm text-gray-700 font-medium mb-3">Marketplaces</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketplaces.map((m) => (
            <div key={m.name} className="border rounded bg-white p-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded bg-purple-100 flex items-center justify-center text-purple-700 font-bold">{m.name[0]}</div>
              <div className="font-semibold text-gray-800">{m.name}</div>
              <div className="text-xs text-gray-600 max-w-xs">{m.desc}</div>
              <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded">Connect</button>
            </div>
          ))}
        </div>
      </div>
    </SettingsLayout>
  )
}


