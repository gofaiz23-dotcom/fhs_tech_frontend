"use client"

/**
 * Products Component
 * 
 * API Communication Policy:
 * ========================
 * ALL product data is sent as JSON (application/json), NOT FormData
 * 
 * - Create Product: JSON with base64-encoded images or URLs
 * - Update Product: JSON with base64-encoded images or URLs  
 * - Bulk Create: JSON array with base64-encoded images or URLs
 * - File Import: FormData (EXCEPTION - CSV/Excel file upload only)
 * 
 * Image Handling:
 * - If user provides URL: Send URL as-is
 * - If user uploads file: Convert to base64 and send in JSON
 * - Preview uses blob URLs (not base64) for better performance
 */

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Download, Plus, Info, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Image as ImageIcon, Images, Building2, Package2, Filter, Maximize2, Minimize2, Upload, Edit, Trash2, Minus } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { ProductsService, type Product, type ProductsFilters, type Brand, type ProductAttributes } from '../lib/products/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import UnifiedAddNew from './UnifiedAddNew'
import './table-scroll.css'

const Products = () => {
  const { state } = useAuth()
  
  // Helper function to proxy backend images through Next.js API
  const getProxiedImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null
    
    // Normalize the IP address to current backend IP
    let normalizedUrl = imageUrl
    if (imageUrl.includes('192.168.0.22:5000')) {
      normalizedUrl = imageUrl.replace('192.168.0.22:5000', '192.168.0.22:5000')
    }
    
    // If it's a backend URL, proxy it
    if (normalizedUrl.startsWith('http://192.168.0.22:5000/uploads/')) {
      return `/api/image-proxy?url=${encodeURIComponent(normalizedUrl)}`
    }
    
    // Otherwise return as-is (for external URLs)
    return normalizedUrl
  }
  
  // State management
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProductInfo, setSelectedProductInfo] = useState<Product | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [showEditProductModal, setShowEditProductModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Column resize state
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  
  // Expanded cells state
  const [expandedCells, setExpandedCells] = useState<{ [key: string]: boolean }>({})
  
  // Product form state
  const [productFormData, setProductFormData] = useState({
    brandId: '',
    title: '',
    groupSku: '',
    subSku: '',
    category: '',
    collectionName: '',
    shipTypes: '',
    singleSetItem: 'Single Item',
    brandRealPrice: '',
    brandMiscellaneous: '',
    brandPrice: '',
    msrp: '',
    shippingPrice: '',
    commissionPrice: '',
    profitMarginPrice: '',
    ecommerceMiscellaneous: '',
    ecommercePrice: '',
    mainImageUrl: '',
    galleryImages: [''] as string[],
    attributes: {
      origin: '',
      weight_lb: '',
      sub_category: '',
      volume_cuft: '',
      short_description: '',
      shipping_width_in: '',
      shipping_height_in: '',
      shipping_length_in: '',
      color: '',
      style: '',
      material: '',
      feature_1: '',
      feature_2: '',
      feature_3: '',
      feature_4: '',
      feature_5: '',
      feature_6: '',
      feature_7: '',
      product_dimension_inch: ''
    }
  })
  
  // Multiple Sub SKUs state
  const [subSkus, setSubSkus] = useState<{ sku: string, quantity: string }[]>([{ sku: '', quantity: '0' }])
  
  // Product features state
  const [productFeatures, setProductFeatures] = useState<string[]>([''])
  
  // Custom types state (key-value pairs)
  const [customTypes, setCustomTypes] = useState<Array<{key: string, value: string}>>([])
  
  // Show add new brand modal
  const [showAddBrandModal, setShowAddBrandModal] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  
  // Image preview modal
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [previewImageTitle, setPreviewImageTitle] = useState('')
  
  // Gallery carousel modal
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0)
  const [galleryTitle, setGalleryTitle] = useState('')
  
  // Fullscreen image modal
  const [showFullscreenImage, setShowFullscreenImage] = useState(false)
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState('')
  const [fullscreenImageTitle, setFullscreenImageTitle] = useState('')
  
  // Selected rows state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  
  // File upload state
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([])
  
  // Bulk and import modals state
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [bulkProducts, setBulkProducts] = useState<Array<any>>([])
  const [importFile, setImportFile] = useState<File | null>(null)
  const [bulkResults, setBulkResults] = useState<any>(null)
  
  // Listings modal state
  const [showListingsModal, setShowListingsModal] = useState(false)
  const [listingsData, setListingsData] = useState<Array<any>>([])
  const [isSubmittingListings, setIsSubmittingListings] = useState(false)
  const [combinationSuggestions, setCombinationSuggestions] = useState<Array<any>>([])
  const [selectedCombination, setSelectedCombination] = useState<number | null>(null)
  
  // Drag and scroll functionality with smooth momentum
  const tableRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const lastPos = useRef({ x: 0, y: 0, time: 0 })
  const momentumAnimation = useRef<number | null>(null)
  
  // Momentum scrolling animation
  const applyMomentum = () => {
    const container = tableRef.current
    if (!container) return
    
    // Apply velocity with medium friction for smooth deceleration
    const friction = 0.92
    velocity.current.x *= friction
    velocity.current.y *= friction
    
    // Stop if velocity is very small
    if (Math.abs(velocity.current.x) < 0.3 && Math.abs(velocity.current.y) < 0.3) {
      velocity.current = { x: 0, y: 0 }
      if (momentumAnimation.current) {
        cancelAnimationFrame(momentumAnimation.current)
        momentumAnimation.current = null
      }
      return
    }
    
    // Apply scroll smoothly
    container.scrollLeft -= velocity.current.x
    container.scrollTop -= velocity.current.y
    
    // Continue animation
    momentumAnimation.current = requestAnimationFrame(applyMomentum)
  }
  
  // Custom drag to scroll implementation with smooth momentum
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = tableRef.current
    if (!container) return
    
    // Don't drag if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || 
        target.closest('button') || target.closest('a') || target.closest('input')) {
      return
    }
    
    // Cancel any ongoing momentum
    if (momentumAnimation.current) {
      cancelAnimationFrame(momentumAnimation.current)
      momentumAnimation.current = null
    }
    
    setIsDragging(true)
    dragStartPos.current = {
      x: e.pageX,
      y: e.pageY,
      scrollLeft: container.scrollLeft || 0,
      scrollTop: container.scrollTop || 0
    }
    lastPos.current = {
      x: e.pageX,
      y: e.pageY,
      time: Date.now()
    }
    velocity.current = { x: 0, y: 0 }
    
    container.style.cursor = 'grabbing'
    container.style.userSelect = 'none'
    e.preventDefault()
  }
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const container = tableRef.current
    if (!container) return
    
    const currentTime = Date.now()
    const timeDiff = currentTime - lastPos.current.time
    
    const dx = e.pageX - dragStartPos.current.x
    const dy = e.pageY - dragStartPos.current.y
    
    // Calculate velocity for momentum with smoothing
    if (timeDiff > 0) {
      const velocityX = (e.pageX - lastPos.current.x) / timeDiff * 16
      const velocityY = (e.pageY - lastPos.current.y) / timeDiff * 16
      
      // Smooth velocity with exponential moving average
      velocity.current.x = velocity.current.x * 0.7 + velocityX * 0.3
      velocity.current.y = velocity.current.y * 0.7 + velocityY * 0.3
    }
    
    lastPos.current = {
      x: e.pageX,
      y: e.pageY,
      time: currentTime
    }
    
    // Medium smooth scroll - not too sensitive, not too slow
    const scrollMultiplier = 1.0
    container.scrollLeft = dragStartPos.current.scrollLeft - (dx * scrollMultiplier)
    container.scrollTop = dragStartPos.current.scrollTop - (dy * scrollMultiplier)
    
    e.preventDefault()
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
    const container = tableRef.current
    if (container) {
      container.style.cursor = 'grab'
      container.style.userSelect = ''
      
      // Start momentum scrolling with medium sensitivity
      if (Math.abs(velocity.current.x) > 0.5 || Math.abs(velocity.current.y) > 0.5) {
        // Scale down velocity for medium smooth momentum
        velocity.current.x *= 0.8
        velocity.current.y *= 0.8
        momentumAnimation.current = requestAnimationFrame(applyMomentum)
      }
    }
  }
  
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      const container = tableRef.current
      if (container) {
        container.style.cursor = 'grab'
        container.style.userSelect = ''
        
        // Start momentum scrolling with medium sensitivity
        if (Math.abs(velocity.current.x) > 0.5 || Math.abs(velocity.current.y) > 0.5) {
          // Scale down velocity for medium smooth momentum
          velocity.current.x *= 0.8
          velocity.current.y *= 0.8
          momentumAnimation.current = requestAnimationFrame(applyMomentum)
        }
      }
    }
  }
  
  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (momentumAnimation.current) {
        cancelAnimationFrame(momentumAnimation.current)
      }
    }
  }, [])
  
  const events = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
  }
  
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
      
      console.log('🔄 Loading products with filters:', filters)
      console.log('🔑 Access token available:', !!state.accessToken)
      
      const response = await ProductsService.getProducts(state.accessToken, filters)
      
      console.log('✅ Products loaded successfully:', response.products.length, 'items')
      console.log('📄 Pagination:', response.pagination)
      
      setProducts(response.products)
      setPagination(response.pagination)
      
      // Debug: Log products with images
      const productsWithImages = response.products.filter(p => p.mainImageUrl || (p.galleryImages && p.galleryImages.length > 0))
      if (productsWithImages.length > 0) {
        console.log(`📸 Products with images: ${productsWithImages.length}/${response.products.length}`)
        productsWithImages.slice(0, 3).forEach(p => {
          console.log(`  - ${p.title}:`)
          if (p.mainImageUrl) console.log(`    Main: ${p.mainImageUrl}`)
          if (p.galleryImages) console.log(`    Gallery: ${p.galleryImages.length} images`)
        })
      } else {
        console.log('⚠️ No products with images found in this batch')
      }
    } catch (err: any) {
      console.error('❌ Failed to load products:', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        status: err.status,
        stack: err.stack
      })
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
  
  // Test API connectivity on mount
  useEffect(() => {
    const testConnection = async () => {
      const { default: HttpClient } = await import('../lib/auth/httpClient');
      const result = await HttpClient.testConnectivity();
      console.log('🔌 API Connection Test:', result);
      
      if (!result.isReachable) {
        console.error('⚠️ WARNING: API server is not reachable!');
        setError(`API server is not reachable: ${result.error}`);
      }
    };
    
    testConnection();
  }, []);
  
  // Load data on mount and when filters change
  useEffect(() => {
    if (state.accessToken) {
      loadProducts()
    }
  }, [filters.page, filters.limit, filters.search, filters.category, filters.brandId, filters.sortBy, filters.sortOrder, state.accessToken])
  
  useEffect(() => {
    if (state.accessToken) {
      loadFilterOptions()
    }
  }, [state.accessToken])
  
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
    setShowAddProductModal(true)
    document.body.classList.add('modal-open')
  }
  
  // Bulk add products handler
  const handleBulkAddProducts = () => {
    setShowBulkModal(true)
    document.body.classList.add('modal-open')
  }
  
  // Import products handler
  const handleImportProducts = () => {
    setShowImportModal(true)
    document.body.classList.add('modal-open')
  }
  
  // Generate combination suggestions
  const generateCombinations = (products: Product[]) => {
    const combinations = []
    
    // If only one product, return individual listing
    if (products.length === 1) {
      return []
    }
    
    // Generate all combinations (from 2 products to all products)
    for (let size = 2; size <= products.length; size++) {
      const combs = getCombinations(products, size)
      combinations.push(...combs)
    }
    
    return combinations.map((combination, index) => {
      // Combine group SKUs
      const groupSku = combination.map(p => p.groupSku || '').filter(s => s).join('-')
      
      // Combine sub SKUs
      const allSubSkus = combination.flatMap(p => 
        p.subSku ? p.subSku.split(',').map(s => s.trim()) : []
      )
      
      // Combine titles
      const combinedTitle = combination.map(p => p.title).join(' + ')
      
      // Sum prices
      const totalBrandRealPrice = combination.reduce((sum, p) => {
        const price = typeof p.brandRealPrice === 'string' ? parseFloat(p.brandRealPrice) : p.brandRealPrice
        return sum + (price || 0)
      }, 0)
      const totalBrandMiscellaneous = combination.reduce((sum, p) => {
        const price = typeof p.brandMiscellaneous === 'string' ? parseFloat(p.brandMiscellaneous) : p.brandMiscellaneous
        return sum + (price || 0)
      }, 0)
      const totalMsrp = combination.reduce((sum, p) => {
        const price = typeof p.msrp === 'string' ? parseFloat(p.msrp) : p.msrp
        return sum + (price || 0)
      }, 0)
      const totalShippingPrice = combination.reduce((sum, p) => {
        const price = typeof p.shippingPrice === 'string' ? parseFloat(p.shippingPrice) : p.shippingPrice
        return sum + (price || 0)
      }, 0)
      
      return {
        id: index,
        products: combination,
        groupSku,
        subSkus: allSubSkus,
        title: combinedTitle,
        brandRealPrice: totalBrandRealPrice,
        brandMiscellaneous: totalBrandMiscellaneous,
        msrp: totalMsrp,
        shippingPrice: totalShippingPrice,
        productCount: combination.length
      }
    })
  }
  
  // Helper function to get combinations
  const getCombinations = (arr: Product[], size: number): Product[][] => {
    if (size === 1) return arr.map(item => [item])
    if (size === arr.length) return [arr]
    
    const result: Product[][] = []
    
    const combine = (start: number, combo: Product[]) => {
      if (combo.length === size) {
        result.push([...combo])
        return
      }
      
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i])
        combine(i + 1, combo)
        combo.pop()
      }
    }
    
    combine(0, [])
    return result
  }
  
  // Add to Listings handler
  const handleAddToListings = () => {
    // Use selectedProducts state instead of filtering from current page
    
    // Generate combination suggestions
    const suggestions = generateCombinations(selectedProducts)
    setCombinationSuggestions(suggestions)
    setSelectedCombination(null)
    
    // Initialize listings data for each selected product
    const initialListingsData = selectedProducts.map(product => {
      const subSkuArray = product.subSku ? product.subSku.split(',').map(s => s.trim()) : []
      
      return {
        productId: product.id,
        Sku: product.groupSku || '',
        originalGroupSku: product.groupSku || '', // Store original for protection
        customSku: '',
        subSkus: subSkuArray.map(sku => ({
          sku: sku,
          quantity: 1
        })),
        brandName: product.brand?.name || '',
        title: product.title || '',
        category: product.category || '',
        collectionName: product.collectionName || '',
        shipTypes: product.shipTypes || '',
        singleSetItem: product.singleSetItem || '',
        brandRealPrice: product.brandRealPrice || 0,
        brandMiscellaneous: product.brandMiscellaneous || 0,
        msrp: product.msrp || 0,
        shippingPrice: product.shippingPrice || 0,
        commissionPrice: product.commissionPrice || 0,
        profitMarginPrice: product.profitMarginPrice || 0,
        ecommerceMiscellaneous: product.ecommerceMiscellaneous || 0,
        mainImageUrl: product.mainImageUrl || '',
        galleryImages: product.galleryImages || [],
        attributes: {
          subCategory: product.attributes?.sub_category || '',
          shortDescription: product.attributes?.short_description || '',
          origin: product.attributes?.origin || '',
          shippingLength: product.attributes?.shipping_length_in || 0,
          shippingWidth: product.attributes?.shipping_width_in || 0,
          shippingHeight: product.attributes?.shipping_height_in || 0,
          volume: product.attributes?.volume_cuft || 0,
          weight: product.attributes?.weight_lb || 0,
          productDimension: product.attributes?.product_dimension_inch || '',
          style: product.attributes?.style || '',
          material: product.attributes?.material || '',
          color: product.attributes?.color || '',
          features: [
            product.attributes?.feature_1,
            product.attributes?.feature_2,
            product.attributes?.feature_3,
            product.attributes?.feature_4,
            product.attributes?.feature_5,
            product.attributes?.feature_6,
            product.attributes?.feature_7
          ].filter(f => f) || []
        }
      }
    })
    
    setListingsData(initialListingsData)
    setShowListingsModal(true)
    document.body.classList.add('modal-open')
  }
  
  // Close listings modal
  const handleCloseListings = () => {
    setShowListingsModal(false)
    setListingsData([])
    setCombinationSuggestions([])
    setSelectedCombination(null)
    document.body.classList.remove('modal-open')
  }
  
  // Handle combination selection
  const handleSelectCombination = (combinationId: number) => {
    const combination = combinationSuggestions.find(c => c.id === combinationId)
    if (!combination) return
    
    setSelectedCombination(combinationId)
    
    // Create a single listing from the combination
    const combinedListing = {
      productId: combination.products.map((p: Product) => p.id).join('-'),
      Sku: combination.groupSku,
      originalGroupSku: combination.groupSku, // Store original for protection
      customSku: '',
      subSkus: combination.subSkus.map((sku: string) => ({
        sku: sku,
        quantity: 1
      })),
      brandName: combination.products[0].brand?.name || '',
      title: combination.title,
      category: combination.products[0].category || '',
      collectionName: combination.products[0].collectionName || '',
      shipTypes: combination.products[0].shipTypes || '',
      singleSetItem: 'Set',
      brandRealPrice: combination.brandRealPrice,
      brandMiscellaneous: combination.brandMiscellaneous,
      msrp: combination.msrp,
      shippingPrice: combination.shippingPrice,
      commissionPrice: combination.products.reduce((sum: number, p: Product) => {
        const price = typeof p.commissionPrice === 'string' ? parseFloat(p.commissionPrice) : p.commissionPrice
        return sum + (price || 0)
      }, 0),
      profitMarginPrice: combination.products.reduce((sum: number, p: Product) => {
        const price = typeof p.profitMarginPrice === 'string' ? parseFloat(p.profitMarginPrice) : p.profitMarginPrice
        return sum + (price || 0)
      }, 0),
      ecommerceMiscellaneous: combination.products.reduce((sum: number, p: Product) => {
        const price = typeof p.ecommerceMiscellaneous === 'string' ? parseFloat(p.ecommerceMiscellaneous) : p.ecommerceMiscellaneous
        return sum + (price || 0)
      }, 0),
      mainImageUrl: combination.products[0].mainImageUrl || '',
      galleryImages: combination.products.flatMap((p: Product) => p.galleryImages || []),
      attributes: {
        subCategory: combination.products.map((p: Product) => p.attributes?.sub_category).filter(Boolean).join(', '),
        shortDescription: combination.products.map((p: Product) => p.attributes?.short_description).filter(Boolean).join(' + '),
        origin: combination.products[0].attributes?.origin || '',
        shippingLength: Math.max(...combination.products.map((p: Product) => p.attributes?.shipping_length_in || 0)),
        shippingWidth: Math.max(...combination.products.map((p: Product) => p.attributes?.shipping_width_in || 0)),
        shippingHeight: combination.products.reduce((sum: number, p: Product) => sum + (p.attributes?.shipping_height_in || 0), 0),
        volume: combination.products.reduce((sum: number, p: Product) => sum + (p.attributes?.volume_cuft || 0), 0),
        weight: combination.products.reduce((sum: number, p: Product) => sum + (p.attributes?.weight_lb || 0), 0),
        productDimension: combination.products.map((p: Product) => p.attributes?.product_dimension_inch).filter(Boolean).join(' + '),
        style: combination.products[0].attributes?.style || '',
        material: combination.products[0].attributes?.material || '',
        color: combination.products[0].attributes?.color || '',
        features: combination.products.flatMap((p: Product) => [
          p.attributes?.feature_1,
          p.attributes?.feature_2,
          p.attributes?.feature_3,
          p.attributes?.feature_4,
          p.attributes?.feature_5,
          p.attributes?.feature_6,
          p.attributes?.feature_7
        ]).filter(Boolean)
      }
    }
    
    setListingsData([combinedListing])
  }
  
  // Update listing data
  const updateListingData = (index: number, field: string, value: any) => {
    setListingsData(prev => {
      const newData = [...prev]
      if (field.startsWith('subSkus[')) {
        const match = field.match(/subSkus\[(\d+)\]\.(.+)/)
        if (match) {
          const subSkuIndex = parseInt(match[1])
          const subField = match[2]
          newData[index].subSkus[subSkuIndex][subField] = value
        }
      } else if (field.startsWith('attributes.')) {
        const attrField = field.replace('attributes.', '')
        newData[index].attributes[attrField] = value
      } else if (field === 'Sku') {
        // Protect the original Group SKU - users can only extend it
        const originalGroupSku = newData[index].originalGroupSku || ''
        if (originalGroupSku && !value.startsWith(originalGroupSku)) {
          // If user tries to remove original SKU, restore it and add the new part
          newData[index][field] = originalGroupSku
        } else {
          newData[index][field] = value
        }
      } else {
        newData[index][field] = value
      }
      return newData
    })
  }
  
  // Increment/Decrement sub SKU quantity
  const handleSubSkuQuantityChange = (listingIndex: number, subSkuIndex: number, delta: number) => {
    setListingsData(prev => {
      const newData = [...prev]
      const currentQty = newData[listingIndex].subSkus[subSkuIndex].quantity
      const newQty = Math.max(0, currentQty + delta)
      newData[listingIndex].subSkus[subSkuIndex].quantity = newQty
      return newData
    })
  }
  
  // Submit listings to API
  const handleSubmitListings = async () => {
    setIsSubmittingListings(true)
    setError(null)
    
    try {
      // Prepare the payload
      const payload = listingsData.map(listing => {
        // Generate final SKU
        const finalSku = listing.customSku ? `${listing.customSku}${listing.Sku}` : listing.Sku
        
        // Get selected sub SKUs (only those with quantity > 0)
        const selectedSubSkus = listing.subSkus
          .filter((ss: any) => ss.quantity > 0)
          .map((ss: any) => ss.sku)
          .join(',')
        
        return {
          Sku: finalSku,
          subSku: selectedSubSkus || listing.subSkus.map((ss: any) => ss.sku).join(','),
          brandName: listing.brandName,
          title: listing.title,
          category: listing.category,
          collectionName: listing.collectionName,
          shipTypes: listing.shipTypes,
          singleSetItem: listing.singleSetItem,
          brandRealPrice: listing.brandRealPrice,
          brandMiscellaneous: listing.brandMiscellaneous,
          msrp: listing.msrp,
          shippingPrice: listing.shippingPrice,
          commissionPrice: listing.commissionPrice,
          profitMarginPrice: listing.profitMarginPrice,
          ecommerceMiscellaneous: listing.ecommerceMiscellaneous,
          mainImageUrl: listing.mainImageUrl,
          galleryImages: listing.galleryImages,
          attributes: listing.attributes
        }
      })
      
      // Prepare final payload based on single or multiple
      const finalPayload = payload.length === 1 ? payload[0] : { listings: payload }
      
      // Send to API
      const response = await fetch('http://192.168.0.22:5000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.accessToken}`
        },
        body: JSON.stringify(finalPayload)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create listings')
      }
      
      const result = await response.json()
      
      // Show success message
      alert(`Successfully created ${payload.length} listing(s)!`)
      
      // Close modal and clear selection
      handleCloseListings()
      setSelectedRows(new Set())
      setSelectedProducts([])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listings')
      console.error('Error creating listings:', err)
    } finally {
      setIsSubmittingListings(false)
    }
  }
  
  // Close add product modal
  const handleCloseAddProduct = () => {
    setShowAddProductModal(false)
    document.body.classList.remove('modal-open')
    resetProductForm()
  }
  
  // Reset product form
  const resetProductForm = () => {
    setSubSkus([{ sku: '', quantity: '0' }])
    setProductFeatures([''])
    setCustomTypes([])
    setProductFormData({
      brandId: '',
      title: '',
      groupSku: '',
      subSku: '',
      category: '',
      collectionName: '',
      shipTypes: '',
      singleSetItem: 'Single Item',
      brandRealPrice: '',
      brandMiscellaneous: '',
      brandPrice: '',
      msrp: '',
      shippingPrice: '',
      commissionPrice: '',
      profitMarginPrice: '',
      ecommerceMiscellaneous: '',
      ecommercePrice: '',
      mainImageUrl: '',
      galleryImages: [''],
      attributes: {
        origin: '',
        weight_lb: '',
        sub_category: '',
        volume_cuft: '',
        short_description: '',
        shipping_width_in: '',
        shipping_height_in: '',
        shipping_length_in: '',
        color: '',
        style: '',
        material: '',
        feature_1: '',
        feature_2: '',
        feature_3: '',
        feature_4: '',
        feature_5: '',
        feature_6: '',
        feature_7: '',
        product_dimension_inch: ''
      }
    })
    setMainImageFile(null)
    setGalleryImageFiles([])
  }
  
  // Submit product form
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 PRODUCT FORM SUBMISSION STARTED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (!state.accessToken) {
      setError('No access token available')
      console.error('❌ No access token')
      return
    }
    
    // Validate required fields
    if (!productFormData.title.trim()) {
      setError('Product title is required')
      console.error('❌ Missing title')
      return
    }
    if (!productFormData.groupSku.trim()) {
      setError('Group SKU is required')
      console.error('❌ Missing groupSku')
      return
    }
    if (!productFormData.brandId) {
      setError('Brand is required')
      console.error('❌ Missing brandId')
      return
    }
    if (!productFormData.category.trim()) {
      setError('Category is required')
      console.error('❌ Missing category')
      return
    }
    
    console.log('✅ All required fields validated')
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Get brand name from brands list
      const selectedBrand = brands.find(b => b.id.toString() === productFormData.brandId)
      const brandName = selectedBrand?.name || ''
      
      if (!brandName) {
        setError('Invalid brand selected')
        setIsSubmitting(false)
        return
      }
      
      // Prepare Sub SKUs (comma-separated)
      const filteredSubSkus = subSkus.filter(item => item.sku.trim() !== '')
      const subSkuString = filteredSubSkus.map(item => item.sku.trim()).join(', ')
      
      // Prepare product features array
      const filteredFeatures = productFeatures.filter(f => f.trim() !== '')
      
      // Prepare attributes object - only include non-empty values
      const attributesTemp: Record<string, any> = {}
      
      // Add string attributes only if they have values
      if (productFormData.attributes.sub_category) attributesTemp.subCategory = productFormData.attributes.sub_category
      if (productFormData.attributes.short_description) attributesTemp.shortDescription = productFormData.attributes.short_description
      if (productFormData.attributes.origin) attributesTemp.origin = productFormData.attributes.origin
      if (productFormData.attributes.product_dimension_inch) attributesTemp.productDimension = productFormData.attributes.product_dimension_inch
      if (productFormData.attributes.style) attributesTemp.style = productFormData.attributes.style
      if (productFormData.attributes.material) attributesTemp.material = productFormData.attributes.material
      if (productFormData.attributes.color) attributesTemp.color = productFormData.attributes.color
      
      // Add numeric attributes only if they have values > 0
      const shippingLength = parseFloat(productFormData.attributes.shipping_length_in)
      if (shippingLength > 0) attributesTemp.shippingLength = shippingLength
      
      const shippingWidth = parseFloat(productFormData.attributes.shipping_width_in)
      if (shippingWidth > 0) attributesTemp.shippingWidth = shippingWidth
      
      const shippingHeight = parseFloat(productFormData.attributes.shipping_height_in)
      if (shippingHeight > 0) attributesTemp.shippingHeight = shippingHeight
      
      const volume = parseFloat(productFormData.attributes.volume_cuft)
      if (volume > 0) attributesTemp.volume = volume
      
      const weight = parseFloat(productFormData.attributes.weight_lb)
      if (weight > 0) attributesTemp.weight = weight
      
      // Add features array only if not empty
      if (filteredFeatures.length > 0) {
        attributesTemp.features = filteredFeatures
      }
      
      // Add custom types to attributes
      customTypes.forEach((type) => {
        if (type.key.trim() && type.value.trim()) {
          attributesTemp[type.key] = type.value
        }
      })
      
      // Create a clean plain object (fixes hasOwnProperty issues)
      const attributesPayload = JSON.parse(JSON.stringify(attributesTemp))
      
      console.log('📦 Attributes payload:', attributesPayload)
      console.log('📊 Attributes count:', Object.keys(attributesPayload).length)
      
      // Check if we have files to upload
      const hasMainImageFile = mainImageFile !== null
      const hasGalleryFiles = galleryImageFiles.length > 0
      const useFormData = hasMainImageFile || hasGalleryFiles
      
      console.log('🔍 Upload method check:')
      console.log('  - Main image file:', hasMainImageFile ? mainImageFile?.name : 'None')
      console.log('  - Gallery files:', hasGalleryFiles ? galleryImageFiles.length : 'None')
      console.log('  - Using FormData:', useFormData)
      
      let response: Response
      
      if (useFormData) {
        // ========= FormData Method (for file uploads) =========
        console.log('🚀 Building FormData...')
        const formData = new FormData()
        
        // Add all core fields
        formData.append('title', productFormData.title)
        formData.append('groupSku', productFormData.groupSku)
        formData.append('subSku', subSkuString)
        formData.append('brandId', productFormData.brandId)
        formData.append('category', productFormData.category)
        formData.append('collectionName', productFormData.collectionName || '')
        formData.append('shipTypes', productFormData.shipTypes || 'Standard Shipping')
        formData.append('singleSetItem', productFormData.singleSetItem || 'Single Item')
        formData.append('brandRealPrice', productFormData.brandRealPrice || '0')
        formData.append('brandMiscellaneous', productFormData.brandMiscellaneous || '0')
        formData.append('msrp', productFormData.msrp || '0')
        formData.append('shippingPrice', productFormData.shippingPrice || '0')
        formData.append('commissionPrice', productFormData.commissionPrice || '0')
        formData.append('profitMarginPrice', productFormData.profitMarginPrice || '0')
        formData.append('ecommerceMiscellaneous', productFormData.ecommerceMiscellaneous || '0')
        
        console.log('✅ Core fields added (15 text fields)')
        
        // Add main image file - ONLY if uploaded
        if (hasMainImageFile) {
          formData.append('mainImageUrl', mainImageFile!)
          console.log('📁 Main image: Uploading file -', mainImageFile!.name)
        }
        // If main image URL is provided (and no file), add it
        else if (productFormData.mainImageUrl && productFormData.mainImageUrl.trim() !== '') {
          formData.append('mainImageUrl', productFormData.mainImageUrl)
          console.log('🔗 Main image: URL provided -', productFormData.mainImageUrl)
        }
        
        // Add gallery image files - ONLY if uploaded
        if (hasGalleryFiles) {
          galleryImageFiles.forEach((file, index) => {
            formData.append('galleryImages', file)  // ← Backend expects 'galleryImages' field
            console.log(`📁 Gallery image ${index + 1}: Uploading file -`, file.name)
          })
        }
        // If gallery URLs are provided (and no files), add them as indexed array
        else {
          const filteredGalleryImages = productFormData.galleryImages.filter(url => url.trim() !== '')
          if (filteredGalleryImages.length > 0) {
            filteredGalleryImages.forEach((url, index) => {
              formData.append(`galleryImages[${index}]`, url)
            })
            console.log('🔗 Gallery images: URLs provided -', filteredGalleryImages.length)
          }
        }
        
        // Add attributes as nested fields (not JSON string)
        // Express with urlencoded extended:true will parse these into an object
        Object.keys(attributesPayload).forEach((key) => {
          const value = attributesPayload[key]
          if (Array.isArray(value)) {
            // For arrays (like features), send as indexed fields
            value.forEach((item, index) => {
              formData.append(`attributes[${key}][${index}]`, String(item))
            })
          } else {
            // For regular values, send as nested field
            formData.append(`attributes[${key}]`, String(value))
          }
        })
        const attributesJSON = JSON.stringify(attributesPayload)
        
        console.log('=== Sending FormData (multipart/form-data) ===')
        console.log(`Files: ${hasMainImageFile ? '1 main' : '0 main'}, ${hasGalleryFiles ? galleryImageFiles.length : '0'} gallery`)
        console.log('Attributes Object:', attributesJSON)
        console.log('Attributes count:', Object.keys(attributesPayload).length)
        
        // Debug: Log all FormData keys and values (non-file)
        const formDataKeys = Array.from(formData.keys())
        console.log('📋 FormData fields being sent:')
        formDataKeys.forEach(key => {
          const value = formData.get(key)
          if (value instanceof File) {
            console.log(`  - ${key}: [FILE] ${value.name} (${(value.size / 1024).toFixed(1)} KB)`)
          } else {
            console.log(`  - ${key}: ${value}`)
          }
        })
        console.log('🌐 Content-Type: multipart/form-data (set automatically by browser)')
        console.log('🚀 About to send FormData request to: http://192.168.0.22:5000/api/products')
        
        try {
          response = await fetch('http://192.168.0.22:5000/api/products', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${state.accessToken}`,
              // ⚠️ IMPORTANT: DON'T set Content-Type for FormData!
              // Browser automatically sets: 'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary...'
            },
            body: formData
          })
          console.log('✅ Request completed, status:', response.status, response.statusText)
        } catch (fetchError) {
          console.error('❌ Fetch request failed:', fetchError)
          throw fetchError
        }
      } else {
        // ========= JSON Method (for URL-only submission) =========
      const filteredGalleryImages = productFormData.galleryImages.filter(url => url.trim() !== '')
      
      const payload = {
        groupSku: productFormData.groupSku,
        subSku: subSkuString,
        brandName: brandName,
        title: productFormData.title,
        category: productFormData.category,
          collectionName: productFormData.collectionName || '',
          shipTypes: productFormData.shipTypes || 'Standard Shipping',
          singleSetItem: productFormData.singleSetItem || 'Single Item',
        brandRealPrice: parseFloat(productFormData.brandRealPrice) || 0,
        brandMiscellaneous: parseFloat(productFormData.brandMiscellaneous) || 0,
        msrp: parseFloat(productFormData.msrp) || 0,
        shippingPrice: parseFloat(productFormData.shippingPrice) || 0,
        commissionPrice: parseFloat(productFormData.commissionPrice) || 0,
        profitMarginPrice: parseFloat(productFormData.profitMarginPrice) || 0,
        ecommerceMiscellaneous: parseFloat(productFormData.ecommerceMiscellaneous) || 0,
        mainImageUrl: productFormData.mainImageUrl || '',
        galleryImages: filteredGalleryImages,
        attributes: attributesPayload
      }
      
        console.log('=== Sending JSON (application/json) ===')
        console.log(`Main Image URL: ${payload.mainImageUrl ? '✓' : '✗'}`)
        console.log(`Gallery URLs: ${filteredGalleryImages.length}`)
        console.log('Backend will download these URLs')
        
        response = await fetch('http://192.168.0.22:5000/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      }
      
      if (!response.ok) {
        let errorData: any = {}
        let rawText = ''
        try {
          rawText = await response.text()
          console.error('🔴 API Error Response (raw):', rawText)
          if (rawText) {
            errorData = JSON.parse(rawText)
            console.error('🔴 API Error Response (parsed):', errorData)
          }
        } catch (e) {
          console.error('⚠️ Could not parse error response:', e)
          console.error('Raw text was:', rawText)
        }
        
        // Extract error message
        let errorMsg = 'Failed to create product'
        if (errorData.error) errorMsg = errorData.error
        else if (errorData.message) errorMsg = errorData.message
        else if (errorData.msg) errorMsg = errorData.msg
        else errorMsg = `Failed to create product (${response.status}: ${response.statusText})`
        
        // Add details if present
        if (errorData.details) {
          errorMsg += ` - ${errorData.details}`
        }
        
        console.error('🚨 Final error message:', errorMsg)
        throw new Error(errorMsg)
      }
      
      const data = await response.json()
      console.log('Product created successfully:', data)
      
      // Close modal and refresh products
      handleCloseAddProduct()
      loadProducts()
      
    } catch (err: any) {
      console.error('Failed to create product:', err)
      setError(err.message || 'Failed to create product')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle main image file selection
  const handleMainImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('📁 File input changed, files:', e.target.files)
    
    if (file) {
      console.log('📁 Processing file:', file.name, file.type, file.size, 'bytes')
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        console.error('❌ Invalid file type:', file.type)
        return
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        console.error('❌ File too large:', file.size, 'bytes')
        return
      }
      
      setMainImageFile(file)
      // Clear the URL input when file is selected
      setProductFormData({...productFormData, mainImageUrl: ''})
      
      console.log('✅ Main image file selected:', file.name, `(${(file.size / 1024).toFixed(1)} KB, ${file.type})`)
      setError(null)
    } else {
      console.warn('⚠️ No file selected')
    }
  }
  
  // Handle gallery images selection
  const handleGalleryImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return
    
    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError(`Image "${file.name}" is too large. Each image must be less than 5MB`)
        return
      }
    }
    
    setGalleryImageFiles(files)
    // Clear the URL inputs when files are selected
    setProductFormData({...productFormData, galleryImages: ['']})
    
    console.log(`✅ ${files.length} gallery file(s) selected:`)
    files.forEach((f, idx) => {
      console.log(`  ${idx + 1}. ${f.name} (${(f.size / 1024).toFixed(1)} KB)`)
    })
    
    setError(null)
  }
  
  // Close bulk modal
  const handleCloseBulkModal = () => {
    setShowBulkModal(false)
    setBulkProducts([])
    document.body.classList.remove('modal-open')
  }
  
  // Close import modal
  const handleCloseImportModal = () => {
    setShowImportModal(false)
    setImportFile(null)
    document.body.classList.remove('modal-open')
  }
  
  // Add product to bulk list
  const addBulkProduct = () => {
    if (productFormData.title.trim() && productFormData.groupSku.trim() && productFormData.subSku.trim()) {
      setBulkProducts([...bulkProducts, { ...productFormData }])
      resetProductForm()
    }
  }
  
  // Remove product from bulk list
  const removeBulkProduct = (index: number) => {
    setBulkProducts(bulkProducts.filter((_, i) => i !== index))
  }
  
  // Create multiple products
  const handleBulkCreate = async () => {
    if (!state.accessToken || bulkProducts.length === 0) return

    try {
      setIsSubmitting(true)
      setError(null)
      
      const results = {
        created: [] as any[],
        errors: [] as Array<{product: string, error: string}>,
        duplicates: [] as any[]
      }
      
      for (const product of bulkProducts) {
        try {
          // Get brand name from brands list
          const selectedBrand = brands.find(b => b.id.toString() === product.brandId)
          const brandName = selectedBrand?.name || ''
          
          // Prepare JSON payload
          const payload = {
            groupSku: product.groupSku,
            subSku: product.subSku,
            brandName: brandName,
            title: product.title,
            category: product.category,
            collectionName: product.collectionName,
            shipTypes: product.shipTypes || '',
            singleSetItem: product.singleSetItem,
            brandRealPrice: parseFloat(product.brandRealPrice) || 0,
            brandMiscellaneous: parseFloat(product.brandMiscellaneous) || 0,
            msrp: parseFloat(product.msrp) || 0,
            shippingPrice: parseFloat(product.shippingPrice) || 0,
            commissionPrice: parseFloat(product.commissionPrice) || 0,
            profitMarginPrice: parseFloat(product.profitMarginPrice) || 0,
            ecommerceMiscellaneous: parseFloat(product.ecommerceMiscellaneous) || 0,
            mainImageUrl: product.mainImageUrl || '',
            galleryImages: product.galleryImages?.filter((url: string) => url.trim() !== '') || [],
            attributes: product.attributes
          }
          
          const response = await fetch('http://192.168.0.22:5000/api/products', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${state.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          })
          
          if (response.ok) {
            const data = await response.json()
            results.created.push(data)
          } else {
            const errorData = await response.json().catch(() => ({}))
            results.errors.push({ product: product.title, error: errorData.message || `Error ${response.status}` })
          }
        } catch (err: any) {
          results.errors.push({ product: product.title, error: err.message })
        }
      }
      
      setBulkResults({
        summary: {
          total: bulkProducts.length,
          created: results.created.length,
          errors: results.errors.length,
          duplicates: results.duplicates.length
        },
        results
      })
      
      handleCloseBulkModal()
      loadProducts()
      
    } catch (err: any) {
      console.error('Failed to create products:', err)
      setError(err.message || 'Failed to create products')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle file import (CSV/Excel file upload - requires FormData)
  const handleFileImport = async () => {
    if (!state.accessToken || !importFile) return

    try {
      setIsSubmitting(true)
      setError(null)
      
      // Note: File upload MUST use FormData (this is an exception to JSON-only rule)
      const formData = new FormData()
      formData.append('file', importFile)
      
      console.log('📁 Importing file:', importFile.name)
      
      const response = await fetch('http://192.168.0.22:5000/api/products/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`,
          // Note: Do NOT set Content-Type header - browser will set it with boundary for multipart/form-data
        },
        body: formData
      })
      
      if (!response.ok) {
        let errorData: any = {}
        try {
          const text = await response.text()
          console.error('Import Error Response (raw):', text)
          if (text) {
            errorData = JSON.parse(text)
          }
        } catch (e) {
          console.error('Could not parse import error response')
        }
        throw new Error(errorData.message || errorData.error || `Failed to import products (${response.status})`)
      }
      
      const data = await response.json()
      setBulkResults(data)
      handleCloseImportModal()
      loadProducts()
      
    } catch (err: any) {
      console.error('Failed to import products:', err)
      setError(err.message || 'Failed to import products')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle file selection for import
  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xls|xlsx)$/i)) {
        setError('Please select a valid CSV or Excel file (.csv, .xls, .xlsx)')
        return
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      
      setImportFile(file)
      setError(null)
    }
  }
  
  // Download sample CSV
  const downloadSampleCSV = () => {
    const csvContent = "title,groupSku,subSku,category,collectionName,singleSetItem,brandRealPrice,brandMiscellaneous,msrp,shippingPrice,commissionPrice,profitMarginPrice,ecommerceMiscellaneous,origin,weight_lb,sub_category,volume_cuft,short_description,shipping_width_in,shipping_height_in,shipping_length_in,color,style,material,feature_1,feature_2,feature_3,feature_4,feature_5,feature_6,feature_7,product_dimension_inch\nSample Product,SKU-001,SUB-001,Furniture,Modern,Single Item,100.00,10.00,150.00,15.00,5.00,25.00,8.00,USA,50.0,Chair,2.5,Comfortable office chair,24.0,30.0,20.0,Brown,Modern,Wood,Ergonomic,Adjustable,Swivel,Sturdy,Comfortable,Modern,24x30x20"
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products_sample.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }
  
  // Auto-calculate product dimensions
  const calculateProductDimensions = (width: string, height: string, length: string) => {
    if (width && height && length) {
      const w = parseFloat(width)
      const h = parseFloat(height)
      const d = parseFloat(length) // D is for Depth (Length)
      
      if (!isNaN(w) && !isNaN(h) && !isNaN(d)) {
        return `"${w}"W X "${d}"D X "${h}"H`
      }
    }
    return ''
  }
  
  // Handle dimension changes
  const handleDimensionChange = (field: 'shipping_width_in' | 'shipping_height_in' | 'shipping_length_in', value: string) => {
    const newAttributes = { ...productFormData.attributes, [field]: value }
    
    // Auto-calculate product dimensions
    const width = field === 'shipping_width_in' ? value : productFormData.attributes.shipping_width_in
    const height = field === 'shipping_height_in' ? value : productFormData.attributes.shipping_height_in
    const length = field === 'shipping_length_in' ? value : productFormData.attributes.shipping_length_in
    
    newAttributes.product_dimension_inch = calculateProductDimensions(width, height, length)
    
    setProductFormData({
      ...productFormData,
      attributes: newAttributes
    })
  }
  
  // Handle multiple Sub SKUs
  const addSubSku = () => {
    setSubSkus([...subSkus, { sku: '', quantity: '0' }])
  }
  
  const removeSubSku = (index: number) => {
    if (subSkus.length > 1) {
      setSubSkus(subSkus.filter((_, i) => i !== index))
    }
  }
  
  const updateSubSku = (index: number, value: string) => {
    const newSubSkus = [...subSkus]
    newSubSkus[index].sku = value
    setSubSkus(newSubSkus)
  }
  
  // Handle multiple Product Features
  const addProductFeature = () => {
    setProductFeatures([...productFeatures, ''])
  }
  
  const removeProductFeature = (index: number) => {
    if (productFeatures.length > 1) {
      setProductFeatures(productFeatures.filter((_, i) => i !== index))
    }
  }
  
  const updateProductFeature = (index: number, value: string) => {
    const newFeatures = [...productFeatures]
    newFeatures[index] = value
    setProductFeatures(newFeatures)
  }
  
  // Handle custom types (key-value pairs)
  const addCustomType = () => {
    setCustomTypes([...customTypes, { key: '', value: '' }])
  }
  
  const removeCustomType = (index: number) => {
    setCustomTypes(customTypes.filter((_, i) => i !== index))
  }
  
  const updateCustomType = (index: number, field: 'key' | 'value', value: string) => {
    const newTypes = [...customTypes]
    newTypes[index][field] = value
    setCustomTypes(newTypes)
  }
  
  // Handle add new brand
  const handleAddNewBrand = async () => {
    if (!newBrandName.trim()) {
      setError('Brand name cannot be empty')
      return
    }
    
    try {
      // Call API to create new brand
      const response = await fetch('http://192.168.0.22:5000/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.accessToken}`
        },
        body: JSON.stringify({ name: newBrandName })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `Failed to create brand (${response.status})`)
      }
      
      const newBrand = await response.json()
      
      // Reload brands list
      await loadFilterOptions()
      
      // Set the new brand as selected
      setProductFormData({ ...productFormData, brandId: newBrand.id.toString() })
      
      // Close modal and reset
      setShowAddBrandModal(false)
      setNewBrandName('')
      setError(null)
      
      // Show success message
      alert(`Brand "${newBrandName}" created successfully!`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add new brand'
      setError(errorMessage)
      console.error('Brand creation error:', err)
    }
  }
  
  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    
    // Populate form with product data
    setProductFormData({
      brandId: product.brand?.id?.toString() || '',
      title: product.title,
      groupSku: product.groupSku,
      subSku: product.subSku,
      category: product.category,
      collectionName: product.collectionName,
      shipTypes: product.shipTypes || '',
      singleSetItem: product.singleSetItem,
      brandRealPrice: product.brandRealPrice.toString(),
      brandMiscellaneous: product.brandMiscellaneous.toString(),
      brandPrice: product.brandPrice?.toString() || '',
      msrp: product.msrp.toString(),
      shippingPrice: product.shippingPrice?.toString() || '',
      commissionPrice: product.commissionPrice?.toString() || '',
      profitMarginPrice: product.profitMarginPrice?.toString() || '',
      ecommerceMiscellaneous: product.ecommerceMiscellaneous?.toString() || '',
      ecommercePrice: product.ecommercePrice?.toString() || '',
      mainImageUrl: product.mainImageUrl || '',
      galleryImages: (product.galleryImages && product.galleryImages.length > 0) ? product.galleryImages : [''],
      attributes: {
        origin: product.attributes?.origin?.toString() || '',
        weight_lb: product.attributes?.weight_lb?.toString() || '',
        sub_category: product.attributes?.sub_category?.toString() || '',
        volume_cuft: product.attributes?.volume_cuft?.toString() || '',
        short_description: product.attributes?.short_description?.toString() || '',
        shipping_width_in: product.attributes?.shipping_width_in?.toString() || '',
        shipping_height_in: product.attributes?.shipping_height_in?.toString() || '',
        shipping_length_in: product.attributes?.shipping_length_in?.toString() || '',
        color: product.attributes?.color?.toString() || '',
        style: product.attributes?.style?.toString() || '',
        material: product.attributes?.material?.toString() || '',
        feature_1: product.attributes?.feature_1?.toString() || '',
        feature_2: product.attributes?.feature_2?.toString() || '',
        feature_3: product.attributes?.feature_3?.toString() || '',
        feature_4: product.attributes?.feature_4?.toString() || '',
        feature_5: product.attributes?.feature_5?.toString() || '',
        feature_6: product.attributes?.feature_6?.toString() || '',
        feature_7: product.attributes?.feature_7?.toString() || '',
        product_dimension_inch: product.attributes?.product_dimension_inch?.toString() || ''
      }
    })
    
    // Populate Sub SKUs
    if (product.subSku) {
      setSubSkus([{ sku: product.subSku, quantity: '0' }])
    } else {
      setSubSkus([{ sku: '', quantity: '0' }])
    }
    
    // Populate product features
    const features = []
    for (let i = 1; i <= 7; i++) {
      const feature = product.attributes?.[`feature_${i}` as keyof ProductAttributes]
      if (feature) features.push(feature as string)
    }
    setProductFeatures(features.length > 0 ? features : [''])
    
    setShowEditProductModal(true)
    document.body.classList.add('modal-open')
  }
  
  // Close edit modal
  const handleCloseEditProduct = () => {
    setShowEditProductModal(false)
    setSelectedProduct(null)
    document.body.classList.remove('modal-open')
    resetProductForm()
  }
  
  // Update product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!state.accessToken || !selectedProduct) {
      setError('No access token or product selected')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Get brand name from brands list
      const selectedBrand = brands.find(b => b.id.toString() === productFormData.brandId)
      const brandName = selectedBrand?.name || ''
      
      // Prepare Sub SKUs (comma-separated)
      const filteredSubSkus = subSkus.filter(item => item.sku.trim() !== '')
      const subSkuString = filteredSubSkus.map(item => item.sku.trim()).join(', ')
      
      // Prepare product features array
      const filteredFeatures = productFeatures.filter(f => f.trim() !== '')
      
      // Prepare attributes object with correct field names
      const attributesPayload: any = {
        subCategory: productFormData.attributes.sub_category || '',
        shortDescription: productFormData.attributes.short_description || '',
        origin: productFormData.attributes.origin || '',
        shippingLength: parseFloat(productFormData.attributes.shipping_length_in) || 0,
        shippingWidth: parseFloat(productFormData.attributes.shipping_width_in) || 0,
        shippingHeight: parseFloat(productFormData.attributes.shipping_height_in) || 0,
        volume: parseFloat(productFormData.attributes.volume_cuft) || 0,
        weight: parseFloat(productFormData.attributes.weight_lb) || 0,
        productDimension: productFormData.attributes.product_dimension_inch || '',
        style: productFormData.attributes.style || '',
        material: productFormData.attributes.material || '',
        color: productFormData.attributes.color || '',
        features: filteredFeatures
      }
      
      // Add custom types to attributes
      customTypes.forEach((type) => {
        if (type.key.trim() && type.value.trim()) {
          attributesPayload[type.key] = type.value
        }
      })
      
      // Convert files to base64 if needed (same as create)
      let mainImageToSend = ''
      let galleryImagesToSend: string[] = []
      
      // Handle main image
      if (mainImageFile) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(mainImageFile)
        })
        mainImageToSend = base64
        console.log('📁 Main image: Uploaded file converted to base64')
      } else if (productFormData.mainImageUrl && !productFormData.mainImageUrl.startsWith('blob:')) {
        mainImageToSend = productFormData.mainImageUrl
        console.log('🔗 Main image: Using provided URL')
      }
      
      // Handle gallery images
      if (galleryImageFiles.length > 0) {
        for (const file of galleryImageFiles) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          galleryImagesToSend.push(base64)
        }
        console.log(`📁 Gallery images: ${galleryImageFiles.length} uploaded file(s) converted to base64`)
      } else {
        galleryImagesToSend = productFormData.galleryImages.filter(url => url.trim() !== '' && !url.startsWith('blob:'))
        if (galleryImagesToSend.length > 0) {
          console.log(`🔗 Gallery images: ${galleryImagesToSend.length} URL(s)`)
        }
      }
      
      // Prepare the payload
      const payload = {
        groupSku: productFormData.groupSku,
        subSku: subSkuString,
        brandName: brandName,
        title: productFormData.title,
        category: productFormData.category,
        collectionName: productFormData.collectionName,
        shipTypes: productFormData.shipTypes || '',
        singleSetItem: productFormData.singleSetItem,
        brandRealPrice: parseFloat(productFormData.brandRealPrice) || 0,
        brandMiscellaneous: parseFloat(productFormData.brandMiscellaneous) || 0,
        msrp: parseFloat(productFormData.msrp) || 0,
        shippingPrice: parseFloat(productFormData.shippingPrice) || 0,
        commissionPrice: parseFloat(productFormData.commissionPrice) || 0,
        profitMarginPrice: parseFloat(productFormData.profitMarginPrice) || 0,
        ecommerceMiscellaneous: parseFloat(productFormData.ecommerceMiscellaneous) || 0,
        mainImageUrl: mainImageToSend,
        galleryImages: galleryImagesToSend,
        attributes: attributesPayload
      }
      
      console.log('=== Update Payload Summary ===')
      console.log(`Main Image: ${mainImageFile ? 'FILE (base64)' : (mainImageToSend ? 'URL' : 'None')}`)
      console.log(`Gallery Images: ${galleryImageFiles.length > 0 ? `${galleryImageFiles.length} FILE(S) (base64)` : `${galleryImagesToSend.length} URL(S)`}`)
      console.log('==============================')
      
      // Make PUT request to update
      const response = await fetch(`http://192.168.0.22:5000/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        let errorData: any = {}
        try {
          const text = await response.text()
          console.error('Update Error Response (raw):', text)
          if (text) {
            errorData = JSON.parse(text)
          }
        } catch (e) {
          console.error('Could not parse update error response')
        }
        console.error('Update Error Response (parsed):', errorData)
        const errorMsg = errorData.message || errorData.error || errorData.msg || `Failed to update product (${response.status}: ${response.statusText})`
        const detailMsg = errorData.details ? ` - ${JSON.stringify(errorData.details)}` : ''
        throw new Error(errorMsg + detailMsg)
      }
      
      const data = await response.json()
      console.log('Product updated successfully:', data)
      
      // Close modal and refresh products
      handleCloseEditProduct()
      loadProducts()
      
    } catch (err: any) {
      console.error('Failed to update product:', err)
      setError(err.message || 'Failed to update product')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle delete product click
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteConfirmModal(true)
  }
  
  // Confirm delete product
  const handleConfirmDelete = async () => {
    if (!state.accessToken || !selectedProduct) {
      setError('No access token or product selected')
      return
    }
    
    try {
      setIsDeleting(true)
      setError(null)
      
      const response = await fetch(`http://192.168.0.22:5000/api/products/${selectedProduct.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${state.accessToken}`,
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete product')
      }
      
      console.log('Product deleted successfully')
      
      // Close modal and refresh products
      setShowDeleteConfirmModal(false)
      setSelectedProduct(null)
      setDeleteConfirmText('')
      loadProducts()
      
    } catch (err: any) {
      console.error('Failed to delete product:', err)
      setError(err.message || 'Failed to delete product')
    } finally {
      setIsDeleting(false)
    }
  }
  
  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false)
    setSelectedProduct(null)
    setDeleteConfirmText('')
  }
  
  // Handle image preview
  const handleImagePreview = (imageUrl: string, title: string) => {
    setPreviewImageUrl(imageUrl)
    setPreviewImageTitle(title)
    setShowImagePreview(true)
  }
  
  // Handle gallery preview (carousel)
  const handleGalleryPreview = (images: string[], title: string) => {
    setGalleryImages(images)
    setGalleryTitle(title)
    setCurrentGalleryIndex(0)
    setShowGalleryModal(true)
    document.body.classList.add('modal-open')
  }
  
  // Navigate gallery
  const nextGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev + 1) % galleryImages.length)
  }
  
  const prevGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }
  
  // Close gallery modal
  const closeGalleryModal = () => {
    setShowGalleryModal(false)
    setGalleryImages([])
    setCurrentGalleryIndex(0)
    setGalleryTitle('')
    document.body.classList.remove('modal-open')
  }
  
  const closeImagePreview = () => {
    setShowImagePreview(false)
    setPreviewImageUrl('')
    setPreviewImageTitle('')
  }
  
  // Handle checkbox selection
  const handleSelectRow = (productId: number) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
      // Remove from selectedProducts
      setSelectedProducts(prev => prev.filter(p => p.id !== productId))
    } else {
      newSelected.add(productId)
      // Add to selectedProducts
      const product = products.find(p => p.id === productId)
      if (product) {
        setSelectedProducts(prev => [...prev, product])
      }
    }
    setSelectedRows(newSelected)
  }
  
  const handleSelectAll = () => {
    if (selectedRows.size === products.length) {
      // Deselect all current page products
      const currentPageIds = new Set(products.map(p => p.id))
      setSelectedRows(prev => {
        const newSet = new Set(prev)
        currentPageIds.forEach(id => newSet.delete(id))
        return newSet
      })
      setSelectedProducts(prev => prev.filter(p => !currentPageIds.has(p.id)))
    } else {
      // Select all current page products
      const newIds = new Set(selectedRows)
      const newProducts = [...selectedProducts]
      
      products.forEach(p => {
        if (!newIds.has(p.id)) {
          newIds.add(p.id)
          newProducts.push(p)
        }
      })
      
      setSelectedRows(newIds)
      setSelectedProducts(newProducts)
    }
  }
  
  const isRowSelected = (productId: number) => {
    return selectedRows.has(productId)
  }
  
  const isAllSelected = () => {
    if (products.length === 0) return false
    // Check if all products on current page are selected
    return products.every(p => selectedRows.has(p.id))
  }
  
  const isSomeSelected = () => {
    if (products.length === 0 || selectedRows.size === 0) return false
    // Check if some (but not all) products on current page are selected
    const currentPageSelectedCount = products.filter(p => selectedRows.has(p.id)).length
    return currentPageSelectedCount > 0 && currentPageSelectedCount < products.length
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
  
  // Column resize handlers
  const handleResizeStart = (e: React.MouseEvent, columnKey: string, currentWidth: number) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnKey)
    setResizeStartX(e.clientX)
    setResizeStartWidth(currentWidth)
  }
  
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingColumn) return
    
    const diff = e.clientX - resizeStartX
    const newWidth = Math.max(50, resizeStartWidth + diff) // Minimum 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
  }
  
  const handleResizeEnd = () => {
    setResizingColumn(null)
  }
  
  // Add/remove resize event listeners
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.classList.add('resizing-column')
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.body.classList.remove('resizing-column')
      }
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth])
  
  // Toggle expanded cell
  const toggleExpandCell = (rowId: number, columnKey: string) => {
    const cellKey = `${rowId}-${columnKey}`
    setExpandedCells(prev => ({
      ...prev,
      [cellKey]: !prev[cellKey]
    }))
  }
  
  // Check if cell is expanded
  const isCellExpanded = (rowId: number, columnKey: string) => {
    const cellKey = `${rowId}-${columnKey}`
    return expandedCells[cellKey] || false
  }
  
  // Get column width
  const getColumnWidth = (columnKey: string, defaultWidth: number = 170) => {
    return columnWidths[columnKey] || defaultWidth
  }
  
  // Render expandable cell - content automatically adjusts to column width
  const renderExpandableCell = (content: string, rowId: number, columnKey: string, defaultWidth: number = 150) => {
    const isExpanded = isCellExpanded(rowId, columnKey)
    const currentWidth = getColumnWidth(columnKey, defaultWidth)
    
    // Calculate approximate characters that fit based on width (rough estimate: 8px per character)
    const charsPerPixel = 0.12
    const maxChars = Math.floor(currentWidth * charsPerPixel)
    const isTruncated = content.length > maxChars
    
    return (
      <div className="flex items-center gap-2 w-full">
        <div 
          className={`flex-1 ${isExpanded ? 'whitespace-normal break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis'}`}
          title={!isExpanded && isTruncated ? content : undefined}
        >
          {isExpanded ? content : content}
        </div>
        {isTruncated && !isExpanded && (
          <Button
            onClick={() => toggleExpandCell(rowId, columnKey)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            title="Expand to see full content"
          >
            <Maximize2 className="h-3 w-3 text-blue-500" />
          </Button>
        )}
        {isExpanded && (
          <Button
            onClick={() => toggleExpandCell(rowId, columnKey)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            title="Collapse"
          >
            <Minimize2 className="h-3 w-3 text-blue-500" />
          </Button>
        )}
      </div>
    )
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
              
              <UnifiedAddNew
                platformType="products"
                onAddProduct={handleAddProduct}
                onBulkAddProduct={handleBulkAddProducts}
                onImportProduct={handleImportProducts}
              />
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
          
          {/* Bulk Actions Bar */}
          {selectedRows.size > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  {selectedRows.size} {selectedRows.size === 1 ? 'product' : 'products'} selected
                </span>
                <Button
                  onClick={() => {
                    setSelectedRows(new Set())
                    setSelectedProducts([])
                  }}
                  size="sm"
                  variant="outline"
                  className="h-7"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddToListings}
                  size="sm"
                  variant="default"
                  className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white"
                >
                  <Package2 className="h-4 w-4 mr-2" />
                  Add to Listings ({selectedRows.size})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white dark:bg-slate-700"
                >
                  Bulk Export ({selectedRows.size})
                </Button>
              </div>
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
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                {...events}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={isAllSelected()}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeSelected()
                          }}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title={isAllSelected() ? 'Deselect all' : 'Select all'}
                        />
                      </TableHead>
                      {[
                        { key: 'mainImage', label: 'Image', width: 150 },
                        { key: 'title', label: 'Title', width: 150 },
                        { key: 'groupSku', label: 'Group SKU', width: 150 },
                        { key: 'subSku', label: 'Sub SKU', width: 150 },
                        { key: 'category', label: 'Category', width: 150 },
                        { key: 'brand', label: 'Brand', width: 180 },
                        { key: 'collection', label: 'Collection', width: 150 },
                        { key: 'singleSet', label: 'Single/Set', width: 150 },
                        { key: 'brandRealPrice', label: 'Brand Real Price', width: 150 },
                        { key: 'brandMisc', label: 'Brand Misc', width: 150 },
                        { key: 'brandPrice', label: 'Brand Price', width: 150 },
                        { key: 'msrp', label: 'MSRP', width: 150 },
                        { key: 'shippingPrice', label: 'Shipping Price', width: 150 },
                        { key: 'commission', label: 'Commission', width: 150 },
                        { key: 'profitMargin', label: 'Profit Margin', width: 150 },
                        { key: 'ecomMisc', label: 'Ecom Misc', width: 150 },
                        { key: 'ecomPrice', label: 'Ecom Price', width: 150 },
                        { key: 'gallery', label: 'Gallery', width: 150 },
                        { key: 'info', label: 'Info', width: 150 },
                        { key: 'actions', label: 'Actions', width: 150 }
                      ].map((col) => (
                        <TableHead 
                          key={col.key}
                          className="whitespace-nowrap relative group text-center"
                          style={{ width: `${getColumnWidth(col.key, col.width)}px`, minWidth: '50px' }}
                        >
                          <div className="flex items-center justify-center pr-2">
                            <span>{col.label}</span>
                            <div
                              className="absolute right-0 top-0 bottom-0  cursor-col-resize bg-gray-400  dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors border-r-2 border-transparent hover:border-blue-500"
                              onMouseDown={(e) => handleResizeStart(e, col.key, getColumnWidth(col.key, col.width))}
                              title="Drag to resize column"
                            />
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow 
                        key={product.id}
                        className={isRowSelected(product.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                      >
                        <TableCell className="w-12">
                          <input
                            type="checkbox"
                            checked={isRowSelected(product.id)}
                            onChange={() => handleSelectRow(product.id)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('mainImage', 170)}px` }}>
                          <div className="flex justify-center">
                            {product.mainImageUrl ? (
                              <button
                                onClick={() => {
                                  // Collect all images (main + gallery)
                                  const allImages = [product.mainImageUrl!]
                                  if (product.galleryImages && product.galleryImages.length > 0) {
                                    allImages.push(...product.galleryImages)
                                  }
                                  handleGalleryPreview(allImages, product.title)
                                }}
                                className="hover:scale-105 transition-transform cursor-pointer rounded-full overflow-hidden border-2 border-emerald-500 dark:border-emerald-400"
                                title={`Click to view all images`}
                              >
                                <img 
                                  src={getProxiedImageUrl(product.mainImageUrl) || ''} 
                                  alt={product.title}
                                  className="w-10 h-10 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  onError={(e) => {
                                    console.error('❌ Image failed to load:', product.mainImageUrl)
                                    console.error('Proxied URL:', getProxiedImageUrl(product.mainImageUrl))
                                    const target = e.currentTarget as HTMLImageElement
                                    target.style.display = 'none'
                                    const parent = target.parentElement
                                    if (parent) {
                                      parent.innerHTML = '<div class="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/20 rounded" title="Image failed to load - check console"><svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>'
                                    }
                                  }}
                                />
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                                <ImageIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-center" style={{ width: `${getColumnWidth('title', 170)}px` }}>
                          {renderExpandableCell(product.title, product.id, 'title', 170)}
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('groupSku', 170)}px` }}>
                          {renderExpandableCell(product.groupSku, product.id, 'groupSku', 170)}
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('subSku', 170)}px` }}>
                          {renderExpandableCell(product.subSku, product.id, 'subSku', 170)}
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('category', 170)}px` }}>
                          <Badge variant="outline" className="whitespace-nowrap bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('brand', 170)}px` }}>
                          <Badge variant="outline" className="whitespace-nowrap bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-300 dark:border-teal-700">
                            {product.brand?.name || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('collection', 170)}px` }}>
                          {renderExpandableCell(product.collectionName, product.id, 'collection', 170)}
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('singleSet', 170)}px` }}>
                          <Badge variant="outline" className="whitespace-nowrap bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                            {product.singleSetItem}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('brandRealPrice', 170)}px` }}>
                          <div className="whitespace-nowrap text-green-600 dark:text-green-400 font-semibold">
                            ${formatCurrency(product.brandRealPrice)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('brandMisc', 170)}px` }}>
                          <div className="whitespace-nowrap">${formatCurrency(product.brandMiscellaneous)}</div>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('brandPrice', 170)}px` }}>
                          <div className="whitespace-nowrap text-green-600 dark:text-green-400 font-semibold">
                            ${formatCurrency(product.brandPrice)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('msrp', 170)}px` }}>
                          <div className="whitespace-nowrap text-blue-600 dark:text-blue-400 font-semibold">
                            ${formatCurrency(product.msrp)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('shippingPrice', 170)}px` }}>
                          <div className="whitespace-nowrap">${formatCurrency(product.shippingPrice)}</div>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('commission', 170)}px` }}>
                          <div className="whitespace-nowrap">${formatCurrency(product.commissionPrice)}</div>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('profitMargin', 170)}px` }}>
                          <div className="whitespace-nowrap text-orange-600 dark:text-orange-400">
                            ${formatCurrency(product.profitMarginPrice)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('ecomMisc', 170)}px` }}>
                          <div className="whitespace-nowrap">${formatCurrency(product.ecommerceMiscellaneous)}</div>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('ecomPrice', 170)}px` }}>
                          <div className="whitespace-nowrap text-indigo-600 dark:text-indigo-400 font-semibold">
                            ${formatCurrency(product.ecommercePrice)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('gallery', 170)}px` }}>
                          <div className="flex justify-center">
                            {product.galleryImages && product.galleryImages.length > 0 ? (
                              <button
                                onClick={() => handleGalleryPreview(product.galleryImages!, product.title)}
                                className="hover:scale-105 transition-transform cursor-pointer rounded-full overflow-hidden border-2 border-cyan-500 dark:border-cyan-400 relative"
                                title={`Click to view ${product.galleryImages.length} images: ${product.galleryImages[0]}`}
                              >
                                <img 
                                  src={getProxiedImageUrl(product.galleryImages[0]) || ''} 
                                  alt={`${product.title} - Gallery`}
                                  className="w-10 h-10 object-cover"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  onError={(e) => {
                                    const imgUrl = product.galleryImages?.[0] || 'unknown'
                                    console.error('❌ Gallery image failed to load:', imgUrl)
                                    console.error('Proxied URL:', getProxiedImageUrl(imgUrl))
                                    const target = e.currentTarget as HTMLImageElement
                                    target.style.display = 'none'
                                    const parent = target.parentElement
                                    if (parent) {
                                      const imgCount = product.galleryImages?.length || 0
                                      parent.innerHTML = '<div class="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/20 rounded" title="Gallery images failed to load - check console"><svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div><span class="absolute top-0 right-0 bg-cyan-500 text-white text-xs font-bold rounded-bl px-1.5 py-0.5 shadow-lg">' + imgCount + '</span>'
                                    }
                                  }}
                                  onLoad={() => {
                                    console.log('✓ Gallery image loaded successfully:', product.galleryImages?.[0])
                                  }}
                                />
                                <span className="absolute top-0 right-0 bg-cyan-500 text-white text-xs font-bold rounded-bl px-1.5 py-0.5 shadow-lg">
                                  {product.galleryImages.length}
                                </span>
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded" title="No gallery images">
                              <Images className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('info', 170)}px` }}>
                          <Button
                            onClick={() => handleShowInfo(product)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          >
                            <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-center" style={{ width: `${getColumnWidth('actions', 170)}px` }}>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleEditProduct(product)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-center"
                              title="Edit Product"
                            >
                              <Edit className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(product)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                              title="Delete Product"
                            >
                              <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </Button>
                          </div>
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
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Product Details
              </h3>
              <Button
                onClick={handleCloseInfo}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Images Section */}
              {(selectedProductInfo.mainImageUrl || (selectedProductInfo.galleryImages && selectedProductInfo.galleryImages.length > 0)) && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700/50 dark:to-slate-800/50 rounded-lg p-6 border border-blue-200 dark:border-slate-600">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Product Images
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProductInfo.mainImageUrl && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Main Image</p>
                        <img
                          src={getProxiedImageUrl(selectedProductInfo.mainImageUrl) || ''}
                          alt="Main"
                          onClick={() => {
                            // Collect all images (main + gallery)
                            const allImages = [selectedProductInfo.mainImageUrl!]
                            if (selectedProductInfo.galleryImages && selectedProductInfo.galleryImages.length > 0) {
                              allImages.push(...selectedProductInfo.galleryImages)
                            }
                            handleGalleryPreview(allImages, selectedProductInfo.title)
                          }}
                          className="w-full h-40 object-cover rounded-full border-2 border-emerald-500 dark:border-emerald-400 shadow-md cursor-pointer hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    {selectedProductInfo.galleryImages && selectedProductInfo.galleryImages.map((img, idx) => (
                      <div key={idx}>
                        <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Gallery {idx + 1}</p>
                        <img
                          src={getProxiedImageUrl(img) || ''}
                          alt={`Gallery ${idx + 1}`}
                          onClick={() => {
                            // Collect all images (main + gallery)
                            const allImages = [selectedProductInfo.mainImageUrl!]
                            if (selectedProductInfo.galleryImages && selectedProductInfo.galleryImages.length > 0) {
                              allImages.push(...selectedProductInfo.galleryImages)
                            }
                            handleGalleryPreview(allImages, selectedProductInfo.title)
                          }}
                          className="w-full h-40 object-cover rounded-lg border-2 border-cyan-500 dark:border-cyan-400 shadow-md cursor-pointer hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-700/50 dark:to-slate-800/50 rounded-lg p-6 border border-purple-200 dark:border-slate-600">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Description</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50 w-48">Title</TableCell>
                        <TableCell className="font-medium">{selectedProductInfo.title}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Brand</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-300 dark:border-teal-700">
                            {selectedProductInfo.brand?.name || '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Group SKU</TableCell>
                        <TableCell className="font-mono text-sm">{selectedProductInfo.groupSku}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Sub SKU</TableCell>
                        <TableCell className="font-mono text-sm">{selectedProductInfo.subSku}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Category</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                            {selectedProductInfo.category}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Collection Name</TableCell>
                        <TableCell>{selectedProductInfo.collectionName || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Single/Set Item</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                            {selectedProductInfo.singleSetItem}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Ship Types</TableCell>
                        <TableCell>{selectedProductInfo.shipTypes || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Created At</TableCell>
                        <TableCell>{formatDate(selectedProductInfo.createdAt)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Updated At</TableCell>
                        <TableCell>{formatDate(selectedProductInfo.updatedAt)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-700/50 dark:to-slate-800/50 rounded-lg p-6 border border-green-200 dark:border-slate-600">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Pricing Information</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50 w-48">Brand Real Price</TableCell>
                        <TableCell className="text-green-600 dark:text-green-400 font-semibold">${formatCurrency(selectedProductInfo.brandRealPrice)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Brand Miscellaneous</TableCell>
                        <TableCell>${formatCurrency(selectedProductInfo.brandMiscellaneous)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Brand Price</TableCell>
                        <TableCell className="text-green-600 dark:text-green-400 font-semibold">${formatCurrency(selectedProductInfo.brandPrice)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">MSRP</TableCell>
                        <TableCell className="text-blue-600 dark:text-blue-400 font-semibold">${formatCurrency(selectedProductInfo.msrp)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Shipping Price</TableCell>
                        <TableCell>${formatCurrency(selectedProductInfo.shippingPrice)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Commission Price</TableCell>
                        <TableCell>${formatCurrency(selectedProductInfo.commissionPrice)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Profit Margin Price</TableCell>
                        <TableCell className="text-orange-600 dark:text-orange-400 font-semibold">${formatCurrency(selectedProductInfo.profitMarginPrice)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Ecommerce Miscellaneous</TableCell>
                        <TableCell>${formatCurrency(selectedProductInfo.ecommerceMiscellaneous)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50">Ecommerce Price</TableCell>
                        <TableCell className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg">${formatCurrency(selectedProductInfo.ecommercePrice)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Attributes */}
              {selectedProductInfo.attributes && Object.keys(selectedProductInfo.attributes).length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700/50 dark:to-slate-800/50 rounded-lg p-6 border border-amber-200 dark:border-slate-600">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Product Attributes</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableBody>
                        {Object.entries(selectedProductInfo.attributes).map(([key, value]) => {
                          // Format key nicely
                          const formattedKey = key
                            .replace(/_/g, ' ')
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim()
                          
                          // Format value based on type
                          let displayValue = '-'
                          if (value !== null && value !== undefined) {
                            if (Array.isArray(value)) {
                              displayValue = value.join(', ')
                            } else if (typeof value === 'object') {
                              displayValue = JSON.stringify(value)
                            } else {
                              displayValue = value.toString()
                            }
                          }
                          
                          return (
                            <TableRow key={key}>
                              <TableCell className="font-semibold bg-gray-50 dark:bg-slate-700/50 w-48 capitalize">{formattedKey}</TableCell>
                              <TableCell className="break-words">{displayValue}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {/* Show message if no attributes */}
              {selectedProductInfo.attributes && Object.keys(selectedProductInfo.attributes).length === 0 && (
                <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-lg border border-gray-200 dark:border-slate-600 text-center">
                  <p className="text-gray-500 dark:text-slate-400">No attributes defined for this product</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                Add New Product
              </h3>
              <Button
                onClick={handleCloseAddProduct}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmitProduct} className="space-y-6">
              {/* Basic Information */}
              <div className="border dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-slate-100 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Brand <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={productFormData.brandId}
                      onValueChange={(value) => {
                        if (value === 'add_new') {
                          setShowAddBrandModal(true)
                        } else {
                          setProductFormData({...productFormData, brandId: value})
                        }
                      }}
                      required
                    >
                      <SelectTrigger className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add_new" className="text-blue-600 font-semibold">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Brand
                          </div>
                        </SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={productFormData.title}
                      onChange={(e) => setProductFormData({...productFormData, title: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Group SKU <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={productFormData.groupSku}
                      onChange={(e) => setProductFormData({...productFormData, groupSku: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Sub SKU <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Add sub SKUs with their respective quantities</p>
                    <div className="flex gap-3 mb-2">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Sub SKU</label>
                      </div>
                      <div className="w-40">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Quantity</label>
                      </div>
                      <div className="w-24"></div>
                    </div>
                    <div className="space-y-2">
                      {subSkus.map((item, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-1">
                            <Input
                              type="text"
                              value={item.sku}
                              onChange={(e) => updateSubSku(index, e.target.value)}
                              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                              placeholder={`Sub SKU ${index + 1}`}
                              required={index === 0}
                            />
                          </div>
                          {/* <div className="w-40 flex items-center gap-1">
                            <Button
                              type="button"
                              onClick={() => {
                                const newSubSkus = [...subSkus]
                                const currentQty = parseInt(newSubSkus[index].quantity) || 0
                                newSubSkus[index].quantity = Math.max(0, currentQty - 1).toString()
                                setSubSkus(newSubSkus)
                              }}
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <div className="flex-1 text-center font-semibold text-sm py-2 px-2 border rounded bg-gray-50 dark:bg-gray-700">
                              {item.quantity || '0'}
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                const newSubSkus = [...subSkus]
                                const currentQty = parseInt(newSubSkus[index].quantity) || 0
                                newSubSkus[index].quantity = (currentQty + 1).toString()
                                setSubSkus(newSubSkus)
                              }}
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div> */}
                          <div className="w-24 flex gap-2">
                            {index === subSkus.length - 1 && (
                              <Button
                                type="button"
                                onClick={addSubSku}
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm flex-1"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                            {index > 0 && (
                              <Button
                                type="button"
                                onClick={() => removeSubSku(index)}
                                size="sm"
                                className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex-1"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={productFormData.category}
                      onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Collection Name
                    </label>
                    <Input
                      type="text"
                      value={productFormData.collectionName}
                      onChange={(e) => setProductFormData({...productFormData, collectionName: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Ship Types
                    </label>
                    <Input
                      type="text"
                      value={productFormData.shipTypes}
                      onChange={(e) => setProductFormData({...productFormData, shipTypes: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      placeholder="e.g. Standard Shipping, White Glove"
                    />
                  </div> */}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Single/Set Item
                    </label>
                    <Select
                      value={productFormData.singleSetItem}
                      onValueChange={(value) => setProductFormData({...productFormData, singleSetItem: value})}
                    >
                      <SelectTrigger className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Item">Single Item</SelectItem>
                        <SelectItem value="Set">Set</SelectItem>
                        <SelectItem value="Part">Part</SelectItem>
                        <SelectItem value="Bundle">Bundle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Pricing Information */}
              <div className="border dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-slate-100 mb-4">Pricing Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Brand Real Price <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.brandRealPrice}
                      onChange={(e) => setProductFormData({...productFormData, brandRealPrice: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Brand Miscellaneous
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.brandMiscellaneous}
                      onChange={(e) => setProductFormData({...productFormData, brandMiscellaneous: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      MSRP <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.msrp}
                      onChange={(e) => setProductFormData({...productFormData, msrp: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Shipping Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.shippingPrice}
                      onChange={(e) => setProductFormData({...productFormData, shippingPrice: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Commission Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.commissionPrice}
                      onChange={(e) => setProductFormData({...productFormData, commissionPrice: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Profit Margin
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.profitMarginPrice}
                      onChange={(e) => setProductFormData({...productFormData, profitMarginPrice: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Ecommerce Miscellaneous
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.ecommerceMiscellaneous}
                      onChange={(e) => setProductFormData({...productFormData, ecommerceMiscellaneous: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                </div>
              </div>
              
              {/* Product Attributes */}
              <div className="border dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-slate-100 mb-4">Product Attributes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Origin</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.origin}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, origin: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Weight (lb)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.attributes.weight_lb}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, weight_lb: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Sub Category</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.sub_category}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, sub_category: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Volume (cuft)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.attributes.volume_cuft}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, volume_cuft: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Short Description</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.short_description}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, short_description: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Shipping Width (in)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.attributes.shipping_width_in}
                      onChange={(e) => handleDimensionChange('shipping_width_in', e.target.value)}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Shipping Height (in)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.attributes.shipping_height_in}
                      onChange={(e) => handleDimensionChange('shipping_height_in', e.target.value)}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Shipping Length (in)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.attributes.shipping_length_in}
                      onChange={(e) => handleDimensionChange('shipping_length_in', e.target.value)}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Color</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.color}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, color: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Style</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.style}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, style: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Material</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.material}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, material: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Product Dimension (inch) - Auto-calculated</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.product_dimension_inch}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 bg-gray-100 dark:bg-slate-600"
                      placeholder="Auto-calculated from Width × Length × Height"
                      readOnly
                    />
                  </div>
                  
                  {/* Features */}
                  <div className="md:col-span-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900 dark:text-slate-100">Product Features</h5>
                    </div>
                    <div className="space-y-2">
                      {productFeatures.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="text"
                            value={feature}
                            onChange={(e) => updateProductFeature(index, e.target.value)}
                            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                            placeholder={`Feature ${index + 1}`}
                          />
                          {index === productFeatures.length - 1 && (
                            <Button
                              type="button"
                              onClick={addProductFeature}
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {index > 0 && (
                            <Button
                              type="button"
                              onClick={() => removeProductFeature(index)}
                              size="sm"
                              className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Types (Key-Value Pairs) */}
                  <div className="md:col-span-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900 dark:text-slate-100">Custom Types</h5>
                      <Button
                        type="button"
                        onClick={addCustomType}
                        size="sm"
                        className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Type
                      </Button>
                    </div>
                    {customTypes.length > 0 && (
                      <div className="space-y-3">
                        {customTypes.map((type, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-700/30 dark:to-slate-700/20 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Key
                              </label>
                              <Input
                                type="text"
                                value={type.key}
                                onChange={(e) => updateCustomType(index, 'key', e.target.value)}
                                className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                                placeholder="e.g., warranty"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Value
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  value={type.value}
                                  onChange={(e) => updateCustomType(index, 'value', e.target.value)}
                                  className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                                  placeholder="e.g., 1 year"
                                />
                                <Button
                                  type="button"
                                  onClick={() => removeCustomType(index)}
                                  size="sm"
                                  className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Images - URL or File Upload */}
              <div className="border dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-slate-100 mb-4">Images</h4>
                
                {/* Main Image */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Main Image
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={productFormData.mainImageUrl}
                        onChange={(e) => setProductFormData({...productFormData, mainImageUrl: e.target.value})}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        placeholder="Enter image URL or upload file"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageSelect}
                        className="hidden"
                        id="main-image-file-upload"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('main-image-file-upload')?.click()}
                        size="sm"
                        variant="outline"
                        className="whitespace-nowrap"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </Button>
                    </div>
                    {(mainImageFile || productFormData.mainImageUrl) && (
                      <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-200 dark:border-slate-600">
                        {mainImageFile ? (
                          <>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded border-2 border-emerald-500 dark:border-emerald-400 relative">
                              <Upload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">File Ready to Upload</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                📎 {mainImageFile.name}
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                {(mainImageFile.size / 1024).toFixed(1)} KB • {mainImageFile.type}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                        <img 
                          src={productFormData.mainImageUrl} 
                          alt="Main image preview" 
                          className="w-10 h-10 rounded-full object-cover rounded border border-gray-300 dark:border-slate-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                🔗 URL provided
                          </p>
                        </div>
                          </>
                        )}
                        <Button
                          type="button"
                          onClick={() => {
                            setProductFormData({...productFormData, mainImageUrl: ''})
                            setMainImageFile(null)
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Gallery Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Gallery Images
                  </label>
                  <div className="space-y-2">
                    {productFormData.galleryImages.map((url, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newGallery = [...productFormData.galleryImages]
                              newGallery[index] = e.target.value
                              setProductFormData({...productFormData, galleryImages: newGallery})
                            }}
                            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                            placeholder={`Gallery image ${index + 1} URL`}
                          />
                          {index === productFormData.galleryImages.length - 1 && (
                            <Button
                              type="button"
                              onClick={() => setProductFormData({...productFormData, galleryImages: [...productFormData.galleryImages, '']})}
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {productFormData.galleryImages.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => {
                                const newGallery = productFormData.galleryImages.filter((_, i) => i !== index)
                                setProductFormData({...productFormData, galleryImages: newGallery})
                              }}
                              size="sm"
                              className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {url && url.trim() !== '' && (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700/30 rounded border border-gray-200 dark:border-slate-600 ml-2">
                            <img 
                              src={url} 
                              alt={`Gallery ${index + 1}`}
                              className="w-12 h-12 object-cover rounded border border-gray-300 dark:border-slate-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd" width="48" height="48"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3EError%3C/text%3E%3C/svg%3E'
                              }}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Preview {index + 1}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryImagesSelect}
                        className="hidden"
                        id="gallery-images-file-upload"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('gallery-images-file-upload')?.click()}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Gallery Files
                      </Button>
                      {galleryImageFiles.length > 0 && (
                        <div className="mt-2 p-3 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-500 dark:border-emerald-400 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-green-500 rounded-full p-1">
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                              {galleryImageFiles.length} Gallery File{galleryImageFiles.length !== 1 ? 's' : ''} Ready
                            </p>
                          </div>
                          <div className="space-y-1">
                            {galleryImageFiles.map((f, idx) => (
                              <p key={idx} className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                {idx + 1}. {f.name} <span className="text-emerald-600 dark:text-emerald-400">({(f.size / 1024).toFixed(1)} KB)</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <Button
                  type="button"
                  onClick={handleCloseAddProduct}
                  variant="outline"
                  disabled={isSubmitting}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg"
                >
                  {isSubmitting ? 'Creating Product...' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Product Modal - Reuses the same form structure */}
      {showEditProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                Edit Product - {selectedProduct.title}
              </h3>
              <Button
                onClick={handleCloseEditProduct}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="space-y-6">
              {/* The form content will be the same as Add Product, just reusing the form */}
              {/* Basic Information - Same as Add Product Modal */}
              <div className="border dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-slate-100 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Brand <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={productFormData.brandId}
                      onValueChange={(value) => {
                        if (value === 'add_new') {
                          setShowAddBrandModal(true)
                        } else {
                          setProductFormData({...productFormData, brandId: value})
                        }
                      }}
                      required
                    >
                      <SelectTrigger className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add_new" className="text-blue-600 font-semibold">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Brand
                          </div>
                        </SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={productFormData.title}
                      onChange={(e) => setProductFormData({...productFormData, title: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Group SKU <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={productFormData.groupSku}
                      onChange={(e) => setProductFormData({...productFormData, groupSku: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Sub SKU <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Edit sub SKUs with their respective quantities</p>
                    <div className="flex gap-3 mb-2">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Sub SKU</label>
                      </div>
                      <div className="w-40">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Quantity</label>
                      </div>
                      <div className="w-24"></div>
                    </div>
                    <div className="space-y-2">
                      {subSkus.map((item, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-1">
                            <Input
                              type="text"
                              value={item.sku}
                              onChange={(e) => updateSubSku(index, e.target.value)}
                              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                              placeholder={`Sub SKU ${index + 1}`}
                              required={index === 0}
                            />
                          </div>
                          <div className="w-40 flex items-center gap-1">
                            <Button
                              type="button"
                              onClick={() => {
                                const newSubSkus = [...subSkus]
                                const currentQty = parseInt(newSubSkus[index].quantity) || 0
                                newSubSkus[index].quantity = Math.max(0, currentQty - 1).toString()
                                setSubSkus(newSubSkus)
                              }}
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <div className="flex-1 text-center font-semibold text-sm py-2 px-2 border rounded bg-gray-50 dark:bg-gray-700">
                              {item.quantity || '0'}
                            </div>
                            <Button
                              type="button"
                              onClick={() => {
                                const newSubSkus = [...subSkus]
                                const currentQty = parseInt(newSubSkus[index].quantity) || 0
                                newSubSkus[index].quantity = (currentQty + 1).toString()
                                setSubSkus(newSubSkus)
                              }}
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="w-24 flex gap-2">
                            {index === subSkus.length - 1 && (
                              <Button
                                type="button"
                                onClick={addSubSku}
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm flex-1"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                            {index > 0 && (
                              <Button
                                type="button"
                                onClick={() => removeSubSku(index)}
                                size="sm"
                                className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex-1"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
... 1825 lines not shown ...
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={productFormData.category}
                      onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Collection Name
                    </label>
                    <Input
                      type="text"
                      value={productFormData.collectionName}
                      onChange={(e) => setProductFormData({...productFormData, collectionName: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Ship Types
                    </label>
                    <Input
                      type="text"
                      value={productFormData.shipTypes}
                      onChange={(e) => setProductFormData({...productFormData, shipTypes: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      placeholder="e.g. Standard Shipping, White Glove"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Single/Set Item
                    </label>
                    <Select
                      value={productFormData.singleSetItem}
                      onValueChange={(value) => setProductFormData({...productFormData, singleSetItem: value})}
                    >
                      <SelectTrigger className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Item">Single Item</SelectItem>
                        <SelectItem value="Set">Set</SelectItem>
                        <SelectItem value="Part">Part</SelectItem>
                        <SelectItem value="Bundle">Bundle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Pricing Information */}
              <div className="border dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-slate-100 mb-4">Pricing Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Brand Real Price <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.brandRealPrice}
                      onChange={(e) => setProductFormData({...productFormData, brandRealPrice: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Brand Miscellaneous
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.brandMiscellaneous}
                      onChange={(e) => setProductFormData({...productFormData, brandMiscellaneous: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      MSRP <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.msrp}
                      onChange={(e) => setProductFormData({...productFormData, msrp: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Shipping Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.shippingPrice}
                      onChange={(e) => setProductFormData({...productFormData, shippingPrice: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Commission Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.commissionPrice}
                      onChange={(e) => setProductFormData({...productFormData, commissionPrice: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Profit Margin
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.profitMarginPrice}
                      onChange={(e) => setProductFormData({...productFormData, profitMarginPrice: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Ecommerce Miscellaneous
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.ecommerceMiscellaneous}
                      onChange={(e) => setProductFormData({...productFormData, ecommerceMiscellaneous: e.target.value})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                </div>
              </div>
              
              {/* Product Attributes */}
              <div className="border dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-slate-100 mb-4">Product Attributes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Origin</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.origin}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, origin: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Weight (lb)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.attributes.weight_lb}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, weight_lb: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Sub Category</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.sub_category}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, sub_category: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Volume (cuft)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.attributes.volume_cuft}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, volume_cuft: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Short Description</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.short_description}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, short_description: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Shipping Width (in)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.attributes.shipping_width_in}
                      onChange={(e) => handleDimensionChange('shipping_width_in', e.target.value)}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Shipping Height (in)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.attributes.shipping_height_in}
                      onChange={(e) => handleDimensionChange('shipping_height_in', e.target.value)}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Shipping Length (in)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productFormData.attributes.shipping_length_in}
                      onChange={(e) => handleDimensionChange('shipping_length_in', e.target.value)}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Color</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.color}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, color: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Style</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.style}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, style: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Material</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.material}
                      onChange={(e) => setProductFormData({...productFormData, attributes: {...productFormData.attributes, material: e.target.value}})}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Product Dimension (inch) - Auto-calculated</label>
                    <Input
                      type="text"
                      value={productFormData.attributes.product_dimension_inch}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 bg-gray-100 dark:bg-slate-600"
                      placeholder="Auto-calculated from Width × Length × Height"
                      readOnly
                    />
                  </div>
                  
                  {/* Features */}
                  <div className="md:col-span-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900 dark:text-slate-100">Product Features</h5>
                    </div>
                    <div className="space-y-2">
                      {productFeatures.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="text"
                            value={feature}
                            onChange={(e) => updateProductFeature(index, e.target.value)}
                            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                            placeholder={`Feature ${index + 1}`}
                          />
                          {index === productFeatures.length - 1 && (
                            <Button
                              type="button"
                              onClick={addProductFeature}
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {index > 0 && (
                            <Button
                              type="button"
                              onClick={() => removeProductFeature(index)}
                              size="sm"
                              className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Types (Key-Value Pairs) */}
                  <div className="md:col-span-3">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900 dark:text-slate-100">Custom Types</h5>
                      <Button
                        type="button"
                        onClick={addCustomType}
                        size="sm"
                        className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Type
                      </Button>
                    </div>
                    {customTypes.length > 0 && (
                      <div className="space-y-3">
                        {customTypes.map((type, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-700/30 dark:to-slate-700/20 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Key
                              </label>
                              <Input
                                type="text"
                                value={type.key}
                                onChange={(e) => updateCustomType(index, 'key', e.target.value)}
                                className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                                placeholder="e.g., warranty"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Value
                              </label>
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  value={type.value}
                                  onChange={(e) => updateCustomType(index, 'value', e.target.value)}
                                  className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                                  placeholder="e.g., 1 year"
                                />
                                <Button
                                  type="button"
                                  onClick={() => removeCustomType(index)}
                                  size="sm"
                                  className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Images - URL or File Upload */}
              <div className="border dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-lg text-gray-900 dark:text-slate-100 mb-4">Images</h4>
                
                {/* Main Image */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Main Image
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={productFormData.mainImageUrl}
                        onChange={(e) => setProductFormData({...productFormData, mainImageUrl: e.target.value})}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        placeholder="Enter image URL or upload file"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageSelect}
                        className="hidden"
                        id="edit-main-image-file-upload"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('edit-main-image-file-upload')?.click()}
                        size="sm"
                        variant="outline"
                        className="whitespace-nowrap"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </Button>
                    </div>
                    {(mainImageFile || productFormData.mainImageUrl) && (
                      <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-200 dark:border-slate-600">
                        {mainImageFile ? (
                          <>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded border-2 border-emerald-500 dark:border-emerald-400 relative">
                              <Upload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">File Ready to Upload</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                📎 {mainImageFile.name}
                              </p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                {(mainImageFile.size / 1024).toFixed(1)} KB • {mainImageFile.type}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                        <img 
                          src={productFormData.mainImageUrl} 
                          alt="Main image preview" 
                          className="w-10 h-10 rounded-full object-cover rounded border border-gray-300 dark:border-slate-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23ddd" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                🔗 URL provided
                          </p>
                        </div>
                          </>
                        )}
                        <Button
                          type="button"
                          onClick={() => {
                            setProductFormData({...productFormData, mainImageUrl: ''})
                            setMainImageFile(null)
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Gallery Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Gallery Images
                  </label>
                  <div className="space-y-2">
                    {productFormData.galleryImages.map((url, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newGallery = [...productFormData.galleryImages]
                              newGallery[index] = e.target.value
                              setProductFormData({...productFormData, galleryImages: newGallery})
                            }}
                            className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                            placeholder={`Gallery image ${index + 1} URL`}
                          />
                          {index === productFormData.galleryImages.length - 1 && (
                            <Button
                              type="button"
                              onClick={() => setProductFormData({...productFormData, galleryImages: [...productFormData.galleryImages, '']})}
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {productFormData.galleryImages.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => {
                                const newGallery = productFormData.galleryImages.filter((_, i) => i !== index)
                                setProductFormData({...productFormData, galleryImages: newGallery})
                              }}
                              size="sm"
                              className="bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {url && url.trim() !== '' && (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700/30 rounded border border-gray-200 dark:border-slate-600 ml-2">
                            <img 
                              src={url} 
                              alt={`Gallery ${index + 1}`}
                              className="w-12 h-12 object-cover rounded border border-gray-300 dark:border-slate-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd" width="48" height="48"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3EError%3C/text%3E%3C/svg%3E'
                              }}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Preview {index + 1}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryImagesSelect}
                        className="hidden"
                        id="edit-gallery-images-file-upload"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('edit-gallery-images-file-upload')?.click()}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Gallery Files
                      </Button>
                      {galleryImageFiles.length > 0 && (
                        <div className="mt-2 p-3 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-500 dark:border-emerald-400 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-green-500 rounded-full p-1">
                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                              {galleryImageFiles.length} Gallery File{galleryImageFiles.length !== 1 ? 's' : ''} Ready
                            </p>
                          </div>
                          <div className="space-y-1">
                            {galleryImageFiles.map((f, idx) => (
                              <p key={idx} className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                {idx + 1}. {f.name} <span className="text-emerald-600 dark:text-emerald-400">({(f.size / 1024).toFixed(1)} KB)</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <Button
                  type="button"
                  onClick={handleCloseEditProduct}
                  variant="outline"
                  disabled={isSubmitting}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
                >
                  {isSubmitting ? 'Updating Product...' : 'Update Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-500" />
                Confirm Delete
              </h3>
              <Button
                onClick={handleCancelDelete}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={isDeleting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete this product?
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {selectedProduct.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    SKU: {selectedProduct.groupSku} / {selectedProduct.subSku}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ⚠️ This action cannot be undone. The product will be permanently deleted.
              </p>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  To confirm deletion, type the product title: <span className="font-semibold text-gray-900 dark:text-slate-100">{selectedProduct.title}</span>
                </label>
                <Input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type product title here"
                  className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                  disabled={isDeleting}
                  autoFocus
                />
                {deleteConfirmText && deleteConfirmText !== selectedProduct.title && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    ⚠️ Title does not match
                  </p>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <Button
                  onClick={handleCancelDelete}
                  variant="outline"
                  disabled={isDeleting}
                  className="hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || deleteConfirmText !== selectedProduct.title}
                  className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Product'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Add Products Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                Bulk Add Products
              </h3>
              <Button
                onClick={handleCloseBulkModal}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Add Product Form */}
            <div className="border dark:border-slate-700 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-3">Add Product to List</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title</label>
                  <Input
                    type="text"
                    value={productFormData.title}
                    onChange={(e) => setProductFormData({...productFormData, title: e.target.value})}
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    placeholder="Product title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Group SKU</label>
                  <Input
                    type="text"
                    value={productFormData.groupSku}
                    onChange={(e) => setProductFormData({...productFormData, groupSku: e.target.value})}
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    placeholder="Group SKU"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Sub SKU</label>
                  <Input
                    type="text"
                    value={productFormData.subSku}
                    onChange={(e) => setProductFormData({...productFormData, subSku: e.target.value})}
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    placeholder="Sub SKU"
                  />
                </div>
              </div>
              <Button
                onClick={addBulkProduct}
                disabled={!productFormData.title.trim() || !productFormData.groupSku.trim() || !productFormData.subSku.trim()}
                className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                Add to List
              </Button>
            </div>

            {/* Products List */}
            {bulkProducts.length > 0 && (
              <div className="border dark:border-slate-700 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-3">Products to Create ({bulkProducts.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {bulkProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded">
                      <div>
                        <span className="font-medium">{product.title}</span>
                        <span className="text-sm text-gray-600 dark:text-slate-400 ml-2">- {product.groupSku} / {product.subSku}</span>
                      </div>
                      <Button
                        onClick={() => removeBulkProduct(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                onClick={handleCloseBulkModal}
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkCreate}
                disabled={isSubmitting || bulkProducts.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Creating...' : `Create ${bulkProducts.length} Products`}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Import Products Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                Import Products from File
              </h3>
              <Button
                onClick={handleCloseImportModal}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* File Requirements */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">File Requirements</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Supported formats:</strong> CSV, Excel (.xls, .xlsx)</li>
                    <li>• <strong>File size limit:</strong> 10MB maximum</li>
                    <li>• <strong>Required columns:</strong> title, groupSku, subSku, category, brandRealPrice, msrp</li>
                    <li>• <strong>CSV format:</strong> First row should contain column headers</li>
                    <li>• <strong>Excel format:</strong> Column headers in first row</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sample Download */}
            <div className="mb-4">
              <Button
                onClick={downloadSampleCSV}
                variant="outline"
                size="sm"
                className="text-indigo-600 hover:text-indigo-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed dark:border-slate-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleImportFileSelect}
                className="hidden"
                id="import-file-upload"
              />
              <label
                htmlFor="import-file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-gray-600 dark:text-slate-400">
                  {importFile ? importFile.name : 'Click to select file or drag and drop'}
                </span>
                <span className="text-sm text-gray-500 dark:text-slate-500">
                  CSV, Excel files up to 10MB
                </span>
              </label>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button
                onClick={handleCloseImportModal}
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFileImport}
                disabled={isSubmitting || !importFile}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? 'Importing...' : 'Import File'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Results Modal */}
      {bulkResults && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Operation Results
              </h3>
              <Button
                onClick={() => setBulkResults(null)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Summary */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-2">Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-slate-400">Total:</span>
                  <span className="ml-1 font-medium">{bulkResults.summary.total}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-slate-400">Created:</span>
                  <span className="ml-1 font-medium text-green-600">{bulkResults.summary.created}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-slate-400">Duplicates:</span>
                  <span className="ml-1 font-medium text-yellow-600">{bulkResults.summary.duplicates}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-slate-400">Errors:</span>
                  <span className="ml-1 font-medium text-red-600">{bulkResults.summary.errors}</span>
                </div>
              </div>
            </div>

            {/* Created Products */}
            {bulkResults.results.created.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-2">Successfully Created</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {bulkResults.results.created.map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      <span className="text-green-800 dark:text-green-200">{product.title}</span>
                      <span className="text-xs text-green-600 dark:text-green-400">✓ Created</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {bulkResults.results.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-2">Errors</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {bulkResults.results.errors.map((error: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      <span className="text-red-800 dark:text-red-200">{error.product || `Row ${index + 1}`}</span>
                      <span className="text-xs text-red-600 dark:text-red-400">✗ {error.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setBulkResults(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add New Brand Modal */}
      {showAddBrandModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Add New Brand
              </h3>
              <Button
                onClick={() => {
                  setShowAddBrandModal(false)
                  setNewBrandName('')
                  setError(null)
                }}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                  placeholder="Enter brand name"
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddBrandModal(false)
                    setNewBrandName('')
                    setError(null)
                  }}
                  variant="outline"
                  className="hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddNewBrand}
                  className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-lg"
                  disabled={!newBrandName.trim()}
                >
                  Add Brand
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Preview Modal */}
      {showImagePreview && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4"
          onClick={closeImagePreview}
        >
          <div className="relative max-w-5xl w-full">
            <Button
              onClick={closeImagePreview}
              variant="ghost"
              size="sm"
              className="absolute -top-12 right-0 h-10 w-10 p-0 bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {previewImageTitle}
                </h3>
              </div>
              <div className="p-4 flex justify-center items-center bg-gray-50 dark:bg-slate-900">
                <img
                  src={getProxiedImageUrl(previewImageUrl) || ''}
                  alt={previewImageTitle}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Gallery Carousel Modal */}
      {showGalleryModal && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={closeGalleryModal}
        >
          <div className="relative max-w-6xl w-full">
            {/* Close Button */}
            <Button
              onClick={closeGalleryModal}
              variant="ghost"
              size="sm"
              className="absolute -top-12 right-0 h-10 w-10 p-0 bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="h-6 w-6" />
            </Button>
            
            {/* Modal Content */}
            <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b dark:border-slate-700 bg-gradient-to-r from-cyan-500 to-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Images className="h-5 w-5" />
                      Gallery Images
                    </h3>
                    <p className="text-sm text-white/90 mt-1">{galleryTitle}</p>
                  </div>
                  <div className="text-white bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    {currentGalleryIndex + 1} / {galleryImages.length}
                  </div>
                </div>
              </div>
              
              {/* Image Display */}
              <div className="relative bg-gray-50 dark:bg-slate-900">
                <div className="p-8 flex justify-center items-center min-h-[60vh]">
                  <img
                    src={getProxiedImageUrl(galleryImages[currentGalleryIndex]) || ''}
                    alt={`${galleryTitle} - Image ${currentGalleryIndex + 1}`}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                {/* Navigation Buttons */}
                {galleryImages.length > 1 && (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        prevGalleryImage()
                      }}
                      variant="ghost"
                      size="lg"
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 p-0 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        nextGalleryImage()
                      }}
                      variant="ghost"
                      size="lg"
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 p-0 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {galleryImages.length > 1 && (
                <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {galleryImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentGalleryIndex(index)
                        }}
                        className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                          index === currentGalleryIndex
                            ? 'border-cyan-500 ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-800'
                            : 'border-gray-300 dark:border-gray-600 hover:border-cyan-400'
                        }`}
                      >
                        <img
                          src={getProxiedImageUrl(img) || ''}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-20 h-20 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Add to Listings Modal */}
      {showListingsModal && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={handleCloseListings}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b dark:border-slate-700 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  Add to Listings
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  Configure {listingsData.length} product{listingsData.length !== 1 ? 's' : ''} for listing
                </p>
              </div>
              <Button
                onClick={handleCloseListings}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-8">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
                  {error}
                </div>
              )}
              
              {/* Combination Suggestions */}
              {combinationSuggestions.length > 0 && (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                      Suggested Combinations
                    </h3>
                    <Badge className="bg-violet-600 text-white">
                      {combinationSuggestions.length} combinations
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Select a combination to create a bundled listing, or keep individual listings below
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {combinationSuggestions.map((combo) => (
                      <div
                        key={combo.id}
                        onClick={() => handleSelectCombination(combo.id)}
                        className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                          selectedCombination === combo.id
                            ? 'border-violet-500 bg-violet-100 dark:bg-violet-900/40 shadow-lg'
                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {combo.productCount} Products
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 line-clamp-2 mb-2">
                          {combo.title}
                        </p>
                        <div className="space-y-1 text-xs text-gray-600 dark:text-slate-400">
                          <p><span className="font-medium">Group SKU:</span> {combo.groupSku}</p>
                          <p><span className="font-medium">Sub SKUs:</span> {combo.subSkus.length}</p>
                          <p><span className="font-medium">Total MSRP:</span> ${combo.msrp?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t dark:border-slate-700">
                          <p className="text-xs text-gray-500 dark:text-slate-500">
                            Includes: {combo.products.map((p: Product) => p.title).join(', ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedCombination !== null && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✓ Combination selected. The form below shows the combined listing details.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {listingsData.map((listing, listingIndex) => (
                <div key={listingIndex} className="border dark:border-slate-700 rounded-lg p-6 space-y-6">
                  {/* Product Header */}
                  <div className="flex items-start gap-4 pb-4 border-b dark:border-slate-700">
                    {listing.mainImageUrl && (
                      <img 
                        src={listing.mainImageUrl} 
                        alt={listing.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                        Product {listingIndex + 1}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                        {listing.title}
                      </p>
                    </div>
                  </div>
                  
                  {/* SKU Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Custom SKU Prefix */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Custom SKU Prefix (Optional)
                      </label>
                      <Input
                        type="text"
                        value={listing.customSku}
                        onChange={(e) => updateListingData(listingIndex, 'customSku', e.target.value)}
                        placeholder="Enter prefix"
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        Add a custom prefix to the Group SKU
                      </p>
                    </div>
                    
                    {/* Group SKU */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Group SKU
                      </label>
                      <Input
                        type="text"
                        value={listing.Sku}
                        onChange={(e) => updateListingData(listingIndex, 'Sku', e.target.value)}
                        placeholder="Group SKU"
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {listing.originalGroupSku ? (
                          <>
                            <span className="font-medium text-violet-600 dark:text-violet-400">{listing.originalGroupSku}</span> is protected. You can add characters after it.
                          </>
                        ) : (
                          'Enter or extend the Group SKU'
                        )}
                      </p>
                      {listing.customSku && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Final SKU: {listing.customSku}{listing.Sku}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Sub SKUs with Increment/Decrement */}
                  {listing.subSkus && listing.subSkus.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                        Sub SKUs (Select quantities)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {listing.subSkus.map((subSku: any, subSkuIndex: number) => (
                          <div key={subSkuIndex} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                                {subSku.sku}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleSubSkuQuantityChange(listingIndex, subSkuIndex, -1)}
                                className="h-8 w-8 p-0"
                                disabled={subSku.quantity === 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-12 text-center font-medium text-gray-900 dark:text-slate-100">
                                {subSku.quantity}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleSubSkuQuantityChange(listingIndex, subSkuIndex, 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                        Only sub SKUs with quantity {'>'} 0 will be included in the listing
                      </p>
                    </div>
                  )}
                  
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Brand Name
                      </label>
                      <Input
                        type="text"
                        value={listing.brandName}
                        onChange={(e) => updateListingData(listingIndex, 'brandName', e.target.value)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Category
                      </label>
                      <Input
                        type="text"
                        value={listing.category}
                        onChange={(e) => updateListingData(listingIndex, 'category', e.target.value)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Collection Name
                      </label>
                      <Input
                        type="text"
                        value={listing.collectionName}
                        onChange={(e) => updateListingData(listingIndex, 'collectionName', e.target.value)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Title
                    </label>
                    <Input
                      type="text"
                      value={listing.title}
                      onChange={(e) => updateListingData(listingIndex, 'title', e.target.value)}
                      className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                    />
                  </div>
                  
                  {/* Pricing Information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Brand Real Price
                      </label>
                      <Input
                        type="number"
                        value={listing.brandRealPrice}
                        onChange={(e) => updateListingData(listingIndex, 'brandRealPrice', parseFloat(e.target.value) || 0)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Brand Misc
                      </label>
                      <Input
                        type="number"
                        value={listing.brandMiscellaneous}
                        onChange={(e) => updateListingData(listingIndex, 'brandMiscellaneous', parseFloat(e.target.value) || 0)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        MSRP
                      </label>
                      <Input
                        type="number"
                        value={listing.msrp}
                        onChange={(e) => updateListingData(listingIndex, 'msrp', parseFloat(e.target.value) || 0)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Shipping Price
                      </label>
                      <Input
                        type="number"
                        value={listing.shippingPrice}
                        onChange={(e) => updateListingData(listingIndex, 'shippingPrice', parseFloat(e.target.value) || 0)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Commission Price
                      </label>
                      <Input
                        type="number"
                        value={listing.commissionPrice}
                        onChange={(e) => updateListingData(listingIndex, 'commissionPrice', parseFloat(e.target.value) || 0)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Profit Margin
                      </label>
                      <Input
                        type="number"
                        value={listing.profitMarginPrice}
                        onChange={(e) => updateListingData(listingIndex, 'profitMarginPrice', parseFloat(e.target.value) || 0)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Ecommerce Misc
                      </label>
                      <Input
                        type="number"
                        value={listing.ecommerceMiscellaneous}
                        onChange={(e) => updateListingData(listingIndex, 'ecommerceMiscellaneous', parseFloat(e.target.value) || 0)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                  </div>
                  
                  {/* Shipping & Item Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Ship Types
                      </label>
                      <Input
                        type="text"
                        value={listing.shipTypes}
                        onChange={(e) => updateListingData(listingIndex, 'shipTypes', e.target.value)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Single/Set Item
                      </label>
                      <Input
                        type="text"
                        value={listing.singleSetItem}
                        onChange={(e) => updateListingData(listingIndex, 'singleSetItem', e.target.value)}
                        className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                      />
                    </div>
                  </div>
                  
                  {/* Attributes */}
                  <div className="border-t dark:border-slate-700 pt-4">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-slate-100 mb-4">
                      Product Attributes
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Sub Category
                        </label>
                        <Input
                          type="text"
                          value={listing.attributes.subCategory}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.subCategory', e.target.value)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Color
                        </label>
                        <Input
                          type="text"
                          value={listing.attributes.color}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.color', e.target.value)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Style
                        </label>
                        <Input
                          type="text"
                          value={listing.attributes.style}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.style', e.target.value)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Material
                        </label>
                        <Input
                          type="text"
                          value={listing.attributes.material}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.material', e.target.value)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Origin
                        </label>
                        <Input
                          type="text"
                          value={listing.attributes.origin}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.origin', e.target.value)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Weight (lb)
                        </label>
                        <Input
                          type="number"
                          value={listing.attributes.weight}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.weight', parseFloat(e.target.value) || 0)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Volume (cu ft)
                        </label>
                        <Input
                          type="number"
                          value={listing.attributes.volume}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.volume', parseFloat(e.target.value) || 0)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Shipping Length (in)
                        </label>
                        <Input
                          type="number"
                          value={listing.attributes.shippingLength}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.shippingLength', parseFloat(e.target.value) || 0)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Shipping Width (in)
                        </label>
                        <Input
                          type="number"
                          value={listing.attributes.shippingWidth}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.shippingWidth', parseFloat(e.target.value) || 0)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Shipping Height (in)
                        </label>
                        <Input
                          type="number"
                          value={listing.attributes.shippingHeight}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.shippingHeight', parseFloat(e.target.value) || 0)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Product Dimension
                        </label>
                        <Input
                          type="text"
                          value={listing.attributes.productDimension}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.productDimension', e.target.value)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Short Description
                        </label>
                        <Input
                          type="text"
                          value={listing.attributes.shortDescription}
                          onChange={(e) => updateListingData(listingIndex, 'attributes.shortDescription', e.target.value)}
                          className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 p-6 flex justify-end gap-3">
              <Button
                onClick={handleCloseListings}
                variant="outline"
                disabled={isSubmittingListings}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitListings}
                className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white"
                disabled={isSubmittingListings}
              >
                {isSubmittingListings ? 'Submitting...' : `Submit ${listingsData.length} Listing${listingsData.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fullscreen Image Modal */}
      {showFullscreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowFullscreenImage(false)}
        >
          <div className="relative max-w-7xl w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-4">
              <h3 className="text-xl font-semibold text-white">{fullscreenImageTitle}</h3>
              <Button
                onClick={() => setShowFullscreenImage(false)}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Image */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={getProxiedImageUrl(fullscreenImageUrl) || ''}
                alt={fullscreenImageTitle}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Instructions */}
            <div className="text-center text-white/70 text-sm mt-4">
              Click anywhere outside the image to close
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
