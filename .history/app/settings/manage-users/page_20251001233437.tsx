"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";
import { Pencil, Trash2, Eye } from "lucide-react";

type PermissionItem = { name: string; enabled: boolean };
type AdminUser = {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar: string;
  role?: 'admin' | 'manager' | 'viewer';
  permissions: {
    brands: PermissionItem[];
    marketplaces: PermissionItem[];
    shippingPlatforms: PermissionItem[];
  };
};

const gradients = [
  "bg-gradient-to-br from-indigo-500 to-purple-500",
  "bg-gradient-to-br from-rose-500 to-orange-500",
  "bg-gradient-to-br from-emerald-500 to-teal-500",
  "bg-gradient-to-br from-sky-500 to-indigo-500",
];

function randomAvatar() {
  const cls = gradients[Math.floor(Math.random() * gradients.length)];
  return cls;
}

export default function ManageUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [open, setOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ username: "", email: "", password: "", role: 'viewer' as AdminUser['role'] });
  const [showAccessFor, setShowAccessFor] = React.useState<AdminUser | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<AdminUser | null>(null);

  const load = React.useCallback(() => {
    try {
      const raw = localStorage.getItem("fhs_admin_users");
      const data = raw ? JSON.parse(raw) : [];
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const persist = (next: AdminUser[]) => {
    localStorage.setItem("fhs_admin_users", JSON.stringify(next));
    setUsers(next);
  };

  const remove = (id: string) => {
    const next = users.filter(u => u.id !== id);
    persist(next);
  };

  const defaultPermissions = React.useCallback((role: AdminUser['role'] = 'viewer') => ({
    brands: [{ name: 'Brand A', enabled: role !== 'viewer' }, { name: 'Brand B', enabled: role === 'admin' }],
    marketplaces: [
      { name: 'Amazon', enabled: role !== 'viewer' },
      { name: 'eBay', enabled: role === 'admin' },
      { name: 'Etsy', enabled: false },
    ],
    shippingPlatforms: [
      { name: 'FedEx', enabled: role !== 'viewer' },
      { name: 'UPS', enabled: role === 'admin' },
    ],
  }), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      const next = users.map(u => u.id === isEditing ? { ...u, username: form.username, email: form.email, password: form.password, role: form.role } : u);
      persist(next);
    } else {
      const newUser: AdminUser = {
        id: crypto.randomUUID(),
        username: form.username,
        email: form.email,
        password: form.password,
        avatar: randomAvatar(),
        role: form.role,
        permissions: defaultPermissions(form.role),
      };
      persist([newUser, ...users]);
    }
    setForm({ username: "", email: "", password: "", role: 'viewer' });
    setIsEditing(null);
    setOpen(false);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Manage Users</h2>
          <button onClick={()=>setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded">Create New User</button>
        </div>

        <div className="bg-white border rounded p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-b-0">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <span className={`h-8 w-8 rounded-full ${u.avatar}`}></span>
                    <span>{u.username}</span>
                  </td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button title="View Access" aria-label="View Access" onClick={()=> { const role = u.role ?? 'viewer'; const perms = u.permissions ?? defaultPermissions(role); setShowAccessFor({ ...u, role, permissions: perms }); }} className="inline-flex items-center justify-center border rounded p-1.5 text-xs hover:bg-gray-50 align-middle">
                      <Eye size={16} />
                    </button>
                    <button title="Edit" aria-label="Edit" onClick={()=> { setIsEditing(u.id); setForm({ username: u.username, email: u.email, password: u.password, role: u.role ?? 'viewer' }); setOpen(true); }} className="inline-flex items-center justify-center border rounded p-1.5 text-xs hover:bg-gray-50 align-middle">
                      <Pencil size={16} />
                    </button>
                    <button title="Delete" aria-label="Delete" onClick={()=> setConfirmDelete(u)} className="inline-flex items-center justify-center border rounded p-1.5 text-xs hover:bg-red-50 text-red-600 align-middle">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="py-4 px-4 text-gray-600" colSpan={3}>No users yet. Click Create New User.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {open && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <form onSubmit={submit} className="bg-white rounded shadow-lg p-6 w-full max-w-md space-y-4">
              <div className="text-lg font-semibold text-gray-800">{isEditing ? 'Edit User' : 'Create New User'}</div>
              <div>
                <label className="text-xs text-gray-600">Username</label>
                <input value={form.username} onChange={(e)=>setForm({...form, username: e.target.value})} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-gray-600">Gmail ID</label>
                <input type="email" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs text-gray-600">Password</label>
                <input type="password" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} className="mt-1 w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={()=>{setOpen(false); setIsEditing(null);}} className="border text-sm px-4 py-2 rounded">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded">{isEditing ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        )}

        {showAccessFor && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-gray-800">User Access - {showAccessFor.username}</div>
                <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={()=>setShowAccessFor(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              {/* Simple Apple-like toggle */}
              {(() => {
                const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
                  <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                );
                return null;
              })()}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="font-medium text-gray-800 mb-2">Brands</div>
                  <div className="space-y-2">
                    {showAccessFor.permissions.brands.map((b, i) => (
                      <label key={i} className="flex items-center justify-between text-sm text-gray-700 border rounded px-3 py-2">
                        <span>{b.name}</span>
                        <button type="button" onClick={()=>{
                          const next = { ...showAccessFor } as AdminUser;
                          next.permissions.brands[i] = { ...b, enabled: !b.enabled };
                          setShowAccessFor({ ...next });
                          const all = users.map(u => u.id === next.id ? next : u); persist(all);
                        }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${b.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${b.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-2">Marketplaces</div>
                  <div className="space-y-2">
                    {showAccessFor.permissions.marketplaces.map((m, i) => (
                      <label key={i} className="flex items-center justify-between text-sm text-gray-700 border rounded px-3 py-2">
                        <span>{m.name}</span>
                        <button type="button" onClick={()=>{
                          const next = { ...showAccessFor } as AdminUser;
                          next.permissions.marketplaces[i] = { ...m, enabled: !m.enabled };
                          setShowAccessFor({ ...next });
                          const all = users.map(u => u.id === next.id ? next : u); persist(all);
                        }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${m.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${m.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-2">Shipping Platforms</div>
                  <div className="space-y-2">
                    {showAccessFor.permissions.shippingPlatforms.map((s, i) => (
                      <label key={i} className="flex items-center justify-between text-sm text-gray-700 border rounded px-3 py-2">
                        <span>{s.name}</span>
                        <button type="button" onClick={()=>{
                          const next = { ...showAccessFor } as AdminUser;
                          next.permissions.shippingPlatforms[i] = { ...s, enabled: !s.enabled };
                          setShowAccessFor({ ...next });
                          const all = users.map(u => u.id === next.id ? next : u); persist(all);
                        }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${s.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => setShowAccessFor(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
              <div className="text-lg font-semibold text-gray-800 mb-4">Delete user "{confirmDelete.username}"?</div>
              <div className="flex gap-2 justify-end">
                <button className="border text-sm px-4 py-2 rounded" onClick={()=>setConfirmDelete(null)}>Cancel</button>
                <button className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded" onClick={()=>{ remove(confirmDelete.id); setConfirmDelete(null); }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}


