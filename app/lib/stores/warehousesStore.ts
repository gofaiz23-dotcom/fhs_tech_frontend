import { create } from 'zustand';

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  capacity: number;
  isActive: boolean;
}

interface WarehousesStore {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  
  // Warehouse methods
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => void;
  removeWarehouse: (id: string) => void;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => void;
  getWarehouse: (id: string) => Warehouse | undefined;
  clearWarehouses: () => void;
  
  // State methods
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWarehousesStore = create<WarehousesStore>()((set, get) => ({
  warehouses: [],
  loading: false,
  error: null,

  addWarehouse: (warehouseData) => {
    const newWarehouse: Warehouse = {
      ...warehouseData,
      id: crypto.randomUUID(),
    };
    
    set((state) => ({
      warehouses: [...state.warehouses, newWarehouse],
    }));
  },

  removeWarehouse: (id) => {
    set((state) => ({
      warehouses: state.warehouses.filter(warehouse => warehouse.id !== id),
    }));
  },

  updateWarehouse: (id, updates) => {
    set((state) => ({
      warehouses: state.warehouses.map(warehouse =>
        warehouse.id === id ? { ...warehouse, ...updates } : warehouse
      ),
    }));
  },

  getWarehouse: (id) => {
    return get().warehouses.find(warehouse => warehouse.id === id);
  },

  clearWarehouses: () => {
    set({ warehouses: [] });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setError: (error) => {
    set({ error });
  },
}));
