"use client";
import React from "react";
import { useWarehousesStore, Warehouse } from '../../lib/stores/warehousesStore';

interface WarehouseContextType {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addWarehouse: (data: Omit<Warehouse, "id">) => Promise<void>;
  updateWarehouse: (id: string, data: Omit<Warehouse, "id">) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
}

const WarehouseContext = React.createContext<WarehouseContextType | null>(null);

export function useWarehouses() {
  const ctx = React.useContext(WarehouseContext);
  if (!ctx) throw new Error("useWarehouses must be used within WarehouseProvider");
  return ctx;
}

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const { 
    warehouses, 
    loading, 
    error, 
    addWarehouse: addWarehouseToStore, 
    removeWarehouse, 
    updateWarehouse: updateWarehouseInStore, 
    setLoading, 
    setError 
  } = useWarehousesStore();

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      // Example placeholder:
      // const res = await fetch(`/api/warehouses`);
      // const data = await res.json();
      // setWarehouses(data);
      // No need to load from storage - Zustand handles state
    } catch (e: any) {
      setError(e?.message || "Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  };

  const addWarehouse = async (data: Omit<Warehouse, "id">) => {
    setLoading(true);
    setError(null);
    try {
      // API: POST /warehouses with body `data`
      // const res = await fetch(`/api/warehouses`, { method: 'POST', body: JSON.stringify(data) })
      // const created = await res.json();
      // addWarehouseToStore(created)
      addWarehouseToStore(data);
    } catch (e: any) {
      setError(e?.message || "Failed to add warehouse");
    } finally {
      setLoading(false);
    }
  };

  const updateWarehouse = async (id: string, data: Omit<Warehouse, "id">) => {
    setLoading(true);
    setError(null);
    try {
      // API: PUT /warehouses/:id with body `data`
      // const res = await fetch(`/api/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      // const updated = await res.json();
      // updateWarehouseInStore(id, updated)
      updateWarehouseInStore(id, data);
    } catch (e: any) {
      setError(e?.message || "Failed to update warehouse");
    } finally {
      setLoading(false);
    }
  };

  const deleteWarehouse = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // API: DELETE /warehouses/:id
      // await fetch(`/api/warehouses/${id}`, { method: 'DELETE' })
      // removeWarehouse(id)
      removeWarehouse(id);
    } catch (e: any) {
      setError(e?.message || "Failed to delete warehouse");
    } finally {
      setLoading(false);
    }
  };

  const value: WarehouseContextType = {
    warehouses,
    loading,
    error,
    refresh,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
  };

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  );
}