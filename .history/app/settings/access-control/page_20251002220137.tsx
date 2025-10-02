"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";
import { Settings, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { AdminService, AdminUtils } from "../../lib/admin";
import { useAuth } from "../../lib/auth";
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

export default function AccessControlPage() {
  // Authentication context
  const { state: authState, logout } = useAuth();

  // API data state
  const [users, setUsers] = React.useState<DetailedUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // UI state
  const [showGrantAccess, setShowGrantAccess] = React.useState<DetailedUser | null>(null);
  const [showPermissions, setShowPermissions] = React.useState<{ user: DetailedUser; type: 'brands' | 'marketplaces' | 'shippingPlatforms' } | null>(null);

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
    loadUsers();
  }, [loadUsers]);

  /**
   * Get permission count for a user
   */
  const getPermissionCount = (user: DetailedUser, type: 'brands' | 'marketplaces' | 'shippingPlatforms') => {
    switch (type) {
      case 'brands':
        return user.brandAccess?.filter(p => p.isActive).length || 0;
      case 'marketplaces':
        return user.marketplaceAccess?.filter(p => p.isActive).length || 0;
      case 'shippingPlatforms':
        return user.shippingAccess?.filter(p => p.isActive).length || 0;
      default:
        return 0;
    }
  };

  /**
   * Get total permission count for a user
   */
  const getTotalCount = (user: DetailedUser, type: 'brands' | 'marketplaces' | 'shippingPlatforms') => {
    switch (type) {
      case 'brands':
        return user.brandAccess?.length || 0;
      case 'marketplaces':
        return user.marketplaceAccess?.length || 0;
      case 'shippingPlatforms':
        return user.shippingAccess?.length || 0;
      default:
        return 0;
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
        <h2 className="text-xl font-semibold text-gray-800">Access Control</h2>
            {!isLoading && (
              <p className="text-sm text-gray-600 mt-1">
                {users.length} user{users.length !== 1 ? 's' : ''} total
              </p>
            )}
          </div>
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            title="Refresh users"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
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
                        <div className="relative">
                          <span className={`h-8 w-8 rounded-full ${getAvatarClass(user.id)}`}></span>
                          {/* Online status indicator */}
                          {user.loginStats?.currentSession?.isActive && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{getUsernameFromEmail(user.email)}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${user.role === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                            {user.role}
                          </div>
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
                        title="View permissions (read-only)"
                      >
                        <Settings size={14} />
                        View Access
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td className="py-8 px-4 text-center text-gray-500" colSpan={5}>
                      No users found. {authState.user?.role === 'ADMIN' ? 'Create users in Manage Users to get started.' : 'Contact your administrator to add users.'}
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
                <div className="text-lg font-semibold text-gray-800">View Access - {getUsernameFromEmail(showGrantAccess.email)}</div>
                <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => setShowGrantAccess(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              {/* Notice about read-only mode */}
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-amber-800 text-sm">
                  <strong>Note:</strong> This is a read-only view. Permission management APIs are not yet implemented. 
                  Use the Manage Users page to edit user roles.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Brands
                  </div>
                  <div className="space-y-2">
                    {showGrantAccess.brandAccess?.filter(b => b.isActive).map((brand, i) => (
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
                    )) || <div className="text-sm text-gray-400 italic">No brands granted</div>}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Marketplaces
                  </div>
                  <div className="space-y-2">
                    {showGrantAccess.marketplaceAccess?.filter(m => m.isActive).map((marketplace, i) => (
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
                    )) || <div className="text-sm text-gray-400 italic">No marketplaces granted</div>}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    Shipping Platforms
                  </div>
                  <div className="space-y-2">
                    {showGrantAccess.shippingAccess?.filter(s => s.isActive).map((shipping, i) => (
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
                    )) || <div className="text-sm text-gray-400 italic">No shipping platforms granted</div>}
                  </div>
                </div>
              </div>

              {/* Login Statistics */}
              {showGrantAccess.loginStats && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
                  <h4 className="font-medium text-gray-800 mb-3">Login Activity</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Total Sessions</div>
                      <div className="font-medium">{showGrantAccess.loginStats.totalSessions}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Total Hours</div>
                      <div className="font-medium">{showGrantAccess.loginStats.totalLoginHours.toFixed(1)}h</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Last Login</div>
                      <div className="font-medium">
                        {showGrantAccess.loginStats.lastLogin 
                          ? AdminUtils.formatRelativeTime(showGrantAccess.loginStats.lastLogin)
                          : 'Never'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Status</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${AdminUtils.getUserStatus(showGrantAccess).color}`}></div>
                        <span className="font-medium">{AdminUtils.getUserStatus(showGrantAccess).text}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowGrantAccess(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-6 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        )}
      </div>
    </SettingsLayout>
  );
}
