"use client"
import { Search } from 'lucide-react'
import React from 'react'

type ApiProduct = {
	id: number
	title: string
	thumbnail: string
	category: string
	stock: number
	price: number
	images?: string[]
}

type Product = {
	id: number
	thumbnail: string
	name: string
	sku: string
	category: string
	totalAvailable: number
	variants: number
	price: string
	lastModified: string
	draftListings: number
	activeListings: number
	tags?: string[]
	isListed: boolean
}

const Toolbar = ({
	onCategorize,
	onAddTags,
	onDelete,
	selectedCount,
}: {
	onCategorize: () => void
	onAddTags: () => void
	onDelete: () => void
	selectedCount: number
}) => {
	return (
		<div className="flex items-center gap-2">
			<button className="btn-success text-sm px-3 py-2">List Products on Channel</button>
			<button
				className={`btn-secondary text-sm px-3 py-2 ${selectedCount === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
				onClick={onCategorize}
				disabled={selectedCount === 0}
			>
				Categorize
			</button>
			<button
				className={`btn-secondary text-sm px-3 py-2 ${selectedCount === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
				onClick={onAddTags}
				disabled={selectedCount === 0}
			>
				Add Tags
			</button>
			<button
				className={`btn-danger text-sm px-3 py-2 ${selectedCount === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
				onClick={onDelete}
				disabled={selectedCount === 0}
			>
				Delete
			</button>
		</div>
	)
}

const Filters = ({ searchQuery, onSearchChange, listedFilter, onChangeListed }: { searchQuery: string; onSearchChange: (q: string) => void; listedFilter: 'all' | 'listed' | 'not_listed'; onChangeListed: (value: 'all' | 'listed' | 'not_listed') => void }) => {
	return (
		<aside className="w-full md:w-64 border md:border-0 md:border-r bg-white p-4 rounded md:rounded-none">
			<h3 className="font-semibold text-gray-800 mb-3">Filter Products</h3>
			<div className="mb-4 relative">
				<input
					type="text"
					placeholder="Search products"
					className="w-full border rounded px-3 py-2 text-sm"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
				<span className="absolute right-2 top-2.5 text-gray-400"><Search/></span>
			</div>
			<div className="mb-2 text-sm text-gray-700">Category</div>
			<select className="w-full border rounded px-3 py-2 text-sm mb-4">
				<option>All Categories</option>
			</select>
			<div className="mb-3">
				<div className="text-sm text-gray-700 mb-2">Listed On</div>
				<label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
					<input type="checkbox" className="rounded" checked={listedFilter === 'listed'} onChange={() => onChangeListed(listedFilter === 'listed' ? 'all' : 'listed')} />
					<span>is listed on</span>
				</label>
				<label className="flex items-center gap-2 text-sm text-gray-700">
					<input type="checkbox" className="rounded" checked={listedFilter === 'not_listed'} onChange={() => onChangeListed(listedFilter === 'not_listed' ? 'all' : 'not_listed')} />
					<span>is not listed on</span>
				</label>
			</div>
			<div className="flex items-center gap-2">
				<button className="btn-secondary text-sm px-3 py-2">Apply Filter</button>
				<button className="text-blue-600 text-sm">Clear Filter</button>
			</div>
		</aside>
	)
}

const ProductsTable = ({ products, loading, allSelected, onToggleAll, onToggleOne, selectedIds }: { products: Product[]; loading: boolean; allSelected: boolean; onToggleAll: (checked: boolean) => void; onToggleOne: (id: number, checked: boolean) => void; selectedIds: Set<number> }) => {
	return (
		<div className="overflow-x-auto bg-white border rounded">
			<table className="min-w-full text-sm">
				<thead className="bg-gray-50 text-gray-600">
					<tr>
						<th className="w-10 p-3 text-left"><input type="checkbox" checked={allSelected} onChange={(e) => onToggleAll(e.target.checked)} /></th>
						<th className="p-3 text-left">Name</th>
						<th className="p-3 text-left">SKU</th>
						<th className="p-3 text-left">Category</th>
						<th className="p-3 text-left">Total Available</th>
						<th className="p-3 text-left">Variants</th>
						<th className="p-3 text-left">Price</th>
						<th className="p-3 text-left">Last Modified</th>
						<th className="p-3 text-left">Draft Listings</th>
						<th className="p-3 text-left">Active Listings</th>
					</tr>
				</thead>
				<tbody>
					{loading && (
						<tr>
							<td className="p-4 text-center text-gray-500" colSpan={10}>Loading...</td>
						</tr>
					)}
					{products.map((p) => (
						<tr key={p.id} className="border-t hover:bg-gray-50">
							<td className="w-10 p-3 align-top"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={(e) => onToggleOne(p.id, e.target.checked)} /></td>
							<td className="p-3">
								<div className="flex items-center gap-3">
									<img src={p.thumbnail} alt="thumb" className="w-10 h-10 rounded object-contain bg-gray-100" />
									<div>
										<div className="text-gray-900 font-medium">{p.name}</div>
										<div className="text-xs text-gray-500">{p.variants > 0 ? 'Varies on: Size, Color' : '\u00A0'}</div>
									</div>
								</div>
							</td>
							<td className="p-3 text-gray-700">{p.sku}</td>
							<td className="p-3 text-gray-700">{p.category}</td>
							<td className="p-3 text-gray-700">{p.totalAvailable}</td>
							<td className="p-3 text-gray-700">{p.variants}</td>
							<td className="p-3 text-gray-700">{p.price}</td>
							<td className="p-3 text-gray-700">{p.lastModified}</td>
							<td className="p-3 text-gray-700">{p.draftListings}</td>
							<td className="p-3 text-gray-700">{p.activeListings}</td>
						</tr>
					))}
				</tbody>
			</table>
			<div className="flex items-center justify-between p-3 text-xs text-gray-600 border-t">
				<div>Showing 1 - {products.length} of {products.length} Products</div>
				<div className="flex items-center gap-2">View <select className="border rounded px-2 py-1"><option>25</option><option>50</option></select> per page</div>
			</div>
		</div>
	)
}

const Products = () => {
	const [products, setProducts] = React.useState<Product[]>([])
	const [loading, setLoading] = React.useState<boolean>(false)
	const [searchQuery, setSearchQuery] = React.useState<string>('')
	const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
    const [listedFilter, setListedFilter] = React.useState<'all' | 'listed' | 'not_listed'>('all')

	// UI state for actions
	const [showCategoryModal, setShowCategoryModal] = React.useState<boolean>(false)
	const [showTagsModal, setShowTagsModal] = React.useState<boolean>(false)
	const [newCategory, setNewCategory] = React.useState<string>('')
	const [newTags, setNewTags] = React.useState<string>('')

	React.useEffect(() => {
		let isMounted = true
		async function fetchProducts() {
			try {
				setLoading(true)
				const res = await fetch('https://dummyjson.com/products?limit=25')
				const data = await res.json()
				const mapped: Product[] = (data.products as ApiProduct[]).map((p) => ({
					id: p.id,
					thumbnail: p.thumbnail,
					name: p.title,
					sku: `SKU-${p.id}`,
					category: p.category,
					totalAvailable: p.stock,
					variants: Math.max(0, (p.images?.length || 1) - 1),
					price: `$${p.price.toFixed(2)}`,
					lastModified: new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }),
					draftListings: 0,
					activeListings: 0,
					tags: [],
					isListed: Math.random() > 0.5,
				}))
				if (isMounted) setProducts(mapped)
			} catch (e) {
				console.error('Failed to load products', e)
			} finally {
				if (isMounted) setLoading(false)
			}
		}
		fetchProducts()
		return () => { isMounted = false }
	}, [])

	const filteredProducts = React.useMemo(() => {
		const q = searchQuery.trim().toLowerCase()
		let list = products
		if (q) {
			list = list.filter(p =>
				p.name.toLowerCase().includes(q) ||
				p.sku.toLowerCase().includes(q) ||
				p.category.toLowerCase().includes(q)
			)
		}
		if (listedFilter === 'listed') list = list.filter(p => p.isListed)
		if (listedFilter === 'not_listed') list = list.filter(p => !p.isListed)
		return list
	}, [products, searchQuery, listedFilter])

	const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id))

	const handleToggleAll = (checked: boolean) => {
		setSelectedIds(prev => {
			const next = new Set(prev)
			if (checked) {
				filteredProducts.forEach(p => next.add(p.id))
			} else {
				filteredProducts.forEach(p => next.delete(p.id))
			}
			return next
		})
	}

	const handleToggleOne = (id: number, checked: boolean) => {
		setSelectedIds(prev => {
			const next = new Set(prev)
			if (checked) next.add(id); else next.delete(id)
			return next
		})
	}

	return (
		<div className="w-full">
			<div className="flex flex-col md:flex-row gap-4">
				{/* Filters Sidebar */}
				<Filters searchQuery={searchQuery} onSearchChange={setSearchQuery} listedFilter={listedFilter} onChangeListed={setListedFilter} />

				{/* Main content */}
				<main className="flex-1 space-y-4">
					<div className="flex items-center justify-between">
						<h1 className="text-xl font-semibold text-gray-800">Products</h1>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<span>Settings</span>
							<span className="w-px h-5 bg-gray-300" />
							<span>fhs ▾</span>
						</div>
					</div>
					<Toolbar
						onCategorize={() => setShowCategoryModal(true)}
						onAddTags={() => setShowTagsModal(true)}
						onDelete={() => {
							if (selectedIds.size === 0) return;
							if (!confirm(`Delete ${selectedIds.size} selected product(s)?`)) return;
							setProducts(prev => prev.filter(p => !selectedIds.has(p.id)));
							setSelectedIds(new Set());
						}}
						selectedCount={selectedIds.size}
					/>
					<ProductsTable
						products={filteredProducts}
						loading={loading}
						allSelected={allSelected}
						onToggleAll={handleToggleAll}
						onToggleOne={handleToggleOne}
						selectedIds={selectedIds}
					/>

					{/* Categorize Modal */}
					{showCategoryModal && (
						<div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
							<div className="bg-white rounded shadow w-full max-w-md p-4 space-y-3">
								<h3 className="font-semibold text-gray-800">Categorize Selected</h3>
								<input className="w-full border rounded px-3 py-2 text-sm" placeholder="Enter category" value={newCategory} onChange={(e)=>setNewCategory(e.target.value)} />
								<div className="flex justify-end gap-2 pt-2">
									<button className="px-3 py-2 text-sm border rounded" onClick={()=>{setShowCategoryModal(false); setNewCategory('')}}>Cancel</button>
									<button className="btn-accent text-sm px-3 py-2" onClick={()=>{
										if(!newCategory.trim()) return;
										setProducts(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, category: newCategory.trim() } : p));
										setShowCategoryModal(false); setNewCategory('');
									}}>Apply</button>
								</div>
							</div>
						</div>
					)}

					{/* Add Tags Modal */}
					{showTagsModal && (
						<div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
							<div className="bg-white rounded shadow w-full max-w-md p-4 space-y-3">
								<h3 className="font-semibold text-gray-800">Add Tags to Selected</h3>
								<input className="w-full border rounded px-3 py-2 text-sm" placeholder="Comma separated tags (e.g. new,summer)" value={newTags} onChange={(e)=>setNewTags(e.target.value)} />
								<div className="flex justify-end gap-2 pt-2">
									<button className="px-3 py-2 text-sm border rounded" onClick={()=>{setShowTagsModal(false); setNewTags('')}}>Cancel</button>
									<button className="btn-accent text-sm px-3 py-2" onClick={()=>{
										const tags = newTags.split(',').map(t=>t.trim()).filter(Boolean);
										if(tags.length===0) return;
										setProducts(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, tags: Array.from(new Set([...(p.tags||[]), ...tags])) } : p));
										setShowTagsModal(false); setNewTags('');
									}}>Apply</button>
								</div>
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	)
}

export default Products
