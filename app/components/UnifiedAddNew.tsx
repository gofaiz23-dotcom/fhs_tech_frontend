"use client"

import React from 'react';
import { Plus, Store, Package, Truck, Upload, FileText, ImagePlus } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface UnifiedAddNewProps {
  // Marketplace props
  onAddMarketplace?: () => void;
  onBulkAddMarketplace?: () => void;
  onImportMarketplace?: () => void;
  // Brand props
  onAddBrand?: () => void;
  onBulkAddBrand?: () => void;
  onImportBrand?: () => void;
  // Shipping props
  onAddShipping?: () => void;
  onBulkAddShipping?: () => void;
  onImportShipping?: () => void;
  // Product props
  onAddProduct?: () => void;
  onBulkAddProduct?: () => void;
  onImportProduct?: () => void;
  onBulkImagesProduct?: () => void;
  // Listings props
  onAddListing?: () => void;
  onBulkAddListing?: () => void;
  onImportListing?: () => void;
  onBulkImagesListing?: () => void;
  // Platform type to determine which tabs to show
  platformType?: 'marketplace' | 'brands' | 'shipping' | 'products' | 'listings';
  className?: string;
}

const UnifiedAddNew: React.FC<UnifiedAddNewProps> = ({
  onAddMarketplace,
  onBulkAddMarketplace,
  onImportMarketplace,
  onAddBrand,
  onBulkAddBrand,
  onImportBrand,
  onAddShipping,
  onBulkAddShipping,
  onImportShipping,
  onAddProduct,
  onBulkAddProduct,
  onImportProduct,
  onBulkImagesProduct,
  onAddListing,
  onBulkAddListing,
  onImportListing,
  onBulkImagesListing,
  platformType = 'marketplace',
  className = ""
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className={`btn-primary ${className}`}>
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Add New Item</h4>
            {/* <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose the type of item you want to add
            </p> */}
          </div>
          
          <Tabs defaultValue={platformType} className="w-full">
            {/* <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value={platformType} className="text-xs">
                {platformType === 'marketplace' && (
                  <>
                    <Store className="w-3 h-3 mr-1" />
                    Marketplace
                  </>
                )}
                {platformType === 'brands' && (
                  <>
                    <Package className="w-3 h-3 mr-1" />
                    Brands
                  </>
                )}
                {platformType === 'shipping' && (
                  <>
                    <Truck className="w-3 h-3 mr-1" />
                    Shipping
                  </>
                )}
              </TabsTrigger>
            </TabsList> */}
            
            <TabsContent value={platformType} className="space-y-3 mt-4">
              <div className="space-y-2">
                {platformType === 'marketplace' && (
                  <>
                    <Button
                      onClick={() => {
                        onAddMarketplace?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Marketplace
                    </Button>
                    <Button
                      onClick={() => {
                        onBulkAddMarketplace?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Bulk Add
                    </Button>
                    <Button
                      onClick={() => {
                        onImportMarketplace?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import File
                    </Button>
                  </>
                )}
                
                {platformType === 'brands' && (
                  <>
                    <Button
                      onClick={() => {
                        onAddBrand?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Brand
                    </Button>
                    <Button
                      onClick={() => {
                        onBulkAddBrand?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Bulk Add
                    </Button>
                    <Button
                      onClick={() => {
                        onImportBrand?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import File
                    </Button>
                  </>
                )}
                
                {platformType === 'shipping' && (
                  <>
                    <Button
                      onClick={() => {
                        onAddShipping?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Platform
                    </Button>
                    <Button
                      onClick={() => {
                        onBulkAddShipping?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Bulk Add
                    </Button>
                    <Button
                      onClick={() => {
                        onImportShipping?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import File
                    </Button>
                  </>
                )}
                
                {platformType === 'products' && (
                  <>
                    <Button
                      onClick={() => {
                        onAddProduct?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Product
                    </Button>
                    <Button
                      onClick={() => {
                        onBulkAddProduct?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Bulk Add
                    </Button>
                    <Button
                      onClick={() => {
                        onImportProduct?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import File
                    </Button>
                    <Button
                      onClick={() => {
                        onBulkImagesProduct?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <ImagePlus className="w-4 h-4 mr-2" />
                      Add Bulk Images
                    </Button>
                  </>
                )}
                
                {platformType === 'listings' && (
                  <>
                    <Button
                      onClick={() => {
                        onAddListing?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Listing
                    </Button>
                    <Button
                      onClick={() => {
                        onBulkAddListing?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Bulk Add
                    </Button>
                    <Button
                      onClick={() => {
                        onImportListing?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import File
                    </Button>
                    <Button
                      onClick={() => {
                        onBulkImagesListing?.();
                        setOpen(false);
                      }}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <ImagePlus className="w-4 h-4 mr-2" />
                      Add Bulk Images
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UnifiedAddNew;
