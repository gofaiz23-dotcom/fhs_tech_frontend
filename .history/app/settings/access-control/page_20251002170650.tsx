"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";
import { Grid3X3, List, Settings } from "lucide-react";

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
  const [viewMode, setViewMode] = React.useState<'tile' | 'list'>('tile');
  const [showGrantAccess, setShowGrantAccess] = React.useState<AdminUser | null>(null);
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

  const toggleSuperUser = (userId: string, enabled: boolean) => {
    const next = users.map(u => {
      if (u.id === userId) {
        const updated = { ...u };
        // Enable/disable all permissions
        updated.permissions.brands = updated.permissions.brands.map(b => ({ ...b, enabled }));
        updated.permissions.marketplaces = updated.permissions.marketplaces.map(m => ({ ...m, enabled }));
        updated.permissions.shippingPlatforms = updated.permissions.shippingPlatforms.map(s => ({ ...s, enabled }));
        return updated;
      }
      return u;
    });
    persist(next);
    if (showGrantAccess && showGrantAccess.id === userId) {
      const updatedUser = next.find(u => u.id === userId);
      if (updatedUser) {
        setShowGrantAccess(updatedUser);
      }
    }
  };

  const isSuperUser = (user: AdminUser) => {
    const allBrands = user.permissions?.brands?.every(b => b.enabled) || false;
    const allMarketplaces = user.permissions?.marketplaces?.every(m => m.enabled) || false;
    const allShipping = user.permissions?.shippingPlatforms?.every(s => s.enabled) || false;
    return allBrands && allMarketplaces && allShipping;
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Access Control</h2>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'tile' : 'list')}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            title={`Switch to ${viewMode === 'list' ? 'tile' : 'list'} view`}
          >
            {viewMode === 'tile' ? <List size={18} /> : <Grid3X3 size={18} />}
            <span className="text-sm">{viewMode === 'tile' ? 'List View' : 'Tile View'}</span>
          </button>
        </div>

        {viewMode === 'tile' ? (
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

              <button
                onClick={() => setShowGrantAccess(user)}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-800 text-sm px-4 py-3 rounded border border-blue-200 transition-colors flex items-center justify-center gap-2"
              >
                <Settings size={16} />
                Grant Access
              </button>
            </div>
          ))}
          {users.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No users found. Create users in Manage Users first.
            </div>
          )}
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b bg-gray-50">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Brands</th>
                  <th className="py-3 px-4">Marketplaces</th>
                  <th className="py-3 px-4">Shipping</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className={`h-8 w-8 rounded-full ${user.avatar}`}></span>
                        <div>
                          <div className="font-medium text-gray-800">{user.username}</div>
                          <div className="text-xs text-gray-600">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {getPermissionCount(user, 'brands')}/{getTotalCount(user, 'brands')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {getPermissionCount(user, 'marketplaces')}/{getTotalCount(user, 'marketplaces')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {getPermissionCount(user, 'shippingPlatforms')}/{getTotalCount(user, 'shippingPlatforms')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setShowGrantAccess(user)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs px-3 py-2 rounded border border-blue-200 transition-colors flex items-center gap-1"
                      >
                        <Settings size={14} />
                        Grant Access
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td className="py-8 px-4 text-center text-gray-500" colSpan={5}>
                      No users found. Create users in Manage Users first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {showGrantAccess && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-semibold text-gray-800">Grant Access - {showGrantAccess.username}</div>
                <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => setShowGrantAccess(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              {/* Super User Toggle */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Super User</div>
                    <div className="text-sm text-gray-600">Enable all brands, marketplaces, and shipping platforms</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSuperUser(showGrantAccess.id, !isSuperUser(showGrantAccess))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSuperUser(showGrantAccess) ? 'bg-purple-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isSuperUser(showGrantAccess) ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Brands
                  </div>
                  <div className="space-y-2">
                    {showGrantAccess.permissions.brands.map((b, i) => (
                      <label key={i} className="flex items-center justify-between text-sm text-gray-700 border rounded px-3 py-2 hover:bg-gray-50">
                        <span>{b.name}</span>
                        <button type="button" onClick={()=>{
                          const next = { ...showGrantAccess } as AdminUser;
                          next.permissions.brands[i] = { ...b, enabled: !b.enabled };
                          setShowGrantAccess({ ...next });
                          const all = users.map(u => u.id === next.id ? next : u); persist(all);
                        }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${b.enabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${b.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Marketplaces
                  </div>
                  <div className="space-y-2">
                    {showGrantAccess.permissions.marketplaces.map((m, i) => (
                      <label key={i} className="flex items-center justify-between text-sm text-gray-700 border rounded px-3 py-2 hover:bg-gray-50">
                        <span>{m.name}</span>
                        <button type="button" onClick={()=>{
                          const next = { ...showGrantAccess } as AdminUser;
                          next.permissions.marketplaces[i] = { ...m, enabled: !m.enabled };
                          setShowGrantAccess({ ...next });
                          const all = users.map(u => u.id === next.id ? next : u); persist(all);
                        }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${m.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${m.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    Shipping Platforms
                  </div>
                  <div className="space-y-2">
                    {showGrantAccess.permissions.shippingPlatforms.map((s, i) => (
                      <label key={i} className="flex items-center justify-between text-sm text-gray-700 border rounded px-3 py-2 hover:bg-gray-50">
                        <span>{s.name}</span>
                        <button type="button" onClick={()=>{
                          const next = { ...showGrantAccess } as AdminUser;
                          next.permissions.shippingPlatforms[i] = { ...s, enabled: !s.enabled };
                          setShowGrantAccess({ ...next });
                          const all = users.map(u => u.id === next.id ? next : u); persist(all);
                        }} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.enabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${s.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => setShowGrantAccess(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2 rounded"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

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
