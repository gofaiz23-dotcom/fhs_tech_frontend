"use client"

/**
 * Inventory Component
 * 
 * Comprehensive inventory management with filters, search, pagination,
 * and bulk update capabilities
 */

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Download, Plus, Info, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Maximize2, Minimize2, Upload, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/hooks/use-toast'
import { InventoryService, type InventoryItem, type Brand, type UpdateInventoryRequest } from '../lib/inventory/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import './table-scroll.css'

const Inventory = () => {
  const { state } = useAuth()
  const { toast } = useToast()
  
  // State management
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Column resize state
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  
  // Expanded cells state
  const [expandedCells, setExpandedCells] = useState<{ [key: string]: boolean }>({})
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    quantity: '',
    eta: ''
  })
  
  // Bulk update state
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkResults, setBulkResults] = useState<any>(null)
  
  // Selected rows state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  
  // Drag and scroll functionality
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
    
    const friction = 0.92
    velocity.current.x *= friction
    velocity.current.y *= friction
    
    if (Math.abs(velocity.current.x) < 0.3 && Math.abs(velocity.current.y) < 0.3) {
      velocity.current = { x: 0, y: 0 }
      if (momentumAnimation.current) {
        cancelAnimationFrame(momentumAnimation.current)
        momentumAnimation.current = null
      }
      return
    }
    
    container.scrollLeft -= velocity.current.x
    container.scrollTop -= velocity.current.y
    
    momentumAnimation.current = requestAnimationFrame(applyMomentum)
  }
  
  // Mouse event handlers for drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = tableRef.current
    if (!container) return
    
    if (e.target instanceof HTMLElement) {
      const isButton = e.target.closest('button') || e.target.tagName === 'BUTTON'
      const isInput = e.target.closest('input') || e.target.tagName === 'INPUT'
      const isCheckbox = e.target.closest('input[type="checkbox"]')
      if (isButton || isInput || isCheckbox) return
    }
    
    setIsDragging(true)
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop
    }
    lastPos.current = { x: e.clientX, y: e.clientY, time: Date.now() }
    velocity.current = { x: 0, y: 0 }
    
    if (momentumAnimation.current) {
      cancelAnimationFrame(momentumAnimation.current)
      momentumAnimation.current = null
    }
    
    container.style.cursor = 'grabbing'
    container.style.userSelect = 'none'
    e.preventDefault()
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const container = tableRef.current
    if (!container) return
    
    const dx = e.clientX - dragStartPos.current.x
    const dy = e.clientY - dragStartPos.current.y
    
    container.scrollLeft = dragStartPos.current.scrollLeft - dx
    container.scrollTop = dragStartPos.current.scrollTop - dy
    
    const now = Date.now()
    const dt = now - lastPos.current.time
    if (dt > 0) {
      velocity.current.x = (e.clientX - lastPos.current.x) / dt * 16
      velocity.current.y = (e.clientY - lastPos.current.y) / dt * 16
    }
    lastPos.current = { x: e.clientX, y: e.clientY, time: now }
  }
  
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      const container = tableRef.current
      if (container) {
        container.style.cursor = 'grab'
        container.style.userSelect = ''
        
        if (Math.abs(velocity.current.x) > 0.5 || Math.abs(velocity.current.y) > 0.5) {
          velocity.current.x *= 0.8
          velocity.current.y *= 0.8
          momentumAnimation.current = requestAnimationFrame(applyMomentum)
        }
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
        
        if (Math.abs(velocity.current.x) > 0.5 || Math.abs(velocity.current.y) > 0.5) {
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
  const [filters, setFilters] = useState({
    search: '',
    brandId: 'all' as string,
    minQuantity: '',
    maxQuantity: ''
  })
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 20
  })
  
  // Filter options
  const [brands, setBrands] = useState<Brand[]>([])
  
  // Load inventory
  const loadInventory = async () => {
    if (!state.accessToken) {
      setError('No access token available')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await InventoryService.getInventory(state.accessToken)
      setInventory(response.inventory)
      
      // Extract unique brands
      const uniqueBrands = Array.from(
        new Map(response.inventory.map(item => [item.brand.id, item.brand])).values()
      )
      setBrands(uniqueBrands)
      
      console.log(`✅ Loaded ${response.inventory.length} inventory items`)
    } catch (err: any) {
      console.error('Failed to load inventory:', err)
      setError(err.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }
  
  // Load data on mount
  useEffect(() => {
    loadInventory()
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
  
  // Apply filters
  useEffect(() => {
    let filtered = [...inventory]
    
    // Search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(item => 
        item.subSku.toLowerCase().includes(searchLower) ||
        item.brand.name.toLowerCase().includes(searchLower) ||
        item.listing.title.toLowerCase().includes(searchLower) ||
        item.listing.sku.toLowerCase().includes(searchLower)
      )
    }
    
    // Brand filter
    if (filters.brandId !== 'all') {
      filtered = filtered.filter(item => item.brand.id.toString() === filters.brandId)
    }
    
    // Quantity filters
    if (filters.minQuantity) {
      const min = parseInt(filters.minQuantity)
      if (!isNaN(min)) {
        filtered = filtered.filter(item => item.quantity >= min)
      }
    }
    
    if (filters.maxQuantity) {
      const max = parseInt(filters.maxQuantity)
      if (!isNaN(max)) {
        filtered = filtered.filter(item => item.quantity <= max)
      }
    }
    
    setFilteredInventory(filtered)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }, [filters, inventory])
  
  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / pagination.itemsPerPage))
  const currentPage = Math.min(pagination.currentPage, totalPages)
  const startIndex = (currentPage - 1) * pagination.itemsPerPage
  const endIndex = startIndex + pagination.itemsPerPage
  const paginatedInventory = filteredInventory.slice(startIndex, endIndex)
  
  // Handle search
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }
  
  // Handle filter changes
  const handleBrandChange = (value: string) => {
    setFilters(prev => ({ ...prev, brandId: value }))
  }
  
  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      brandId: 'all',
      minQuantity: '',
      maxQuantity: ''
    })
  }
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }
  
  // Info modal handlers
  const handleShowInfo = (item: InventoryItem) => {
    setSelectedInventory(item)
    setShowInfoModal(true)
    document.body.classList.add('modal-open')
  }
  
  const handleCloseInfo = () => {
    setShowInfoModal(false)
    setSelectedInventory(null)
    document.body.classList.remove('modal-open')
  }
  
  // Export to CSV - Exports ALL inventory data (all pages)
  const handleExport = () => {
    // Use filteredInventory to export all filtered data across all pages
    const dataToExport = filteredInventory
    
    if (dataToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "No inventory items to export",
      })
      return
    }
    
    // Show confirmation with total count
    const confirmExport = window.confirm(
      `You are about to export ${dataToExport.length} inventory item(s) (all pages).\n\n` +
      `Do you want to continue?`
    )
    
    if (!confirmExport) {
      return
    }
    
    const headers = [
      'Sub SKU', 'Quantity', 'ETA', 'Listing SKU', 'Listing Title', 'Brand', 'Created', 'Updated'
    ]
    
    const rows = dataToExport.map(item => [
      item.subSku,
      item.quantity.toString(),
      item.eta || 'N/A',
      item.listing.sku,
      item.listing.title,
      item.brand.name,
      new Date(item.createdAt).toLocaleDateString(),
      new Date(item.updatedAt).toLocaleDateString()
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Show success message
    toast({
      variant: "success",
      title: "Export Complete",
      description: `Successfully exported ${dataToExport.length} inventory item(s)!`,
    })
  }
  
  // Edit inventory handler
  const handleEditInventory = (item: InventoryItem) => {
    setSelectedInventory(item)
    setEditFormData({
      quantity: item.quantity.toString(),
      eta: item.eta || ''
    })
    setShowEditModal(true)
    document.body.classList.add('modal-open')
  }
  
  // Save edit
  const handleSaveEdit = async () => {
    if (!state.accessToken || !selectedInventory) {
      setError('No access token or inventory item selected')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      const updateData: UpdateInventoryRequest = {}
      
      if (editFormData.quantity) {
        const quantity = parseInt(editFormData.quantity)
        if (!isNaN(quantity)) {
          updateData.quantity = quantity
        }
      }
      
      if (editFormData.eta) {
        updateData.eta = editFormData.eta
      }
      
      await InventoryService.updateInventory(selectedInventory.id, updateData, state.accessToken)
      
      // Reload inventory
      await loadInventory()
      
      // Close modal
      setShowEditModal(false)
      setSelectedInventory(null)
      document.body.classList.remove('modal-open')
      
      toast({
        variant: "success",
        title: "Update Complete",
        description: "Inventory updated successfully!",
      })
    } catch (err: any) {
      console.error('Failed to update inventory:', err)
      setError(err.message || 'Failed to update inventory')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Bulk update handler
  const handleBulkUpdate = () => {
    setShowBulkUpdateModal(true)
    setBulkFile(null)
    setBulkResults(null)
    document.body.classList.add('modal-open')
  }
  
  // Handle bulk file upload
  const handleBulkFileUpload = async () => {
    if (!bulkFile || !state.accessToken) {
      setError('Please select a file')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      const response = await InventoryService.bulkUpdateInventoryFile(bulkFile, state.accessToken)
      setBulkResults(response)
      
      // Reload inventory
      await loadInventory()
      
      toast({
        variant: "success",
        title: "Bulk Update Complete",
        description: "Bulk update completed successfully!",
      })
    } catch (err: any) {
      console.error('Failed to bulk update inventory:', err)
      setError(err.message || 'Failed to bulk update inventory')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Row selection handlers
  const toggleRowSelection = (id: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }
  
  const toggleAllRows = () => {
    if (selectedRows.size === paginatedInventory.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedInventory.map(item => item.id)))
    }
  }
  
  // Column resize handlers
  const handleResizeStart = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setResizingColumn(columnKey)
    setResizeStartX(e.clientX)
    setResizeStartWidth(columnWidths[columnKey] || 150)
  }
  
  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingColumn) return
    
    const diff = e.clientX - resizeStartX
    const newWidth = Math.max(50, resizeStartWidth + diff)
    
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
  const getColumnWidth = (columnKey: string, defaultWidth: number = 150) => {
    return columnWidths[columnKey] || defaultWidth
  }
  
  // Render expandable cell
  const renderExpandableCell = (content: string, rowId: number, columnKey: string, defaultWidth: number = 150) => {
    const isExpanded = isCellExpanded(rowId, columnKey)
    const currentWidth = getColumnWidth(columnKey, defaultWidth)
    
    const charsPerPixel = 0.12
    const maxChars = Math.floor(currentWidth * charsPerPixel)
    const isTruncated = content.length > maxChars
    
    return (
      <div className="flex items-center gap-2 w-full">
        <div 
          className={`flex-1 ${isExpanded ? 'whitespace-normal break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis'}`}
          title={!isExpanded && isTruncated ? content : undefined}
        >
          {content}
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
              Inventory
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-600"
                disabled={filteredInventory.length === 0}
                title={`Export all ${filteredInventory.length} inventory item(s) to CSV`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export All ({filteredInventory.length})
              </Button>
              
              <Button
                onClick={handleBulkUpdate}
                variant="outline"
                size="sm"
                className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Update
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
                placeholder="Search inventory..."
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
          
          {/* Filters Panel */}
          {showFilters && (
            <Card className="dark:bg-slate-700 dark:border-slate-600">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Brand Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                      Brand
                    </label>
                    <Select value={filters.brandId} onValueChange={handleBrandChange}>
                      <SelectTrigger className="dark:bg-slate-600 dark:text-slate-100 dark:border-slate-500">
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {brands.map(brand => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Min Quantity */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                      Min Quantity
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minQuantity}
                      onChange={(e) => setFilters(prev => ({ ...prev, minQuantity: e.target.value }))}
                      className="dark:bg-slate-600 dark:text-slate-100 dark:border-slate-500"
                    />
                  </div>
                  
                  {/* Max Quantity */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                      Max Quantity
                    </label>
                    <Input
                      type="number"
                      placeholder="999"
                      value={filters.maxQuantity}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxQuantity: e.target.value }))}
                      className="dark:bg-slate-600 dark:text-slate-100 dark:border-slate-500"
                    />
                  </div>
                  
                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                      size="sm"
                      className="w-full dark:bg-slate-600 dark:text-slate-100 dark:border-slate-500"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          {/* Results Count */}
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredInventory.length)} of {filteredInventory.length} items
            {filteredInventory.length > pagination.itemsPerPage && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (Use Export button to download all {filteredInventory.length} items)
              </span>
            )}
          </div>
          
          {/* Inventory Table */}
          <div 
            ref={tableRef}
            className="relative overflow-auto border border-gray-200 dark:border-slate-600 rounded-lg"
            style={{ 
              maxHeight: '600px',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            {...events}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 dark:bg-slate-700 z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedInventory.length && paginatedInventory.length > 0}
                      onChange={toggleAllRows}
                      className="cursor-pointer"
                    />
                  </TableHead>
                  <TableHead style={{ width: getColumnWidth('subSku', 150) }}>
                    <div className="flex items-center justify-between">
                      <span>Sub SKU</span>
                      <div
                        className="resize-handle"
                        onMouseDown={(e) => handleResizeStart('subSku', e)}
                      />
                    </div>
                  </TableHead>
                  {/* <TableHead style={{ width: getColumnWidth('listingSku', 150) }}>
                    <div className="flex items-center justify-between">
                      <span>Listing SKU</span>
                      <div
                        className="resize-handle"
                        onMouseDown={(e) => handleResizeStart('listingSku', e)}
                      />
                    </div>
                  </TableHead>
                  <TableHead style={{ width: getColumnWidth('listingTitle', 250) }}>
                    <div className="flex items-center justify-between">
                      <span>Listing Title</span>
                      <div
                        className="resize-handle"
                        onMouseDown={(e) => handleResizeStart('listingTitle', e)}
                      />
                    </div>
                  </TableHead>
                  <TableHead style={{ width: getColumnWidth('brand', 150) }}>
                    <div className="flex items-center justify-between">
                      <span>Brand</span>
                      <div
                        className="resize-handle"
                        onMouseDown={(e) => handleResizeStart('brand', e)}
                      />
                    </div>
                  </TableHead> */}
                  <TableHead style={{ width: getColumnWidth('quantity', 100) }}>
                    <div className="flex items-center justify-between">
                      <span>Quantity</span>
                      <div
                        className="resize-handle"
                        onMouseDown={(e) => handleResizeStart('quantity', e)}
                      />
                    </div>
                  </TableHead>
                  <TableHead style={{ width: getColumnWidth('eta', 150) }}>
                    <div className="flex items-center justify-between">
                      <span>ETA</span>
                      <div
                        className="resize-handle"
                        onMouseDown={(e) => handleResizeStart('eta', e)}
                      />
                    </div>
                  </TableHead>
                  {/* <TableHead style={{ width: getColumnWidth('created', 150) }}>
                    <div className="flex items-center justify-between">
                      <span>Created</span>
                      <div
                        className="resize-handle"
                        onMouseDown={(e) => handleResizeStart('created', e)}
                      />
                    </div>
                  </TableHead>
                  <TableHead style={{ width: getColumnWidth('updated', 150) }}>
                    <div className="flex items-center justify-between">
                      <span>Updated</span>
                      <div
                        className="resize-handle"
                        onMouseDown={(e) => handleResizeStart('updated', e)}
                      />
                    </div>
                  </TableHead> */}
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="text-gray-500 dark:text-slate-400">Loading inventory...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-slate-400">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInventory.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item.id)}
                          onChange={() => toggleRowSelection(item.id)}
                          className="cursor-pointer"
                        />
                      </TableCell>
                      <TableCell style={{ width: getColumnWidth('subSku', 150) }}>
                        {renderExpandableCell(item.subSku, item.id, 'subSku', 150)}
                      </TableCell>
                      {/* <TableCell style={{ width: getColumnWidth('listingSku', 150) }}>
                        {renderExpandableCell(item.listing.sku, item.id, 'listingSku', 150)}
                      </TableCell>
                      <TableCell style={{ width: getColumnWidth('listingTitle', 250) }}>
                        {renderExpandableCell(item.listing.title, item.id, 'listingTitle', 250)}
                      </TableCell> */}
                      {/* <TableCell style={{ width: getColumnWidth('brand', 150) }}>
                        <Badge variant="outline" className="dark:border-slate-500 dark:text-slate-300">
                          {item.brand.name}
                        </Badge>
                      </TableCell> */}
                      <TableCell style={{ width: getColumnWidth('quantity', 100) }}>
                        <Badge 
                          variant={item.quantity > 0 ? "default" : "destructive"}
                          className={item.quantity > 0 ? "bg-green-500" : ""}
                        >
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ width: getColumnWidth('eta', 150) }}>
                        {item.eta || '-'}
                      </TableCell>
                      {/* <TableCell style={{ width: getColumnWidth('created', 150) }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell style={{ width: getColumnWidth('updated', 150) }}>
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </TableCell> */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* <Button
                            onClick={() => handleShowInfo(item)}
                            variant="ghost"
                            size="sm"
                            title="View Details"
                          >
                            <Info className="h-4 w-4" />
                          </Button> */}
                          <Button
                            onClick={() => handleEditInventory(item)}
                            variant="ghost"
                            size="sm"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
              
              <Select
                value={pagination.itemsPerPage.toString()}
                onValueChange={(value) => setPagination(prev => ({ ...prev, itemsPerPage: parseInt(value), currentPage: 1 }))}
              >
                <SelectTrigger className="w-20 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Info Modal */}
      {showInfoModal && selectedInventory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Inventory Details</h2>
                <Button onClick={handleCloseInfo} variant="ghost" size="sm">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Sub SKU</label>
                    <p className="text-gray-900 dark:text-slate-100">{selectedInventory.subSku}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Listing SKU</label>
                    <p className="text-gray-900 dark:text-slate-100">{selectedInventory.listing.sku}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Listing Title</label>
                    <p className="text-gray-900 dark:text-slate-100">{selectedInventory.listing.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Brand</label>
                    <p className="text-gray-900 dark:text-slate-100">{selectedInventory.brand.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Quantity</label>
                    <p className="text-gray-900 dark:text-slate-100">{selectedInventory.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">ETA</label>
                    <p className="text-gray-900 dark:text-slate-100">{selectedInventory.eta || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Created</label>
                    <p className="text-gray-900 dark:text-slate-100">{new Date(selectedInventory.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Updated</label>
                    <p className="text-gray-900 dark:text-slate-100">{new Date(selectedInventory.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && selectedInventory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Edit Inventory</h2>
                <Button 
                  onClick={() => {
                    setShowEditModal(false)
                    document.body.classList.remove('modal-open')
                  }} 
                  variant="ghost" 
                  size="sm"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                    Sub SKU
                  </label>
                  <Input
                    value={selectedInventory.subSku}
                    disabled
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                    ETA
                  </label>
                  <Input
                    type="date"
                    value={editFormData.eta}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, eta: e.target.value }))}
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                  />
                </div>
                
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    onClick={() => {
                      setShowEditModal(false)
                      document.body.classList.remove('modal-open')
                    }}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Bulk Update Inventory</h2>
                <Button 
                  onClick={() => {
                    setShowBulkUpdateModal(false)
                    document.body.classList.remove('modal-open')
                  }} 
                  variant="ghost" 
                  size="sm"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                    Upload Excel/CSV File
                  </label>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                    File should contain columns: subSku, quantity, eta
                  </p>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                    className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                  />
                </div>
                
                {bulkResults && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-md">
                    <p className="font-medium">Bulk update completed!</p>
                    {bulkResults.summary && (
                      <ul className="mt-2 text-sm">
                        <li>Updated: {bulkResults.summary.updated}</li>
                        <li>Not Found: {bulkResults.summary.notFound}</li>
                        <li>Errors: {bulkResults.summary.errors}</li>
                      </ul>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    onClick={() => {
                      setShowBulkUpdateModal(false)
                      document.body.classList.remove('modal-open')
                    }}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkFileUpload}
                    disabled={!bulkFile || isSubmitting}
                  >
                    {isSubmitting ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
