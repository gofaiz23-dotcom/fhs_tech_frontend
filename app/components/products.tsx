"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Download, Plus, Info, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Image as ImageIcon, Images, Building2, Package2, Filter } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { ProductsService, type Product, type ProductsFilters, type Brand } from '../lib/products/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { useDraggable } from 'react-use-draggable-scroll'
import './table-scroll.css'

const Products = () => {
  const { state } = useAuth()
  
  // State management
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProductInfo, setSelectedProductInfo] = useState<Product | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Drag and scroll functionality
  const tableRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement>
  const { events } = useDraggable(tableRef, {
    applyRubberBandEffect: true,
  })
  
  // Filters and pagination
  const [filters, setFilters] = useState<ProductsFilters>({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    brandId: undefined,
    sortBy: 'title',
    sortOrder: 'asc'
  })
  
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  })
  
  // Filter options
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  
  // Load products
  const loadProducts = async () => {
    if (!state.accessToken) {
      setError('No access token available')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await ProductsService.getProducts(state.accessToken, filters)
      setProducts(response.products)
      setPagination(response.pagination)
    } catch (err: any) {
      console.error('Failed to load products:', err)
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }
  
  // Load filter options
  const loadFilterOptions = async () => {
    if (!state.accessToken) return
    
    try {
      const [categoriesData, brandsData] = await Promise.all([
        ProductsService.getCategories(state.accessToken),
        ProductsService.getBrands(state.accessToken)
      ])
      
      setCategories(categoriesData)
      setBrands(brandsData)
    } catch (err) {
      console.error('Failed to load filter options:', err)
    }
  }
  
  // Load data on mount and when filters change
  useEffect(() => {
    loadProducts()
  }, [filters.page, filters.limit, filters.search, filters.category, filters.brandId, filters.sortBy, filters.sortOrder])
  
  useEffect(() => {
    loadFilterOptions()
  }, [])
  
  // Cleanup modal scroll lock on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [])
  
  // Handle scroll to add shadow to fixed header
  useEffect(() => {
    const container = tableRef.current
    if (!container) return
    
    const handleScroll = () => {
      if (container.scrollTop > 10) {
        container.classList.add('scrolled')
      } else {
        container.classList.remove('scrolled')
      }
    }
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Handle search with debounce
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
  }
  
  // Handle filter changes
  const handleCategoryChange = (value: string) => {
    setFilters(prev => ({ ...prev, category: value === 'all' ? '' : value, page: 1 }))
  }
  
  const handleBrandChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      brandId: value === 'all' ? undefined : parseInt(value), 
      page: 1 
    }))
  }
  
  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value as any, page: 1 }))
  }
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }
  
  // Info modal handlers
  const handleShowInfo = (product: Product) => {
    setSelectedProductInfo(product)
    setShowInfoModal(true)
    document.body.classList.add('modal-open')
  }
  
  const handleCloseInfo = () => {
    setShowInfoModal(false)
    setSelectedProductInfo(null)
    document.body.classList.remove('modal-open')
  }
  
  // Export to CSV
  const handleExport = () => {
    if (products.length === 0) {
      alert('No products to export')
      return
    }
    
    // Create CSV headers
    const headers = [
      'Title', 'Group SKU', 'Sub SKU', 'Category', 'Collection', 'Ship Types', 'Single/Set',
      'Brand Real Price', 'Brand Misc', 'Brand Price', 'MSRP', 'Shipping Price',
      'Commission Price', 'Profit Margin', 'Ecommerce Misc', 'Ecommerce Price',
      'Brand', 'Created', 'Updated'
    ]
    
    // Create CSV rows
    const rows = products.map(product => [
      product.title,
      product.groupSku,
      product.subSku,
      product.category,
      product.collectionName,
      product.shipTypes,
      product.singleSetItem,
      product.brandRealPrice,
      product.brandMiscellaneous,
      product.brandPrice,
      product.msrp,
      product.shippingPrice,
      product.commissionPrice,
      product.profitMarginPrice,
      product.ecommerceMiscellaneous,
      product.ecommercePrice,
      product.brand?.name || '',
      new Date(product.createdAt).toLocaleDateString(),
      new Date(product.updatedAt).toLocaleDateString()
    ])
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // Add product handler
  const handleAddProduct = () => {
    alert('Add Product functionality coming soon!')
    // TODO: Implement add product modal/form
  }
  
  // Format currency
  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    return isNaN(num) ? '0.00' : `${num.toFixed(2)}`
  }
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Products
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-600"
                disabled={products.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button
                onClick={handleAddProduct}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Filters Row */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              />
            </div>
            
            {/* Filter Toggle Button */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters {showFilters ? '▲' : '▼'}
            </Button>
          </div>
          
          {/* Collapsible Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
                <SelectTrigger className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.brandId?.toString() || 'all'} 
                onValueChange={handleBrandChange}
              >
                <SelectTrigger className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filters.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="brandPrice">Brand Price</SelectItem>
                  <SelectItem value="msrp">MSRP</SelectItem>
                  <SelectItem value="ecommercePrice">Ecommerce Price</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Loading State */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : (
            <div className="relative">
              {/* Table Container with Drag */}
              <div
                ref={tableRef}
                className="table-scroll-container"
                {...events}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Title</TableHead>
                      <TableHead className="whitespace-nowrap">Group SKU</TableHead>
                      <TableHead className="whitespace-nowrap">Sub SKU</TableHead>
                      <TableHead className="whitespace-nowrap">Category</TableHead>
                      <TableHead className="whitespace-nowrap">Collection</TableHead>
                      <TableHead className="whitespace-nowrap">Ship Types</TableHead>
                      <TableHead className="whitespace-nowrap">Single/Set</TableHead>
                      <TableHead className="whitespace-nowrap">Brand Real Price</TableHead>
                      <TableHead className="whitespace-nowrap">Brand Misc</TableHead>
                      <TableHead className="whitespace-nowrap">Brand Price</TableHead>
                      <TableHead className="whitespace-nowrap">MSRP</TableHead>
                      <TableHead className="whitespace-nowrap">Shipping Price</TableHead>
                      <TableHead className="whitespace-nowrap">Commission</TableHead>
                      <TableHead className="whitespace-nowrap">Profit Margin</TableHead>
                      <TableHead className="whitespace-nowrap">Ecom Misc</TableHead>
                      <TableHead className="whitespace-nowrap">Ecom Price</TableHead>
                      <TableHead className="whitespace-nowrap">Main Image</TableHead>
                      <TableHead className="whitespace-nowrap">Gallery</TableHead>
                      <TableHead className="whitespace-nowrap">Brand</TableHead>
                      <TableHead className="whitespace-nowrap">Info</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="whitespace-nowrap max-w-xs overflow-hidden text-ellipsis">
                            {product.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap">{product.groupSku}</div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap max-w-xs overflow-hidden text-ellipsis">
                            {product.subSku}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap">{product.collectionName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap">{product.shipTypes || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                            {product.singleSetItem}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap text-green-600 dark:text-green-400 font-semibold">
                            ${formatCurrency(product.brandRealPrice)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap">${formatCurrency(product.brandMiscellaneous)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap text-green-600 dark:text-green-400 font-semibold">
                            ${formatCurrency(product.brandPrice)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap text-blue-600 dark:text-blue-400 font-semibold">
                            ${formatCurrency(product.msrp)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap">${formatCurrency(product.shippingPrice)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap">${formatCurrency(product.commissionPrice)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap text-orange-600 dark:text-orange-400">
                            ${formatCurrency(product.profitMarginPrice)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap">${formatCurrency(product.ecommerceMiscellaneous)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap text-indigo-600 dark:text-indigo-400 font-semibold">
                            ${formatCurrency(product.ecommercePrice)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            {product.mainImageUrl ? (
                              <ImageIcon className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            {product.galleryImages ? (
                              <Images className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                            ) : (
                              <Images className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Building2 className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                            <span>{product.brand?.name || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleShowInfo(product)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          >
                            <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-slate-700">
                <div className="text-sm text-gray-700 dark:text-slate-300">
                  Showing {products.length > 0 ? ((pagination.currentPage - 1) * pagination.itemsPerPage + 1) : 0} to{' '}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalCount)} of{' '}
                  {pagination.totalCount} products
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => goToPage(1)}
                    disabled={!pagination.hasPrevPage}
                    variant="outline"
                    size="sm"
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={() => goToPage(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    variant="outline"
                    size="sm"
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-700 dark:text-slate-300 px-3">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <Button
                    onClick={() => goToPage(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    variant="outline"
                    size="sm"
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={() => goToPage(pagination.totalPages)}
                    disabled={!pagination.hasNextPage}
                    variant="outline"
                    size="sm"
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Info Modal */}
      {showInfoModal && selectedProductInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Product Details
              </h3>
              <Button
                onClick={handleCloseInfo}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              
              {/* Pricing Info */}
              <div className="space-y-3">
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Brand</label>
                  <p className="text-gray-900 dark:text-slate-100">{selectedProductInfo.brand?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Created At:</label>
                  <p className="text-gray-900 dark:text-slate-100">{formatDate(selectedProductInfo.createdAt)}</p>
                  <label className="text-sm font-medium text-gray-500 dark:text-slate-400">Updated At:</label>
                  <p className="text-gray-900 dark:text-slate-100">{formatDate(selectedProductInfo.updatedAt)}</p>


                </div>
              </div>
              
              {/* Attributes */}
              {selectedProductInfo.attributes && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2 block">Attributes</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                    {Object.entries(selectedProductInfo.attributes).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-xs text-gray-500 dark:text-slate-400">{key.replace(/_/g, ' ')}:</span>
                        <p className="text-sm text-gray-900 dark:text-slate-100">{value?.toString() || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
