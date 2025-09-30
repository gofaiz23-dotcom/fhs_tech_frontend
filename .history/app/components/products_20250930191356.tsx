import React from 'react'

type Product = {
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
}

const mockProducts: Product[] = [
	{
		thumbnail: '/fhs-tech-logo.png',
		name: 'Sample Product',
		sku: 'SBWATBOT',
		category: 'Sample Items',
		totalAvailable: 20,
		variants: 0,
		price: '$12.99',
		lastModified: 'Sep 29, 2025',
		draftListings: 0,
		activeListings: 0,
	},
	{
		thumbnail: '/fhs-tech-logo.png',
		name: 'Sample Product with Variations',
		sku: 'SBT SHIRT',
		category: 'Sample Items',
		totalAvailable: 120,
		variants: 6,
		price: '$19.99',
		lastModified: 'Sep 29, 2025',
		draftListings: 0,
		activeListings: 0,
	},
]

const Toolbar = () => {
	return (
		<div className="flex items-center gap-2">
			<button className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-2 rounded">List Products on Channel</button>
			<button className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-2 rounded border">Categorize</button>
			<button className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-2 rounded border">Add Tags</button>
			<button className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-2 rounded border">Delete</button>
		</div>
	)
}

const Filters = () => {
	return (
		<aside className="w-full md:w-64 border md:border-0 md:border-r bg-white p-4 rounded md:rounded-none">
			<h3 className="font-semibold text-gray-800 mb-3">Filter Products</h3>
			<div className="mb-4">
				<input
					type="text"
					placeholder="Search products"
					className="w-full border rounded px-3 py-2 text-sm"
				/>
			</div>
			<div className="mb-2 text-sm text-gray-700">Category</div>
			<select className="w-full border rounded px-3 py-2 text-sm mb-4">
				<option>All Categories</option>
			</select>
			<div className="mb-3">
				<div className="text-sm text-gray-700 mb-2">Listed On</div>
				<label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
					<input type="checkbox" className="rounded" />
					<span>is listed on</span>
				</label>
				<label className="flex items-center gap-2 text-sm text-gray-700">
					<input type="checkbox" className="rounded" />
					<span>is not listed on</span>
				</label>
			</div>
			<div className="flex items-center gap-2">
				<button className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-2 rounded border">Apply Filter</button>
				<button className="text-blue-600 text-sm">Clear Filter</button>
			</div>
		</aside>
	)
}

const ProductsTable = ({ products }: { products: Product[] }) => {
	return (
		<div className="overflow-x-auto bg-white border rounded">
			<table className="min-w-full text-sm">
				<thead className="bg-gray-50 text-gray-600">
					<tr>
						<th className="w-10 p-3 text-left"><input type="checkbox" /></th>
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
					{products.map((p, idx) => (
						<tr key={idx} className="border-t hover:bg-gray-50">
							<td className="w-10 p-3 align-top"><input type="checkbox" /></td>
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
	return (
		<div className="w-full">
			<div className="flex flex-col md:flex-row gap-4">
				{/* Filters Sidebar */}
				<Filters />

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
					<Toolbar />
					<ProductsTable products={mockProducts} />
				</main>
			</div>
		</div>
	)
}

export default Products
