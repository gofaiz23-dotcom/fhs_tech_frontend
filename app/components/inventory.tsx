"use client"
import React from 'react'
import { Search } from 'lucide-react'

type ApiProduct = {
  id: number
  title: string
  thumbnail: string
  category: string
  stock: number
  price: number
}

type InventoryItem = {
  id: number
  name: string
  sku: string
  thumbnail: string
  condition: 'new' | 'used'
  location: string
  binLocation: string
  available: number
  reserved: number
  onHand: number
  price: string
  lastModified: string
  category: string
  tags: string[]
}

const randomBin = () => `A${Math.ceil(Math.random()*3)}`

export default function Inventory() {
  const [items, setItems] = React.useState<InventoryItem[]>([])
  const [loading, setLoading] = React.useState(false)

  // Filters
  const [search, setSearch] = React.useState('')
  const [tagQuery, setTagQuery] = React.useState('')
  const [condition, setCondition] = React.useState<'all' | 'new' | 'used'>('all')
  const [category, setCategory] = React.useState('All Categories')
  const [invFilter, setInvFilter] = React.useState<'available' | 'reserved' | 'on_hand'>('available')
  const [qtyMin, setQtyMin] = React.useState<string>('')
  const [qtyMax, setQtyMax] = React.useState<string>('')

  // Selection
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())

  // Pagination
  const [page, setPage] = React.useState(1)
  const [perPage, setPerPage] = React.useState(50)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const res = await fetch('https://dummyjson.com/products?limit=100')
        const data = await res.json()
        const mapped: InventoryItem[] = (data.products as ApiProduct[]).map((p) => {
          const reserved = 0
          const available = p.stock
          const onHand = available
          return {
            id: p.id,
            name: p.title,
            sku: `SBTSHIRT-${p.id}`,
            thumbnail: p.thumbnail,
            condition: 'new',
            location: 'Warehouse',
            binLocation: randomBin(),
            available,
            reserved,
            onHand,
            price: `$${p.price.toFixed(2)}`,
            lastModified: new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }),
            category: p.category,
            tags: [],
          }
        })
        if (mounted) setItems(mapped)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const categories = React.useMemo(() => {
    return ['All Categories', ...Array.from(new Set(items.map(i => i.category)))]
  }, [items])

  const filtered = React.useMemo(() => {
    let list = items
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    }
    const tag = tagQuery.trim().toLowerCase()
    if (tag) list = list.filter(i => i.tags.some(t => t.toLowerCase().includes(tag)))
    if (condition !== 'all') list = list.filter(i => i.condition === condition)
    if (category !== 'All Categories') list = list.filter(i => i.category === category)
    if (invFilter === 'available') list = list.filter(i => i.available > 0)
    if (invFilter === 'reserved') list = list.filter(i => i.reserved > 0)
    if (invFilter === 'on_hand') list = list.filter(i => i.onHand > 0)
    const min = qtyMin === '' ? undefined : Number(qtyMin)
    const max = qtyMax === '' ? undefined : Number(qtyMax)
    if (min !== undefined) list = list.filter(i => i.available >= min)
    if (max !== undefined) list = list.filter(i => i.available <= max)
    return list
  }, [items, search, tagQuery, condition, category, invFilter, qtyMin, qtyMax])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * perPage, safePage * perPage)
  const allSelected = pageItems.length > 0 && pageItems.every(i => selectedIds.has(i.id))

  const toggleAll = (checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) pageItems.forEach(i => next.add(i.id)); else pageItems.forEach(i => next.delete(i.id))
      return next
    })
  }
  const toggleOne = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border md:border-0 md:border-r bg-white dark:bg-slate-800 p-4 rounded md:rounded-none">
          <h3 className="font-semibold text-gray-800 dark:text-slate-100 mb-3">Filter Inventory</h3>
          <div className="text-xs text-gray-600 dark:text-slate-400 mb-2">{filtered.length} inventory SKUs found</div>
          <div className="mb-4 relative">
            <input value={search} onChange={(e)=>{setSearch(e.target.value); setPage(1)}} placeholder="Search inventory" className="w-full border rounded pl-3 pr-8 py-2 text-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100" />
            <span className="absolute right-2 top-2.5 text-gray-400 dark:text-slate-400"><Search/></span>
          </div>
          <div className="mb-2 text-sm text-gray-700 dark:text-slate-300">Tags</div>
          <input value={tagQuery} onChange={(e)=>{setTagQuery(e.target.value); setPage(1)}} placeholder="Search Tags" className="w-full border rounded px-3 py-2 text-sm mb-4 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100" />

          <div className="mb-2 text-sm text-gray-700 dark:text-slate-300">Conditions</div>
          <select value={condition} onChange={(e)=>{setCondition(e.target.value as any); setPage(1)}} className="w-full border rounded px-3 py-2 text-sm mb-4 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">
            <option value="all">All Conditions</option>
            <option value="new">new</option>
            <option value="used">used</option>
          </select>

          <div className="mb-2 text-sm text-gray-700 dark:text-slate-300">Category</div>
          <select value={category} onChange={(e)=>{setCategory(e.target.value); setPage(1)}} className="w-full border rounded px-3 py-2 text-sm mb-4 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">
            {categories.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>

          <div className="mb-2 text-sm text-gray-700 dark:text-slate-300">Inventory</div>
          <div className="space-y-2 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300"><input type="radio" name="inv" checked={invFilter==='available'} onChange={()=>{setInvFilter('available'); setPage(1)}}/> Available</label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300"><input type="radio" name="inv" checked={invFilter==='reserved'} onChange={()=>{setInvFilter('reserved'); setPage(1)}}/> Reserved</label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300"><input type="radio" name="inv" checked={invFilter==='on_hand'} onChange={()=>{setInvFilter('on_hand'); setPage(1)}}/> On Hand</label>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <div className="text-xs text-gray-600 dark:text-slate-400 mb-1">From</div>
              <input value={qtyMin} onChange={(e)=>{setQtyMin(e.target.value); setPage(1)}} className="w-full border rounded px-2 py-2 text-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100" />
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-slate-400 mb-1">To</div>
              <input value={qtyMax} onChange={(e)=>{setQtyMax(e.target.value); setPage(1)}} className="w-full border rounded px-2 py-2 text-sm bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm px-3 py-2" onClick={()=>{ /* filters auto-apply */ }}>Apply filter</button>
            <button className="text-blue-600 dark:text-blue-400 text-sm" onClick={()=>{setSearch(''); setTagQuery(''); setCondition('all'); setCategory('All Categories'); setInvFilter('available'); setQtyMin(''); setQtyMax(''); setPage(1)}}>Clear filter</button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-slate-100">Inventory</h1>
            <div className="flex items-center gap-2">
              <button className="btn-secondary text-sm px-3 py-2">Import from CSV</button>
              <button className="btn-secondary text-sm px-3 py-2">Manage locations</button>
              <button className="btn-secondary text-sm px-3 py-2">Export</button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-secondary text-sm px-3 py-2">Categorize</button>
            <button className="btn-secondary text-sm px-3 py-2">Add to Warehouse ▾</button>
            <button className="btn-secondary text-sm px-3 py-2">Bulk editor</button>
          </div>

          <div className="overflow-x-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                <tr>
                  <th className="w-10 p-3 text-left"><input type="checkbox" checked={allSelected} onChange={(e)=>toggleAll(e.target.checked)} /></th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">SKU</th>
                  <th className="p-3 text-left">Condition</th>
                  <th className="p-3 text-left">Location</th>
                  <th className="p-3 text-left">Bin Location</th>
                  <th className="p-3 text-left">Available</th>
                  <th className="p-3 text-left">Reserved</th>
                  <th className="p-3 text-left">On Hand</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td className="p-4 text-center text-gray-500 dark:text-slate-400" colSpan={11}>Loading...</td></tr>
                )}
                {pageItems.map((i) => (
                  <tr key={i.id} className="border-t border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="w-10 p-3 align-top"><input type="checkbox" checked={selectedIds.has(i.id)} onChange={(e)=>toggleOne(i.id, e.target.checked)} /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={i.thumbnail} alt="thumb" className="w-10 h-10 rounded object-contain bg-gray-100 dark:bg-slate-600" />
                        <div>
                          <div className="text-gray-900 dark:text-slate-100 font-medium">{i.name}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">Size: Large | Color: Heather White</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{i.sku}</td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{i.condition}</td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{i.location}</td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{i.binLocation}</td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{i.available}</td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{i.reserved}</td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{i.onHand}</td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{i.price}</td>
                    <td className="p-3 text-gray-700 dark:text-slate-300">{i.lastModified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-3 text-xs text-gray-600 dark:text-slate-400 border-t border-gray-200 dark:border-slate-600">
              <div>Showing {(safePage-1)*perPage + (pageItems.length > 0 ? 1 : 0)} - {(safePage-1)*perPage + pageItems.length} of {filtered.length} Inventory SKUs</div>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100" onClick={()=>setPage(1)} disabled={safePage===1}>First</button>
                <button className="px-2 py-1 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100" onClick={()=>setPage(Math.max(1, safePage-1))} disabled={safePage===1}>Previous</button>
                <span className="px-2 py-1 border rounded bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-slate-100">{safePage}</span>
                <button className="px-2 py-1 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100" onClick={()=>setPage(Math.min(totalPages, safePage+1))} disabled={safePage===totalPages}>Next</button>
                <button className="px-2 py-1 border rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100" onClick={()=>setPage(totalPages)} disabled={safePage===totalPages}>Last</button>
                <div className="ml-4 flex items-center gap-2">View
                  <select className="border rounded px-2 py-1 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100" value={perPage} onChange={(e)=>{setPerPage(Number(e.target.value)); setPage(1)}}>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  per page
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}


