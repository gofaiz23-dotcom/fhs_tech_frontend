"use client";
import SettingsLayout from "../_components/SettingsLayout";
import { useWarehouses } from "../../components/warehouses/WarehouseProvider";
import React from "react";

export default function WarehouseLocationsPage() {
  const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse, loading, error } = useWarehouses();
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ 
    name: "", 
    address: "", 
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    capacity: 1000,
    isActive: true
  });

  const onChange = (k: "name" | "address" | "city" | "state" | "zipCode" | "country" | "capacity" | "isActive") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const startCreate = () => {
    setEditingId(null);
    setForm({ 
      name: "", 
      address: "", 
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      capacity: 1000,
      isActive: true
    });
    setShowForm(true);
  };
  const startEdit = (id: string) => {
    const w = warehouses.find((x) => x.id === id);
    if (!w) return;
    setEditingId(id);
    setForm({ 
      name: w.name, 
      address: w.address, 
      city: w.city,
      state: w.state,
      zipCode: w.zipCode,
      country: w.country,
      capacity: w.capacity,
      isActive: w.isActive
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateWarehouse(editingId, form);
    } else {
      await addWarehouse(form);
    }
    setShowForm(false);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Warehouse Locations</h2>
          <button onClick={startCreate} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded">+ Add Location</button>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="bg-white border rounded p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-3 px-4">Location Name</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id} className="border-b last:border-b-0">
                  <td className="py-3 px-4">{w.name}</td>
                  <td className="py-3 px-4">{w.address}</td>
                  <td className="py-3 px-4">{w.city}</td>
                  <td className="py-3 px-4">{w.state}</td>
                  <td className="py-3 px-4">{w.capacity.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${w.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button onClick={() => startEdit(w.id)} className="border px-3 py-1 rounded text-xs">edit</button>
                    <button onClick={() => deleteWarehouse(w.id)} className="border px-3 py-1 rounded text-xs">delete</button>
                  </td>
                </tr>
              ))}
              {warehouses.length === 0 && (
                <tr>
                  <td className="py-4 px-4 text-gray-600" colSpan={7}>No warehouses yet. Click Add Location.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <form onSubmit={submit} className="bg-white border rounded p-6 space-y-4 max-w-2xl">
            <div>
              <label className="text-xs text-gray-600">Location Name*</label>
              <input value={form.name} onChange={onChange("name")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-600">Address*</label>
              <input value={form.address} onChange={onChange("address")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600">City*</label>
                <input value={form.city} onChange={onChange("city")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-gray-600">State*</label>
                <input value={form.state} onChange={onChange("state")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600">Zip Code*</label>
                <input value={form.zipCode} onChange={onChange("zipCode")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-gray-600">Country*</label>
                <input value={form.country} onChange={onChange("country")} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Capacity*</label>
              <input 
                type="number" 
                value={form.capacity} 
                onChange={onChange("capacity")} 
                className="mt-1 w-full border rounded px-3 py-2 text-sm" 
                required 
                min="1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isActive"
                checked={form.isActive} 
                onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-xs text-gray-600">Active</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded">{editingId ? "Save" : "Create"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="border text-sm px-4 py-2 rounded">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </SettingsLayout>
  );
}


