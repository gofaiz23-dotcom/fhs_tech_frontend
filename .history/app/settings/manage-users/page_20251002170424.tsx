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
                  <td className="py-3 px-4">
                    <div className="space-y-1 text-xs">
                      {(() => {
                        const role = u.role ?? 'viewer';
                        const perms = u.permissions ?? defaultPermissions(role);
                        const grantedBrands = perms.brands.filter(b => b.enabled).map(b => b.name);
                        const grantedMarketplaces = perms.marketplaces.filter(m => m.enabled).map(m => m.name);
                        const grantedShipping = perms.shippingPlatforms.filter(s => s.enabled).map(s => s.name);
                        
                        return (
                          <>
                            
                            <div className="flex gap-1 mt-2">
                              <button title="View Access" aria-label="View Access" onClick={()=> { const role = u.role ?? 'viewer'; const perms = u.permissions ?? defaultPermissions(role); setShowAccessFor({ ...u, role, permissions: perms }); }} className="inline-flex items-center justify-center border rounded p-1 text-xs hover:bg-gray-50">
                                <Eye size={14} />
                              </button>
                              <button title="Edit" aria-label="Edit" onClick={()=> { setIsEditing(u.id); setForm({ username: u.username, email: u.email, password: u.password, role: u.role ?? 'viewer' }); setOpen(true); }} className="inline-flex items-center justify-center border rounded p-1 text-xs hover:bg-gray-50">
                                <Pencil size={14} />
                              </button>
                              <button title="Delete" aria-label="Delete" onClick={()=> setConfirmDelete(u)} className="inline-flex items-center justify-center border rounded p-1 text-xs hover:bg-red-50 text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Brands
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const grantedBrands = showAccessFor.permissions.brands.filter(b => b.enabled);
                      return grantedBrands.length > 0 ? (
                        grantedBrands.map((b, i) => (
                          <div key={i} className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              {b.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-400 italic">No brands granted</div>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Marketplaces
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const grantedMarketplaces = showAccessFor.permissions.marketplaces.filter(m => m.enabled);
                      return grantedMarketplaces.length > 0 ? (
                        grantedMarketplaces.map((m, i) => (
                          <div key={i} className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {m.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-400 italic">No marketplaces granted</div>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    Shipping Platforms
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const grantedShipping = showAccessFor.permissions.shippingPlatforms.filter(s => s.enabled);
                      return grantedShipping.length > 0 ? (
                        grantedShipping.map((s, i) => (
                          <div key={i} className="text-sm text-gray-700 bg-purple-50 border border-purple-200 rounded px-3 py-2">
                            <span className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              {s.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-400 italic">No shipping platforms granted</div>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              {(() => {
                const totalGranted = 
                  showAccessFor.permissions.brands.filter(b => b.enabled).length +
                  showAccessFor.permissions.marketplaces.filter(m => m.enabled).length +
                  showAccessFor.permissions.shippingPlatforms.filter(s => s.enabled).length;
                
                return totalGranted === 0 && (
                  <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded text-center">
                    <div className="text-gray-500 text-sm">This user has no access permissions granted</div>
                  </div>
                );
              })()}
              
              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => setShowAccessFor(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
                >
                  Close
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


