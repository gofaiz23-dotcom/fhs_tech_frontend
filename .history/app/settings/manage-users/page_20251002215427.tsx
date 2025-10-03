"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";
import { Pencil, Trash2, Eye, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { AdminService, AdminUtils } from "../../lib/admin";
import { useAuth, AuthService } from "../../lib/auth";
import type { DetailedUser } from "../../lib/admin/types";

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
  // Authentication context
  const { state: authState, logout } = useAuth();

  // API data state
  const [users, setUsers] = React.useState<DetailedUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // UI state
  const [open, setOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState<number | null>(null);
  const [form, setForm] = React.useState({ 
    username: "", 
    email: "", 
    password: "", 
    role: 'USER' as 'USER' | 'ADMIN' 
  });
  const [showAccessFor, setShowAccessFor] = React.useState<DetailedUser | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<DetailedUser | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  /**
   * Load users from API
   */
  const loadUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await AdminService.getAllUsers();
      setUsers(response.users);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setError(error.message || 'Failed to load users');
      
      // If unauthorized, redirect to login
      if (error.statusCode === 401 || error.statusCode === 403) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Load users on component mount
  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /**
   * Handle user registration (only for creating new users)
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        // Handle updates via separate functions
        await handleUpdateUser();
      } else {
        // Register new user
        await AuthService.register({
          email: form.email,
          password: form.password,
          role: form.role,
        }, authState.accessToken || undefined);
        
        // Reload users to get updated list
        await loadUsers();
        
        // Reset form
        setForm({ username: "", email: "", password: "", role: 'USER' });
        setOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to register user:', error);
      setError(error.message || 'Failed to register user');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle user updates
   */
  const handleUpdateUser = async () => {
    if (!isEditing) return;

    try {
      // Update email if changed
      const currentUser = users.find(u => u.id === isEditing);
      if (currentUser && currentUser.email !== form.email) {
        await AdminService.updateUserEmail(isEditing, form.email);
      }

      // Update password if provided
      if (form.password && form.password !== '••••••••') {
        await AdminService.updateUserPassword(isEditing, form.password);
      }

      // Update role if changed
      if (currentUser && currentUser.role !== form.role) {
        await AdminService.updateUserRole(isEditing, form.role);
      }

      // Reload users to get updated data
      await loadUsers();
      
      // Reset form
      setForm({ username: "", email: "", password: "", role: 'USER' });
      setIsEditing(null);
      setOpen(false);
    } catch (error: any) {
      console.error('Failed to update user:', error);
      setError(error.message || 'Failed to update user');
      throw error;
    }
  };

  /**
   * Delete user (Note: This would need a delete API endpoint)
   */
  const handleDeleteUser = async (user: DetailedUser) => {
    try {
      // Note: The API documentation doesn't include a delete endpoint
      // This would need to be implemented on the backend
      console.warn('Delete user functionality not available in current API');
      setError('Delete functionality not available. Please contact system administrator.');
      setConfirmDelete(null);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      setError(error.message || 'Failed to delete user');
    }
  };

  /**
   * Get username from email
   */
  const getUsernameFromEmail = (email: string) => {
    return email.split('@')[0];
  };

  /**
   * Get avatar gradient class
   */
  const getAvatarClass = (userId: number) => {
    const gradients = [
      "bg-gradient-to-br from-indigo-500 to-purple-500",
      "bg-gradient-to-br from-rose-500 to-orange-500", 
      "bg-gradient-to-br from-emerald-500 to-teal-500",
      "bg-gradient-to-br from-sky-500 to-indigo-500",
    ];
    return gradients[userId % gradients.length];
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Manage Users</h2>
            {!isLoading && (
              <p className="text-sm text-gray-600 mt-1">
                {users.length} user{users.length !== 1 ? 's' : ''} total
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              title="Refresh users"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button 
              onClick={() => setOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
              disabled={isLoading}
            >
              Create New User
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <div className="text-red-800 font-medium">Error</div>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white border rounded p-8 text-center">
            <Loader2 size={32} className="animate-spin mx-auto mb-4 text-blue-600" />
            <div className="text-gray-600">Loading users...</div>
          </div>
        ) : (
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
              {users.map(user => (
                <tr key={user.id} className="border-b last:border-b-0">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="relative">
                      <span className={`h-8 w-8 rounded-full ${getAvatarClass(user.id)}`}></span>
                      {/* Online status indicator */}
                      {user.loginStats?.currentSession?.isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{getUsernameFromEmail(user.email)}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${user.role === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                        {user.role}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>{user.email}</div>
                    {user.loginStats?.lastLogin && (
                      <div className="text-xs text-gray-500">
                        Last login: {AdminUtils.formatRelativeTime(user.loginStats.lastLogin)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1 text-xs">
                      {(() => {
                        const grantedBrands = user.brandAccess?.filter(b => b.isActive).map(b => b.name) || [];
                        const grantedMarketplaces = user.marketplaceAccess?.filter(m => m.isActive).map(m => m.name) || [];
                        const grantedShipping = user.shippingAccess?.filter(s => s.isActive).map(s => s.name) || [];
                        
                        return (
                          <>
                            {grantedBrands.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-blue-600">Brands:</span>
                                <span className="text-gray-600">{grantedBrands.join(', ')}</span>
                              </div>
                            )}
                            {grantedMarketplaces.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-green-600">Marketplaces:</span>
                                <span className="text-gray-600">{grantedMarketplaces.join(', ')}</span>
                              </div>
                            )}
                            {grantedShipping.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-purple-600">Shipping:</span>
                                <span className="text-gray-600">{grantedShipping.join(', ')}</span>
                              </div>
                            )}
                            {grantedBrands.length === 0 && grantedMarketplaces.length === 0 && grantedShipping.length === 0 && (
                              <span className="text-gray-400">No access granted</span>
                            )}
                            
                            <div className="flex gap-1 mt-2">
                              <button 
                                title="View Access" 
                                aria-label="View Access" 
                                onClick={() => setShowAccessFor(user)} 
                                className="inline-flex items-center justify-center border rounded p-1 text-xs hover:bg-gray-50"
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                title="Edit" 
                                aria-label="Edit" 
                                onClick={() => { 
                                  setIsEditing(user.id); 
                                  setForm({ 
                                    username: getUsernameFromEmail(user.email), 
                                    email: user.email, 
                                    password: '••••••••', 
                                    role: user.role 
                                  }); 
                                  setOpen(true); 
                                }} 
                                className="inline-flex items-center justify-center border rounded p-1 text-xs hover:bg-gray-50"
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                title="Delete" 
                                aria-label="Delete" 
                                onClick={() => setConfirmDelete(user)} 
                                className="inline-flex items-center justify-center border rounded p-1 text-xs hover:bg-red-50 text-red-600"
                              >
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
                  <td className="py-8 px-4 text-center text-gray-600" colSpan={3}>
                    No users found. {authState.user?.role === 'ADMIN' ? 'Click Create New User to get started.' : 'Contact your administrator to add users.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}

        {open && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <form onSubmit={handleRegister} className="bg-white rounded shadow-lg p-6 w-full max-w-md space-y-4">
              <div className="text-lg font-semibold text-gray-800">{isEditing ? 'Edit User' : 'Create New User'}</div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}
              
              <div>
                <label className="text-xs text-gray-600">Username (read-only)</label>
                <input 
                  value={form.username} 
                  onChange={(e)=>setForm({...form, username: e.target.value})} 
                  className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-50" 
                  placeholder="Will be derived from email"
                  disabled
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Email</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e)=>{
                    setForm({...form, email: e.target.value, username: getUsernameFromEmail(e.target.value)});
                  }} 
                  className="mt-1 w-full border rounded px-3 py-2 text-sm" 
                  placeholder="user@company.com"
                  required 
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Password</label>
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={(e)=>setForm({...form, password: e.target.value})} 
                  className="mt-1 w-full border rounded px-3 py-2 text-sm" 
                  placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                  required={!isEditing}
                  disabled={isSubmitting}
                />
                {isEditing && (
                  <div className="text-xs text-gray-500 mt-1">Leave blank to keep current password</div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-600">Role</label>
                <select 
                  value={form.role} 
                  onChange={(e)=>setForm({...form, role: e.target.value as 'USER' | 'ADMIN'})} 
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {form.role === 'ADMIN' ? 'Full access to all features' : 'Limited access based on permissions'}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={()=>{
                    setOpen(false); 
                    setIsEditing(null); 
                    setError(null);
                    setForm({ username: "", email: "", password: "", role: 'USER' });
                  }} 
                  className="border text-sm px-4 py-2 rounded"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm px-4 py-2 rounded flex items-center gap-2"
                  disabled={isSubmitting || !form.email}
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Processing...' : (isEditing ? 'Update User' : 'Create User')}
                </button>
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
                      const grantedBrands = showAccessFor.brandAccess?.filter(b => b.isActive) || [];
                      return grantedBrands.length > 0 ? (
                        grantedBrands.map((brand, i) => (
                          <div key={i} className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <div>
                                <div className="font-medium">{brand.name}</div>
                                {brand.description && (
                                  <div className="text-xs text-gray-500">{brand.description}</div>
                                )}
                                <div className="text-xs text-gray-500">
                                  Granted: {AdminUtils.formatRelativeTime(brand.grantedAt)}
                                </div>
                              </div>
                            </div>
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
                      const grantedMarketplaces = showAccessFor.marketplaceAccess?.filter(m => m.isActive) || [];
                      return grantedMarketplaces.length > 0 ? (
                        grantedMarketplaces.map((marketplace, i) => (
                          <div key={i} className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div>
                                <div className="font-medium">{marketplace.name}</div>
                                {marketplace.description && (
                                  <div className="text-xs text-gray-500">{marketplace.description}</div>
                                )}
                                <div className="text-xs text-gray-500">
                                  Granted: {AdminUtils.formatRelativeTime(marketplace.grantedAt)}
                                </div>
                              </div>
                            </div>
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
                      const grantedShipping = showAccessFor.shippingAccess?.filter(s => s.isActive) || [];
                      return grantedShipping.length > 0 ? (
                        grantedShipping.map((shipping, i) => (
                          <div key={i} className="text-sm text-gray-700 bg-purple-50 border border-purple-200 rounded px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <div>
                                <div className="font-medium">{shipping.name}</div>
                                {shipping.description && (
                                  <div className="text-xs text-gray-500">{shipping.description}</div>
                                )}
                                <div className="text-xs text-gray-500">
                                  Granted: {AdminUtils.formatRelativeTime(shipping.grantedAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-400 italic">No shipping platforms granted</div>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Login Statistics */}
              {showAccessFor.loginStats && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
                  <h4 className="font-medium text-gray-800 mb-3">Login Activity</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Total Sessions</div>
                      <div className="font-medium">{showAccessFor.loginStats.totalSessions}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Total Hours</div>
                      <div className="font-medium">{showAccessFor.loginStats.totalLoginHours.toFixed(1)}h</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Last Login</div>
                      <div className="font-medium">
                        {showAccessFor.loginStats.lastLogin 
                          ? AdminUtils.formatRelativeTime(showAccessFor.loginStats.lastLogin)
                          : 'Never'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Status</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${AdminUtils.getUserStatus(showAccessFor).color}`}></div>
                        <span className="font-medium">{AdminUtils.getUserStatus(showAccessFor).text}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {(() => {
                const totalGranted = 
                  (showAccessFor.brandAccess?.filter(b => b.isActive).length || 0) +
                  (showAccessFor.marketplaceAccess?.filter(m => m.isActive).length || 0) +
                  (showAccessFor.shippingAccess?.filter(s => s.isActive).length || 0);
                
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
              <div className="text-lg font-semibold text-gray-800 mb-2">Delete User</div>
              <div className="text-gray-600 mb-4">
                Are you sure you want to delete user "{getUsernameFromEmail(confirmDelete.email)}"? 
                <div className="text-sm text-red-600 mt-2">
                  Note: Delete functionality is not yet available in the current API.
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  className="border text-sm px-4 py-2 rounded" 
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded" 
                  onClick={() => handleDeleteUser(confirmDelete)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}


