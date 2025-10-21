/**
 * Example: Using Toast Notifications in Products Component
 * 
 * This file demonstrates how to integrate toast notifications
 * into the bulk image upload and other product operations.
 */

import { useToast } from "@/app/lib/hooks/use-toast"
import { ProductsService } from "./api"

export function ProductsWithToastExample() {
  const { toast } = useToast()

  // Example 1: Download Image Template
  const handleDownloadTemplate = async () => {
    try {
      await ProductsService.downloadImageTemplate(accessToken)
      
      toast({
        variant: "success",
        title: "Template Downloaded",
        description: "Image template has been downloaded successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download template.",
      })
    }
  }

  // Example 2: Bulk Image Upload
  const handleBulkImageUpload = async (file: File) => {
    // Show loading toast
    const loadingToastId = toast({
      title: "Uploading Images",
      description: "Please wait while we process your file...",
    }).id

    try {
      const response = await ProductsService.bulkUploadImages(accessToken, file)
      
      // Dismiss loading toast
      dismiss(loadingToastId)
      
      // Show success toast with details
      toast({
        variant: "success",
        title: "Upload Complete",
        description: `Successfully updated ${response.summary.successful} products. ${
          response.summary.failed > 0 ? `${response.summary.failed} failed.` : ''
        }`,
      })

      // If there's a background job, show additional info
      if (response.jobId) {
        toast({
          title: "Background Processing",
          description: `Job ID: ${response.jobId}. You can check the status page for updates.`,
          duration: 7000,
        })
      }
    } catch (error) {
      dismiss(loadingToastId)
      
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload images.",
      })
    }
  }

  // Example 3: Create Product
  const handleCreateProduct = async (productData: any) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      if (!response.ok) throw new Error('Failed to create product')

      toast({
        variant: "success",
        title: "Product Created",
        description: `${productData.title} has been added successfully.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Could not create product. Please try again.",
      })
    }
  }

  // Example 4: Delete Product with Confirmation
  const handleDeleteProduct = async (productId: number, productName: string) => {
    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' })

      toast({
        variant: "success",
        title: "Product Deleted",
        description: `${productName} has been removed.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete product. Please try again.",
      })
    }
  }

  // Example 5: Form Validation
  const validateForm = (data: any) => {
    if (!data.title) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Product title is required.",
      })
      return false
    }

    if (!data.groupSku) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Group SKU is required.",
      })
      return false
    }

    return true
  }

  // Example 6: API Connection Test
  const testConnection = async () => {
    try {
      const isConnected = await ProductsService.testConnection(accessToken)
      
      if (isConnected) {
        toast({
          variant: "success",
          title: "Connection Successful",
          description: "API is responding correctly.",
        })
      } else {
        toast({
          title: "Connection Warning",
          description: "API connection test returned false.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Could not connect to the API.",
      })
    }
  }

  // Example 7: Batch Operations with Progress
  const handleBatchUpdate = async (products: any[]) => {
    const total = products.length
    let successful = 0
    let failed = 0

    const progressToastId = toast({
      title: "Processing Batch",
      description: `Updating ${total} products...`,
    }).id

    for (const product of products) {
      try {
        await updateProduct(product)
        successful++
      } catch (error) {
        failed++
      }

      // Update progress
      dismiss(progressToastId)
      toast({
        title: "Processing Batch",
        description: `${successful + failed} of ${total} processed...`,
      })
    }

    // Show final result
    dismiss(progressToastId)
    
    if (failed === 0) {
      toast({
        variant: "success",
        title: "Batch Complete",
        description: `All ${successful} products updated successfully.`,
      })
    } else {
      toast({
        variant: "destructive",
        title: "Batch Partial Success",
        description: `${successful} succeeded, ${failed} failed.`,
      })
    }
  }

  return (
    <div>
      {/* Your component JSX */}
    </div>
  )
}

// Helper function placeholders
declare const accessToken: string
declare const dismiss: (id?: string) => void
declare function updateProduct(product: any): Promise<void>

