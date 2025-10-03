"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";
import { Settings, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { AdminService, AdminUtils } from "../../lib/admin";
import { useAuth } from "../../lib/auth";
import type { DetailedUser } from "../../lib/admin/types";
import AppleToggle from "../../components/AppleToggle";
import { usePermissionsStore } from "../../lib/stores/permissionsStore";
import { AccessControlService, type Brand, type Marketplace, type ShippingPlatform } from "../../lib/access-control";

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
  
  // Permissions store
  const { 
    getUserPermissions, 
    updateUserPermissions, 
    getPermissionCounts 
  } = usePermissionsStore();

  // API data state
  const [users, setUsers] = React.useState<DetailedUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Access control data state
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [marketplaces, setMarketplaces] = React.useState<Marketplace[]>([]);
  const [shippingPlatforms, setShippingPlatforms] = React.useState<ShippingPlatform[]>([]);
  const [isLoadingAccessData, setIsLoadingAccessData] = React.useState(false);

  // UI state
  const [showGrantAccess, setShowGrantAccess] = React.useState<DetailedUser | null>(null);
  const [showPermissions, setShowPermissions] = React.useState<{ user: DetailedUser; type: 'brands' | 'marketplaces' | 'shippingPlatforms' } | null>(null);
  const [superUserMode, setSuperUserMode] = React.useState(false);

  // Loading state for toggle operations
  const [togglingItems, setTogglingItems] = React.useState<Set<string>>(new Set());

  // State for toggle switches
  const [brandAccess, setBrandAccess] = React.useState<Record<number, boolean>>({});
  const [marketplaceAccess, setMarketplaceAccess] = React.useState<Record<number, boolean>>({});
  const [shippingAccess, setShippingAccess] = React.useState<Record<number, boolean>>({});

  /**
   * Load access control data (brands, marketplaces, shipping platforms)
   */
  const loadAccessControlData = React.useCallback(async () => {
    if (!authState.accessToken) {
      setError('No access token available');
      return;
    }

    try {
      setIsLoadingAccessData(true);
      setError(null);
      
      const [brandsResponse, marketplacesResponse, shippingResponse] = await Promise.all([
        AccessControlService.getBrands(authState.accessToken),
        AccessControlService.getMarketplaces(authState.accessToken),
        AccessControlService.getShippingPlatforms(authState.accessToken)
      ]);
      
      setBrands(brandsResponse.brands);
      setMarketplaces(marketplacesResponse.marketplaces);
      setShippingPlatforms(shippingResponse.shippingCompanies);
    } catch (error: any) {
      console.error('Failed to load access control data:', error);
      setError(error.message || 'Failed to load access control data');
    } finally {
      setIsLoadingAccessData(false);
    }
  }, [authState.accessToken]);

  // Load access control data on component mount
  React.useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken && !authState.isLoading) {
      loadAccessControlData();
    }
  }, [loadAccessControlData, authState.isAuthenticated, authState.accessToken, authState.isLoading]);

  // Initialize permissions when user is selected
  React.useEffect(() => {
    if (showGrantAccess && brands && marketplaces && shippingPlatforms) {
      const userPermissions = getUserPermissions(showGrantAccess.id.toString());
      
      // Initialize brand access
      const brandStates: Record<number, boolean> = {};
      brands.forEach(brand => {
        const hasAccess = userPermissions.brandAccess.some(b => b.id === brand.id && b.isActive);
        brandStates[brand.id] = hasAccess;
      });
      setBrandAccess(brandStates);

      // Initialize marketplace access
      const marketplaceStates: Record<number, boolean> = {};
      marketplaces.forEach(marketplace => {
        const hasAccess = userPermissions.marketplaceAccess.some(m => m.id === marketplace.id && m.isActive);
        marketplaceStates[marketplace.id] = hasAccess;
      });
      setMarketplaceAccess(marketplaceStates);

      // Initialize shipping access
      const shippingStates: Record<number, boolean> = {};
      shippingPlatforms.forEach(shipping => {
        const hasAccess = userPermissions.shippingAccess.some(s => s.id === shipping.id && s.isActive);
        shippingStates[shipping.id] = hasAccess;
      });
      setShippingAccess(shippingStates);
    }
  }, [showGrantAccess, getUserPermissions, brands, marketplaces, shippingPlatforms]);

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
   * Get permission count for a user
   */
  const getPermissionCount = (user: DetailedUser, type: 'brands' | 'marketplaces' | 'shippingPlatforms') => {
    const counts = getPermissionCounts(user.id.toString());
    switch (type) {
      case 'brands':
        return counts.brands.granted;
      case 'marketplaces':
        return counts.marketplaces.granted;
      case 'shippingPlatforms':
        return counts.shipping.granted;
      default:
        return 0;
    }
  };

  /**
   * Get total permission count for a user
   */
  const getTotalCount = (user: DetailedUser, type: 'brands' | 'marketplaces' | 'shippingPlatforms') => {
    const counts = getPermissionCounts(user.id.toString());
    switch (type) {
      case 'brands':
        return counts.brands.total || (brands?.length || 0);
      case 'marketplaces':
        return counts.marketplaces.total || (marketplaces?.length || 0);
      case 'shippingPlatforms':
        return counts.shipping.total || (shippingPlatforms?.length || 0);
      default:
        return 0;
    }
  };

  /**
   * Get username from user object (uses actual username field from API)
   */
  const getDisplayUsername = (user: DetailedUser) => {
    return user.username || user.email.split('@')[0];
  };

  /**
   * Handle brand access toggle
   */
  const handleBrandToggle = async (brandId: number, checked: boolean) => {
    if (!showGrantAccess || !authState.accessToken) return;

    const toggleKey = `brand-${brandId}`;
    setTogglingItems(prev => new Set(prev).add(toggleKey));

    try {
      await AccessControlService.toggleBrandAccess(
        showGrantAccess.id.toString(),
        brandId,
        authState.accessToken
      );

      // Update local state
      setBrandAccess(prev => ({
        ...prev,
        [brandId]: checked
      }));

      // Update permissions store
      const userPermissions = getUserPermissions(showGrantAccess.id.toString());
      const updatedBrandAccess = userPermissions.brandAccess.map(brand => 
        brand.id === brandId ? { ...brand, isActive: checked } : brand
      );
      
      updateUserPermissions(showGrantAccess.id.toString(), {
        ...userPermissions,
        brandAccess: updatedBrandAccess
      });

      console.log(`Brand access toggled: ${brandId} -> ${checked}`);
    } catch (error: any) {
      console.error('Failed to toggle brand access:', error);
      setError(error.message || 'Failed to toggle brand access');
    } finally {
      setTogglingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(toggleKey);
        return newSet;
      });
    }
  };

  /**
   * Handle marketplace access toggle
   */
  const handleMarketplaceToggle = async (marketplaceId: number, checked: boolean) => {
    if (!showGrantAccess || !authState.accessToken) return;

    const toggleKey = `marketplace-${marketplaceId}`;
    setTogglingItems(prev => new Set(prev).add(toggleKey));

    try {
      await AccessControlService.toggleMarketplaceAccess(
        showGrantAccess.id.toString(),
        marketplaceId,
        authState.accessToken
      );

      // Update local state
      setMarketplaceAccess(prev => ({
        ...prev,
        [marketplaceId]: checked
      }));

      // Update permissions store
      const userPermissions = getUserPermissions(showGrantAccess.id.toString());
      const updatedMarketplaceAccess = userPermissions.marketplaceAccess.map(marketplace => 
        marketplace.id === marketplaceId ? { ...marketplace, isActive: checked } : marketplace
      );
      
      updateUserPermissions(showGrantAccess.id.toString(), {
        ...userPermissions,
        marketplaceAccess: updatedMarketplaceAccess
      });

      console.log(`Marketplace access toggled: ${marketplaceId} -> ${checked}`);
    } catch (error: any) {
      console.error('Failed to toggle marketplace access:', error);
      setError(error.message || 'Failed to toggle marketplace access');
    } finally {
      setTogglingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(toggleKey);
        return newSet;
      });
    }
  };

  /**
   * Handle shipping access toggle
   */
  const handleShippingToggle = async (shippingId: number, checked: boolean) => {
    if (!showGrantAccess || !authState.accessToken) return;

    const toggleKey = `shipping-${shippingId}`;
    setTogglingItems(prev => new Set(prev).add(toggleKey));

    try {
      await AccessControlService.toggleShippingAccess(
        showGrantAccess.id.toString(),
        shippingId,
        authState.accessToken
      );

      // Update local state
      setShippingAccess(prev => ({
        ...prev,
        [shippingId]: checked
      }));

      // Update permissions store
      const userPermissions = getUserPermissions(showGrantAccess.id.toString());
      const updatedShippingAccess = userPermissions.shippingAccess.map(shipping => 
        shipping.id === shippingId ? { ...shipping, isActive: checked } : shipping
      );
      
      updateUserPermissions(showGrantAccess.id.toString(), {
        ...userPermissions,
        shippingAccess: updatedShippingAccess
      });

      console.log(`Shipping access toggled: ${shippingId} -> ${checked}`);
    } catch (error: any) {
      console.error('Failed to toggle shipping access:', error);
      setError(error.message || 'Failed to toggle shipping access');
    } finally {
      setTogglingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(toggleKey);
        return newSet;
      });
    }
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
                          <div className="font-medium text-gray-800">{getDisplayUsername(user)}</div>
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
                <div className="text-lg font-semibold text-gray-800">View Access - {getDisplayUsername(showGrantAccess)}</div>
                <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => setShowGrantAccess(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              {/* Loading state for access control data */}
              {isLoadingAccessData && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-blue-600" />
                    <div className="text-blue-800 text-sm">
                      Loading access control data...
                    </div>
                  </div>
                </div>
              )}

              {/* Super User Toggle */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Super User Mode</h3>
                      <p className="text-sm text-gray-600">Enable all access permissions at once</p>
                    </div>
                  </div>
          <AppleToggle
            checked={superUserMode}
            onChange={(checked) => {
              setSuperUserMode(checked);
              if (checked) {
                // Enable all toggles
                const allBrands = brands.reduce((acc, brand) => ({ ...acc, [brand.id]: true }), {});
                const allMarketplaces = marketplaces.reduce((acc, marketplace) => ({ ...acc, [marketplace.id]: true }), {});
                const allShipping = shippingPlatforms.reduce((acc, shipping) => ({ ...acc, [shipping.id]: true }), {});
                setBrandAccess(allBrands);
                setMarketplaceAccess(allMarketplaces);
                setShippingAccess(allShipping);
              } else {
                // Disable all toggles
                setBrandAccess({});
                setMarketplaceAccess({});
                setShippingAccess({});
              }
            }}
            size="lg"
          />
                </div>
              </div>

              {/* Grid Layout - All Categories */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Brands Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Brands</h3>
                    <span className="text-sm text-gray-500">
                      ({Object.values(brandAccess).filter(Boolean).length}/{brands?.length || 0})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {brands?.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{brand.name}</div>
                          <div className="text-sm text-gray-500">{brand.description}</div>
                        </div>
                        <AppleToggle
                          checked={brandAccess[brand.id] || false}
                          onChange={(checked) => handleBrandToggle(brand.id, checked)}
                          disabled={togglingItems.has(`brand-${brand.id}`)}
                          size="md"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Marketplaces Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Marketplaces</h3>
                    <span className="text-sm text-gray-500">
                      ({Object.values(marketplaceAccess).filter(Boolean).length}/{marketplaces?.length || 0})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {marketplaces?.map((marketplace) => (
                      <div key={marketplace.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{marketplace.name}</div>
                          <div className="text-sm text-gray-500">{marketplace.description}</div>
                        </div>
                        <AppleToggle
                          checked={marketplaceAccess[marketplace.id] || false}
                          onChange={(checked) => handleMarketplaceToggle(marketplace.id, checked)}
                          disabled={togglingItems.has(`marketplace-${marketplace.id}`)}
                          size="md"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Platforms Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Shipping Platforms</h3>
                    <span className="text-sm text-gray-500">
                      ({Object.values(shippingAccess).filter(Boolean).length}/{shippingPlatforms?.length || 0})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {shippingPlatforms?.map((shipping) => (
                      <div key={shipping.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{shipping.name}</div>
                          <div className="text-sm text-gray-500">{shipping.description}</div>
                        </div>
                        <AppleToggle
                          checked={shippingAccess[shipping.id] || false}
                          onChange={(checked) => handleShippingToggle(shipping.id, checked)}
                          disabled={togglingItems.has(`shipping-${shipping.id}`)}
                          size="md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowGrantAccess(null)}
                  className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-6 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
