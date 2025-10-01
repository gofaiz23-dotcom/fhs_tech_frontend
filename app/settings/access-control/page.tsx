"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";

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

export default function AccessControlPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [showPermissions, setShowPermissions] = React.useState<{ user: AdminUser; type: 'brands' | 'marketplaces' | 'shippingPlatforms' } | null>(null);

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

  const updatePermission = (userId: string, type: 'brands' | 'marketplaces' | 'shippingPlatforms', itemIndex: number, enabled: boolean) => {
    const next = users.map(u => {
      if (u.id === userId) {
        const updated = { ...u };
        updated.permissions[type][itemIndex] = { ...updated.permissions[type][itemIndex], enabled };
        return updated;
      }
      return u;
    });
    persist(next);
    if (showPermissions && showPermissions.user.id === userId) {
      const updatedUser = next.find(u => u.id === userId);
      if (updatedUser) {
        setShowPermissions({ ...showPermissions, user: updatedUser });
      }
    }
  };

  const getPermissionCount = (user: AdminUser, type: 'brands' | 'marketplaces' | 'shippingPlatforms') => {
    return user.permissions?.[type]?.filter(p => p.enabled).length || 0;
  };

  const getTotalCount = (user: AdminUser, type: 'brands' | 'marketplaces' | 'shippingPlatforms') => {
    return user.permissions?.[type]?.length || 0;
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Access Control</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div key={user.id} className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className={`h-10 w-10 rounded-full ${user.avatar}`}></span>
                <div>
                  <div className="font-medium text-gray-800">{user.username}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShowPermissions({ user, type: 'brands' })}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 text-sm px-3 py-2 rounded border border-blue-200 transition-colors"
                >
                  Brands ({getPermissionCount(user, 'brands')}/{getTotalCount(user, 'brands')})
                </button>
                <button
                  onClick={() => setShowPermissions({ user, type: 'marketplaces' })}
                  className="bg-green-50 hover:bg-green-100 text-green-800 text-sm px-3 py-2 rounded border border-green-200 transition-colors"
                >
                  Marketplaces ({getPermissionCount(user, 'marketplaces')}/{getTotalCount(user, 'marketplaces')})
                </button>
                <button
                  onClick={() => setShowPermissions({ user, type: 'shippingPlatforms' })}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 text-sm px-3 py-2 rounded border border-purple-200 transition-colors"
                >
                  Shipping ({getPermissionCount(user, 'shippingPlatforms')}/{getTotalCount(user, 'shippingPlatforms')})
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No users found. Create users in Manage Users first.
            </div>
          )}
        </div>

        {showPermissions && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-gray-800">
                  {showPermissions.user.username} - {showPermissions.type.charAt(0).toUpperCase() + showPermissions.type.slice(1)}
                </div>
                <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => setShowPermissions(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {showPermissions.user.permissions?.[showPermissions.type]?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm text-gray-700 border rounded px-3 py-2">
                    <span>{item.name}</span>
                    <button
                      type="button"
                      onClick={() => updatePermission(showPermissions.user.id, showPermissions.type, i, !item.enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${item.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => setShowPermissions(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
