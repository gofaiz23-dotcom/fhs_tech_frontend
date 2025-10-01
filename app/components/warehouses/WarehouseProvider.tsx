"use client";
import React from "react";

export type Warehouse = {
  id: string;
  name: string;
  address: string;
  inventorySource: string;
};

type WarehouseContextValue = {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  addWarehouse: (data: Omit<Warehouse, "id">) => Promise<void>;
  updateWarehouse: (id: string, data: Omit<Warehouse, "id">) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const WarehouseContext = React.createContext<WarehouseContextValue | undefined>(undefined);

export function useWarehouses() {
  const ctx = React.useContext(WarehouseContext);
  if (!ctx) throw new Error("useWarehouses must be used within WarehouseProvider");
  return ctx;
}

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadFromStorage = () => {
    const data = JSON.parse(localStorage.getItem("fhs_warehouses") || "[]");
    setWarehouses(data);
  };

  React.useEffect(() => {
    loadFromStorage();
  }, []);

  const persist = (next: Warehouse[]) => {
    localStorage.setItem("fhs_warehouses", JSON.stringify(next));
    setWarehouses(next);
  };

  // API INTEGRATION NOTES:
  // Replace the localStorage implementations below with real API calls.
  // 1) Add your base URL and auth headers.
  // 2) Swap out the local updates with fetch/axios calls.
  // 3) On success, update state with the server response.

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      // Example placeholder:
      // const res = await fetch(`/api/warehouses`);
      // const data = await res.json();
      // setWarehouses(data);
      loadFromStorage();
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
      const newItem: Warehouse = { id: crypto.randomUUID(), ...data };
      // API: POST /warehouses with body `data`
      // const res = await fetch(`/api/warehouses`, { method: 'POST', body: JSON.stringify(data) })
      // const created = await res.json();
      // persist([...warehouses, created])
      persist([...warehouses, newItem]);
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
      // API: PUT /warehouses/:id
      // const res = await fetch(`/api/warehouses/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      // const updated = await res.json();
      const next = warehouses.map((w) => (w.id === id ? { ...w, ...data } : w));
      persist(next);
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
      const next = warehouses.filter((w) => w.id !== id);
      persist(next);
    } catch (e: any) {
      setError(e?.message || "Failed to delete warehouse");
    } finally {
      setLoading(false);
    }
  };

  const value: WarehouseContextValue = {
    warehouses,
    loading,
    error,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    refresh,
  };

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}


