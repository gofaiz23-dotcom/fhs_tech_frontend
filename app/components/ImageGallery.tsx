"use client"

import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { Button } from './ui/button'

interface ImageGalleryProps {
  images: string[]
  title: string
  isOpen: boolean
  onClose: () => void
  getProxiedImageUrl?: (imageUrl: string | null | undefined) => string | null
  className?: string
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  title,
  isOpen,
  onClose,
  getProxiedImageUrl,
  className = ""
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }

    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevImage()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextImage()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, images.length])

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  if (!isOpen || !images || images.length === 0) return null

  // Default proxy function if none provided
  const defaultGetProxiedImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl || typeof imageUrl !== 'string') return null
    return imageUrl
  }

  const proxyFunction = getProxiedImageUrl || defaultGetProxiedImageUrl

  return (
    <div 
      className={`fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4 ${className}`}
      onClick={onClose}
    >
      <div className="relative max-w-6xl w-full">
        {/* Close Button */}
        <Button
          onClick={onClose}
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
                <p className="text-sm text-white/90 mt-1">{title}</p>
              </div>
              <div className="text-white bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          </div>
          
          {/* Image Display */}
          <div className="relative bg-gray-50 dark:bg-slate-900">
            <div className="p-8 flex justify-center items-center min-h-[60vh]">
              {proxyFunction(images[currentIndex]) && (
                <img
                  src={proxyFunction(images[currentIndex])!}
                  alt={`${title} - Image ${currentIndex + 1}`}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            
            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
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
                    nextImage()
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
          
          {/* Thumbnail Strip - Image Picker at Bottom */}
          {images.length > 1 && (
            <div className="p-4 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      goToImage(index)
                    }}
                    className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-cyan-500 ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-800'
                        : 'border-gray-300 dark:border-gray-600 hover:border-cyan-400'
                    }`}
                  >
                    {proxyFunction(img) && (
                      <img
                        src={proxyFunction(img)!}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-16 h-16 object-cover"
                        onError={(e) => {
                          console.error('❌ Thumbnail failed to load:', img)
                          console.error('Proxied URL:', proxyFunction(img))
                        }}
                        onLoad={() => {
                          console.log('✓ Thumbnail loaded successfully:', img)
                        }}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageGallery
