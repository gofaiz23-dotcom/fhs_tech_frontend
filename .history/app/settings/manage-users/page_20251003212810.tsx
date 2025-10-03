"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";
import { Pencil, Trash2, Eye, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { AdminService, AdminUtils } from "../../lib/admin";
import { useAuth, AuthService } from "../../lib/auth";
import type { DetailedUser } from "../../lib/admin/types";
import AppleToggle from "../../components/AppleToggle";
import { usePermissionsStore } from "../../lib/stores/permissionsStore";

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
  
  // Permissions store
  const { getUserPermissions, getPermissionCounts } = usePermissionsStore();

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

  // Toggle states for View Access modal
  const [brandAccess, setBrandAccess] = React.useState<Record<number, boolean>>({});
  const [marketplaceAccess, setMarketplaceAccess] = React.useState<Record<number, boolean>>({});
  const [shippingAccess, setShippingAccess] = React.useState<Record<number, boolean>>({});

  // Mock data for brands, marketplaces, and shipping platforms
  const brands = [
    { id: 1, name: 'Nike' },
    { id: 2, name: 'Adidas' },
    { id: 3, name: 'Apple' },
    { id: 4, name: 'Samsung' },
    { id: 5, name: 'Sony' },
    { id: 6, name: 'Microsoft' },
    { id: 7, name: 'Google' },
    { id: 8, name: 'Tesla' }
  ];

  const marketplaces = [
    { id: 1, name: 'Amazon', description: 'Global e-commerce platform' },
    { id: 2, name: 'Walmart', description: 'Retail giant' },
    { id: 3, name: 'eBay', description: 'Online marketplace' },
    { id: 4, name: 'Shopify', description: 'E-commerce platform' },
    { id: 5, name: 'Etsy', description: 'Handmade and vintage items' },
    { id: 6, name: 'Target', description: 'Retail chain' },
    { id: 7, name: 'Best Buy', description: 'Electronics retailer' },
    { id: 8, name: 'Home Depot', description: 'Home improvement' }
  ];

  const shippingPlatforms = [
    { id: 1, name: 'FedEx', description: 'Express shipping' },
    { id: 2, name: 'UPS', description: 'Package delivery' },
    { id: 3, name: 'DHL', description: 'International shipping' },
    { id: 4, name: 'USPS', description: 'Postal service' },
    { id: 5, name: 'Amazon Logistics', description: 'Amazon delivery' },
    { id: 6, name: 'OnTrac', description: 'Regional shipping' },
    { id: 7, name: 'LaserShip', description: 'Last-mile delivery' },
    { id: 8, name: 'Purolator', description: 'Canadian shipping' }
  ];

  // Initialize toggle states when user is selected
  React.useEffect(() => {
    if (showAccessFor) {
      // Initialize brand access
      const brandStates: Record<number, boolean> = {};
      brands.forEach(brand => {
        const hasAccess = showAccessFor.brandAccess?.some(b => b.name === brand.name && b.isActive) || false;
        brandStates[brand.id] = hasAccess;
      });
      setBrandAccess(brandStates);

      // Initialize marketplace access
      const marketplaceStates: Record<number, boolean> = {};
      marketplaces.forEach(marketplace => {
        const hasAccess = showAccessFor.marketplaceAccess?.some(m => m.name === marketplace.name && m.isActive) || false;
        marketplaceStates[marketplace.id] = hasAccess;
      });
      setMarketplaceAccess(marketplaceStates);

      // Initialize shipping access
      const shippingStates: Record<number, boolean> = {};
      shippingPlatforms.forEach(shipping => {
        const hasAccess = showAccessFor.shippingAccess?.some(s => s.name === shipping.name && s.isActive) || false;
        shippingStates[shipping.id] = hasAccess;
      });
      setShippingAccess(shippingStates);
    }
  }, [showAccessFor]);

  /**
   * Load users from API
   */
  const loadUsers = React.useCallback(async () => {
    if (!authState.accessToken) {
      setError('No access token available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await AdminService.getAllUsers(authState.accessToken);
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
  }, [authState.accessToken, logout]);

  // Load users on component mount
  React.useEffect(() => {
    // Only load users if authentication is complete and we have a token
    if (authState.isAuthenticated && authState.accessToken && !authState.isLoading) {
      loadUsers();
    }
  }, [loadUsers, authState.isAuthenticated, authState.accessToken, authState.isLoading]);

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
        // Validate required fields for new user
        if (!form.username.trim()) {
          setError('Username is required');
          setIsSubmitting(false);
          return;
        }
        if (!form.email.trim()) {
          setError('Email is required');
          setIsSubmitting(false);
          return;
        }
        if (!form.password.trim()) {
          setError('Password is required');
          setIsSubmitting(false);
          return;
        }
        
        // Register new user
        await AuthService.register({
          username: form.username.trim(),
          email: form.email.trim(),
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
    if (!isEditing || !authState.accessToken) return;

    try {
      const currentUser = users.find(u => u.id === isEditing);
      
      // Update username if changed
      if (currentUser && getDisplayUsername(currentUser) !== form.username) {
        // Note: Username update would need a separate API endpoint
        console.log('Username update requested:', form.username);
        // await AdminService.updateUsername(isEditing, form.username, authState.accessToken);
      }

      // Update email if changed
      if (currentUser && currentUser.email !== form.email) {
        await AdminService.updateUserEmail(isEditing, form.email, authState.accessToken);
      }

      // Update password if provided
      if (form.password && form.password !== '••••••••') {
        await AdminService.updateUserPassword(isEditing, form.password, authState.accessToken);
      }

      // Update role if changed
      if (currentUser && currentUser.role !== form.role) {
        await AdminService.updateUserRole(isEditing, form.role, authState.accessToken);
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
   * Get username from user object (uses actual username field from API)
   */
  const getDisplayUsername = (user: DetailedUser) => {
    return user.username || user.email.split('@')[0];
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
                      <div className="font-medium">{getDisplayUsername(user)}</div>
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
                        const userPermissions = getUserPermissions(user.id.toString());
                        const grantedBrands = userPermissions.brandAccess.filter(b => b.isActive).map(b => b.name);
                        const grantedMarketplaces = userPermissions.marketplaceAccess.filter(m => m.isActive).map(m => m.name);
                        const grantedShipping = userPermissions.shippingAccess.filter(s => s.isActive).map(s => s.name);
                        
                        return (
                          <>
                            {/* {grantedBrands.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-blue-600">Brands:</span>
                                <span className="text-gray-600">{grantedBrands.join(', ')}</span>
                              </div>
                            )} */}
                            {/* {grantedMarketplaces.length > 0 && (
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
                            )} */}
                            
                            {/* Allocated Brands */}
                            {/* {grantedBrands.length > 0 && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                <div className="text-xs font-medium text-blue-800 mb-1">Allocated Brands:</div>
                                <div className="flex flex-wrap gap-1">
                                  {grantedBrands.map((brand, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                      {brand}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )} */}
                            
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
                                    username: getDisplayUsername(user), 
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
                                title="Toggle Access" 
                                aria-label="Toggle Access" 
                                onClick={() => {/* Toggle user access */}} 
                                className="inline-flex items-center justify-center border rounded p-1 text-xs hover:bg-green-50 text-green-600"
                              >
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
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
                <label className="text-xs text-gray-600">Username {!isEditing && '*'}</label>
                <input 
                  value={form.username} 
                  onChange={(e)=>setForm({...form, username: e.target.value})} 
                  className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
                  placeholder="Enter username"
                  required
                  disabled={isSubmitting}
                />
                <div className="text-xs text-gray-500 mt-1">Choose a unique username for the user</div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Email</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e)=>{
                    setForm({...form, email: e.target.value});
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
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-semibold text-gray-800">User Access - {getDisplayUsername(showAccessFor)}</div>
                <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={()=>setShowAccessFor(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              {/* Show only granted access categories */}
              <div className="space-y-6">
                {/* Brands Section - Only show if user has brand access */}
                {(() => {
                  const userPermissions = getUserPermissions(showAccessFor.id.toString());
                  const grantedBrands = userPermissions.brandAccess.filter(b => b.isActive);
                  return grantedBrands.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-800">Brands</h3>
                        <span className="text-sm text-gray-500">({grantedBrands.length} granted)</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {grantedBrands.map((brand, i) => (
                          <div key={i} className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">{brand.name}</div>
                              <div className="text-xs text-gray-500">
                                Granted: {brand.grantedAt ? AdminUtils.formatRelativeTime(brand.grantedAt) : 'Recently'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Marketplaces Section - Only show if user has marketplace access */}
                {(() => {
                  const userPermissions = getUserPermissions(showAccessFor.id.toString());
                  const grantedMarketplaces = userPermissions.marketplaceAccess.filter(m => m.isActive);
                  return grantedMarketplaces.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-800">Marketplaces</h3>
                        <span className="text-sm text-gray-500">({grantedMarketplaces.length} granted)</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {grantedMarketplaces.map((marketplace, i) => (
                          <div key={i} className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{marketplace.name}</div>
                              {marketplace.description && (
                                <div className="text-sm text-gray-500">{marketplace.description}</div>
                              )}
                              <div className="text-xs text-gray-500">
                                Granted: {marketplace.grantedAt ? AdminUtils.formatRelativeTime(marketplace.grantedAt) : 'Recently'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Shipping Platforms Section - Only show if user has shipping access */}
                {(() => {
                  const userPermissions = getUserPermissions(showAccessFor.id.toString());
                  const grantedShipping = userPermissions.shippingAccess.filter(s => s.isActive);
                  return grantedShipping.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-800">Shipping Platforms</h3>
                        <span className="text-sm text-gray-500">({grantedShipping.length} granted)</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {grantedShipping.map((shipping, i) => (
                          <div key={i} className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{shipping.name}</div>
                              {shipping.description && (
                                <div className="text-sm text-gray-500">{shipping.description}</div>
                              )}
                              <div className="text-xs text-gray-500">
                                Granted: {shipping.grantedAt ? AdminUtils.formatRelativeTime(shipping.grantedAt) : 'Recently'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* No Access Message */}
                {(() => {
                  const userPermissions = getUserPermissions(showAccessFor.id.toString());
                  const totalGranted = 
                    userPermissions.brandAccess.filter(b => b.isActive).length +
                    userPermissions.marketplaceAccess.filter(m => m.isActive).length +
                    userPermissions.shippingAccess.filter(s => s.isActive).length;
                  
                  return totalGranted === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-500 text-lg mb-2">No Access Permissions</div>
                      <div className="text-gray-400 text-sm">This user has no access permissions granted</div>
                    </div>
                  );
                })()}
              </div>

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
                Are you sure you want to delete user "{getDisplayUsername(confirmDelete)}"? 
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


