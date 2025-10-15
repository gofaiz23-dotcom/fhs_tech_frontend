"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";
import { Settings, AlertCircle, RefreshCw, Search } from "lucide-react";
import { AdminService, AdminUtils } from "../../lib/admin";
import { useAuth } from "../../lib/auth";
import type { DetailedUser } from "../../lib/admin/types";
import AppleToggle from "../../components/AppleToggle";
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
  const [searchTerm, setSearchTerm] = React.useState('');

  // Loading state for toggle operations
  const [togglingItems, setTogglingItems] = React.useState<Set<string>>(new Set());
  const [isSavingChanges, setIsSavingChanges] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // State for toggle switches
  const [brandAccess, setBrandAccess] = React.useState<Record<number, boolean>>({});
  const [marketplaceAccess, setMarketplaceAccess] = React.useState<Record<number, boolean>>({});
  const [shippingAccess, setShippingAccess] = React.useState<Record<number, boolean>>({});

  // Original permission states for comparison
  const [originalPermissions, setOriginalPermissions] = React.useState<{
    brands: Record<number, boolean>;
    marketplaces: Record<number, boolean>;
    shipping: Record<number, boolean>;
  }>({
    brands: {},
    marketplaces: {},
    shipping: {}
  });

  // Flag to prevent reinitialization when user is making changes
  const [hasInitialized, setHasInitialized] = React.useState(false);

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
    if (showGrantAccess && brands && marketplaces && shippingPlatforms && !hasInitialized) {
      // Check if user is admin (super user)
      const isAdmin = showGrantAccess.role === 'ADMIN';
      
      if (isAdmin) {
        // For admin users, use their actual permissions from API data (same as regular users)
        const brandStates: Record<number, boolean> = {};
        brands.forEach((brand: Brand) => {
          const hasAccess = showGrantAccess.brandAccess.some(b => b.id === brand.id && b.isActive);
          brandStates[brand.id] = hasAccess;
        });
        setBrandAccess(brandStates);

        const marketplaceStates: Record<number, boolean> = {};
        marketplaces.forEach((marketplace: Marketplace) => {
          const hasAccess = showGrantAccess.marketplaceAccess.some(m => m.id === marketplace.id && m.isActive);
          marketplaceStates[marketplace.id] = hasAccess;
        });
        setMarketplaceAccess(marketplaceStates);

        const shippingStates: Record<number, boolean> = {};
        shippingPlatforms.forEach((shipping: ShippingPlatform) => {
          const hasAccess = showGrantAccess.shippingAccess.some(s => s.id === shipping.id && s.isActive);
          shippingStates[shipping.id] = hasAccess;
        });
        setShippingAccess(shippingStates);
        
        // Store original permissions for admin
        setOriginalPermissions({
          brands: brandStates,
          marketplaces: marketplaceStates,
          shipping: shippingStates
        });
      } else {
        // For regular users, use their actual permissions from API data
        const brandStates: Record<number, boolean> = {};
        brands.forEach((brand: Brand) => {
          const hasAccess = showGrantAccess.brandAccess.some(b => b.id === brand.id && b.isActive);
          brandStates[brand.id] = hasAccess;
        });
        setBrandAccess(brandStates);

        const marketplaceStates: Record<number, boolean> = {};
        marketplaces.forEach((marketplace: Marketplace) => {
          const hasAccess = showGrantAccess.marketplaceAccess.some(m => m.id === marketplace.id && m.isActive);
          marketplaceStates[marketplace.id] = hasAccess;
        });
        setMarketplaceAccess(marketplaceStates);

        const shippingStates: Record<number, boolean> = {};
        shippingPlatforms.forEach((shipping: ShippingPlatform) => {
          const hasAccess = showGrantAccess.shippingAccess.some(s => s.id === shipping.id && s.isActive);
          shippingStates[shipping.id] = hasAccess;
        });
        setShippingAccess(shippingStates);
        
        // Store original permissions for regular users
        setOriginalPermissions({
          brands: brandStates,
          marketplaces: marketplaceStates,
          shipping: shippingStates
        });
      }
      
      setHasInitialized(true);
    }
  }, [showGrantAccess, brands, marketplaces, shippingPlatforms, hasInitialized]);

  // Reset initialization flag when modal is closed
  React.useEffect(() => {
    if (!showGrantAccess) {
      setHasInitialized(false);
      setSaveSuccess(false);
      setError(null);
    }
  }, [showGrantAccess]);

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
   * Get permission count for a user from API data
   */
  const getPermissionCount = (user: DetailedUser, type: 'brands' | 'marketplaces' | 'shippingPlatforms') => {
    // For admin users, return all available items
    if (user.role === 'ADMIN') {
      switch (type) {
        case 'brands':
          return brands?.length || 0;
        case 'marketplaces':
          return marketplaces?.length || 0;
        case 'shippingPlatforms':
          return shippingPlatforms?.length || 0;
        default:
          return 0;
      }
    }

    // For regular users, count active permissions
    switch (type) {
      case 'brands':
        return user.brandAccess.filter(b => b.isActive).length;
      case 'marketplaces':
        return user.marketplaceAccess.filter(m => m.isActive).length;
      case 'shippingPlatforms':
        return user.shippingAccess.filter(s => s.isActive).length;
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
        return brands?.length || 0;
      case 'marketplaces':
        return marketplaces?.length || 0;
      case 'shippingPlatforms':
        return shippingPlatforms?.length || 0;
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
   * Check if there are any permission changes
   */
  const hasPermissionChanges = () => {
    const brandChanged = Object.keys(brandAccess).some(id => {
      const current = brandAccess[Number(id)];
      const original = originalPermissions.brands[Number(id)];
      if (current !== original) {
        console.log(`Brand ${id} changed: ${original} -> ${current}`);
      }
      return current !== original;
    });
    const marketplaceChanged = Object.keys(marketplaceAccess).some(id => {
      const current = marketplaceAccess[Number(id)];
      const original = originalPermissions.marketplaces[Number(id)];
      if (current !== original) {
        console.log(`Marketplace ${id} changed: ${original} -> ${current}`);
      }
      return current !== original;
    });
    const shippingChanged = Object.keys(shippingAccess).some(id => {
      const current = shippingAccess[Number(id)];
      const original = originalPermissions.shipping[Number(id)];
      if (current !== original) {
        console.log(`Shipping ${id} changed: ${original} -> ${current}`);
      }
      return current !== original;
    });
    
    const hasChanges = brandChanged || marketplaceChanged || shippingChanged;
    console.log('Permission changes detected:', { brandChanged, marketplaceChanged, shippingChanged, hasChanges });
    return hasChanges;
  };

  /**
   * Save all permission changes
   */
  const savePermissionChanges = async () => {
    if (!showGrantAccess || !authState.accessToken || !hasPermissionChanges()) return;

    setIsSavingChanges(true);
    setError(null);

    try {
      const changes: Array<{ type: 'brand' | 'marketplace' | 'shipping'; id: number; enabled: boolean }> = [];

      // Collect all brand changes
      Object.keys(brandAccess).forEach(id => {
        const brandId = Number(id);
        const currentState = brandAccess[brandId];
        const originalState = originalPermissions.brands[brandId];
        if (currentState !== originalState) {
          changes.push({ type: 'brand', id: brandId, enabled: currentState });
        }
      });

      // Collect all marketplace changes
      Object.keys(marketplaceAccess).forEach(id => {
        const marketplaceId = Number(id);
        const currentState = marketplaceAccess[marketplaceId];
        const originalState = originalPermissions.marketplaces[marketplaceId];
        if (currentState !== originalState) {
          changes.push({ type: 'marketplace', id: marketplaceId, enabled: currentState });
        }
      });

      // Collect all shipping changes
      Object.keys(shippingAccess).forEach(id => {
        const shippingId = Number(id);
        const currentState = shippingAccess[shippingId];
        const originalState = originalPermissions.shipping[shippingId];
        if (currentState !== originalState) {
          changes.push({ type: 'shipping', id: shippingId, enabled: currentState });
        }
      });

      // Execute all changes
      const promises = changes.map(change => {
        if (!authState.accessToken) return Promise.resolve();
        
        switch (change.type) {
          case 'brand':
            return AccessControlService.toggleBrandAccess(
              showGrantAccess.id.toString(),
              change.id,
              authState.accessToken
            );
          case 'marketplace':
            return AccessControlService.toggleMarketplaceAccess(
              showGrantAccess.id.toString(),
              change.id,
              authState.accessToken
            );
          case 'shipping':
            return AccessControlService.toggleShippingAccess(
              showGrantAccess.id.toString(),
              change.id,
              authState.accessToken
            );
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);

      // Refresh the users data to get the latest permissions from backend
      try {
        const updatedUsersResponse = await AdminService.getAllUsers(authState.accessToken);
        setUsers(updatedUsersResponse.users);
        
        // Update the selected user state with the latest data
        const updatedUser = updatedUsersResponse.users.find(u => u.id === showGrantAccess.id);
        if (updatedUser) {
          setShowGrantAccess(updatedUser);
        }
      } catch (refreshError) {
        console.error('Failed to refresh users data:', refreshError);
        // Fallback to local update if refresh fails
        setUsers(prevUsers => prevUsers.map(user => {
          if (user.id === showGrantAccess.id) {
            const updatedBrandAccess = user.brandAccess.map(brand => 
              changes.some(c => c.type === 'brand' && c.id === brand.id) 
                ? { ...brand, isActive: changes.find(c => c.type === 'brand' && c.id === brand.id)?.enabled || brand.isActive }
                : brand
            );
            const updatedMarketplaceAccess = user.marketplaceAccess.map((marketplace: any) => 
              changes.some(c => c.type === 'marketplace' && c.id === marketplace.id) 
                ? { ...marketplace, isActive: changes.find(c => c.type === 'marketplace' && c.id === marketplace.id)?.enabled || marketplace.isActive }
                : marketplace
            );
            const updatedShippingAccess = user.shippingAccess.map(shipping => 
              changes.some(c => c.type === 'shipping' && c.id === shipping.id) 
                ? { ...shipping, isActive: changes.find(c => c.type === 'shipping' && c.id === shipping.id)?.enabled || shipping.isActive }
                : shipping
            );
            
            return { 
              ...user, 
              brandAccess: updatedBrandAccess,
              marketplaceAccess: updatedMarketplaceAccess,
              shippingAccess: updatedShippingAccess
            };
          }
          return user;
        }));
      }

      // Update original permissions to reflect saved state
      setOriginalPermissions({
        brands: { ...brandAccess },
        marketplaces: { ...marketplaceAccess },
        shipping: { ...shippingAccess }
      });

      console.log(`Saved ${changes.length} permission changes for user ${showGrantAccess.id}`);
      
      // Show success message
      setError(null);
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Failed to save permission changes:', error);
      setError(error.message || 'Failed to save permission changes');
    } finally {
      setIsSavingChanges(false);
    }
  };

  /**
   * Allow all permissions for the user
   */
  const handleAllowAll = () => {
    if (!brands || !marketplaces || !shippingPlatforms) return;

    // Enable all brands
    const allBrands = brands.reduce((acc, brand) => ({ ...acc, [brand.id]: true }), {});
    setBrandAccess(allBrands);

    // Enable all marketplaces
    const allMarketplaces = marketplaces.reduce((acc, marketplace: Marketplace) => ({ ...acc, [marketplace.id]: true }), {});
    setMarketplaceAccess(allMarketplaces);

    // Enable all shipping platforms
    const allShipping = shippingPlatforms.reduce((acc, shipping) => ({ ...acc, [shipping.id]: true }), {});
    setShippingAccess(allShipping);

    console.log('All permissions enabled');
  };

  /**
   * Remove all permissions for the user
   */
  const handleRemoveAll = () => {
    if (!brands || !marketplaces || !shippingPlatforms) return;

    // Disable all brands
    const noBrands = brands.reduce((acc, brand) => ({ ...acc, [brand.id]: false }), {});
    setBrandAccess(noBrands);

    // Disable all marketplaces
    const noMarketplaces = marketplaces.reduce((acc, marketplace: Marketplace) => ({ ...acc, [marketplace.id]: false }), {});
    setMarketplaceAccess(noMarketplaces);

    // Disable all shipping platforms
    const noShipping = shippingPlatforms.reduce((acc, shipping) => ({ ...acc, [shipping.id]: false }), {});
    setShippingAccess(noShipping);

    console.log('All permissions disabled');
  };

  /**
   * Handle brand access toggle
   */
  const handleBrandToggle = (brandId: number, checked: boolean) => {
    if (!showGrantAccess) return;

    // Update local state only
    setBrandAccess(prev => {
      const newState = {
        ...prev,
        [brandId]: checked
      };
      console.log('Brand access state updated:', newState);
      return newState;
    });

    console.log(`Brand access toggled: ${brandId} -> ${checked}`);
  };

  /**
   * Handle marketplace access toggle
   */
  const handleMarketplaceToggle = (marketplaceId: number, checked: boolean) => {
    if (!showGrantAccess) return;

    // Update local state only
    setMarketplaceAccess(prev => {
      const newState = {
        ...prev,
        [marketplaceId]: checked
      };
      console.log('Marketplace access state updated:', newState);
      return newState;
    });

    console.log(`Marketplace access toggled: ${marketplaceId} -> ${checked}`);
  };

  /**
   * Handle shipping access toggle
   */
  const handleShippingToggle = (shippingId: number, checked: boolean) => {
    if (!showGrantAccess) return;

    // Update local state only
    setShippingAccess(prev => {
      const newState = {
        ...prev,
        [shippingId]: checked
      };
      console.log('Shipping access state updated:', newState);
      return newState;
    });

    console.log(`Shipping access toggled: ${shippingId} -> ${checked}`);
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

  // Filter users based on search term
  const filteredUsers = React.useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">Access Control</h2>
            {!isLoading && (
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} total
                {searchTerm && ` (filtered from ${users.length})`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-soft pl-10 pr-4 py-2 w-64"
              />
            </div>
            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="btn-ghost text-sm flex items-center gap-2 disabled:opacity-50"
              title="Refresh users"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
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

        {/* Success Message */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="text-green-800 font-medium">Success</div>
              <div className="text-green-700 text-sm">Permission changes saved successfully!</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="card p-8 text-center">
            <div className="loader mx-auto mb-4"></div>
            <div className="text-secondary-600">Loading users...</div>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-secondary-600 dark:text-slate-400 border-b bg-secondary-50 dark:bg-slate-800">
                    <th className="py-3 px-4 min-w-[200px]">User</th>
                    <th className="py-3 px-4 min-w-[100px]">Status</th>
                    <th className="py-3 px-4 min-w-[120px]">Brands</th>
                    <th className="py-3 px-4 min-w-[140px]">Marketplaces</th>
                    <th className="py-3 px-4 min-w-[120px]">Shipping</th>
                    <th className="py-3 px-4 min-w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b last:border-b-0 hover:bg-secondary-50 dark:hover:bg-slate-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <span className={`h-8 w-8 rounded-full ${getAvatarClass(user.id)}`}></span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 dark:text-slate-100">{getDisplayUsername(user)}</div>
                            <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                              {user.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {user.loginStats?.currentSession?.isActive ? (
                          <span className="text-green-600 animate-pulse text-sm font-medium">Active</span>
                        ) : (
                          <span className="text-gray-500 dark:text-slate-400 text-sm">Offline</span>
                        )}
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
                          className="btn-primary text-xs px-3 py-2 flex items-center gap-1"
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
                      <td className="py-8 px-4 text-center text-gray-500 dark:text-slate-400" colSpan={6}>
                        No users found. {authState.user?.role === 'ADMIN' ? 'Create users in Manage Users to get started.' : 'Contact your administrator to add users.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showGrantAccess && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="card p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-semibold text-gray-800 dark:text-slate-100">View Access - {getDisplayUsername(showGrantAccess)}</div>
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
                    <div className="loader w-4 h-4"></div>
                    <div className="text-blue-800 text-sm">
                      Loading access control data...
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Actions */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-slate-100">Bulk Actions</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Quickly manage all permissions at once</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={handleAllowAll}
                      className="btn-success text-sm px-3 sm:px-4 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="hidden sm:inline">Allow All</span>
                      <span className="sm:hidden">Allow All</span>
                    </button>
                    <button
                      onClick={handleRemoveAll}
                      className="btn-danger text-sm px-3 sm:px-4 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="hidden sm:inline">Remove All</span>
                      <span className="sm:hidden">Remove All</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Layout - All Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Brands Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Brands</h3>
                    <span className="text-sm text-gray-500 dark:text-slate-400">
                      ({Object.values(brandAccess).filter(Boolean).length}/{brands?.length || 0})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {brands?.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-slate-100">{brand.name}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{brand.description}</div>
                        </div>
                        <AppleToggle
                          checked={brandAccess[brand.id] || false}
                          onChange={(checked) => handleBrandToggle(brand.id, checked)}
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
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Marketplaces</h3>
                    <span className="text-sm text-gray-500 dark:text-slate-400">
                      ({Object.values(marketplaceAccess).filter(Boolean).length}/{marketplaces?.length || 0})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {marketplaces?.map((marketplace) => (
                      <div key={marketplace.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-slate-100">{marketplace.name}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{marketplace.description}</div>
                        </div>
                        <AppleToggle
                          checked={marketplaceAccess[marketplace.id] || false}
                          onChange={(checked) => handleMarketplaceToggle(marketplace.id, checked)}
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
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100">Shipping Platforms</h3>
                    <span className="text-sm text-gray-500 dark:text-slate-400">
                      ({Object.values(shippingAccess).filter(Boolean).length}/{shippingPlatforms?.length || 0})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {shippingPlatforms?.map((shipping) => (
                      <div key={shipping.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-slate-100">{shipping.name}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{shipping.description}</div>
                        </div>
                        <AppleToggle
                          checked={shippingAccess[shipping.id] || false}
                          onChange={(checked) => handleShippingToggle(shipping.id, checked)}
                          size="md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  {hasPermissionChanges() && (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      You have unsaved changes
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowGrantAccess(null)}
                    className="btn-secondary text-sm px-4 sm:px-6 py-2 disabled:opacity-50 w-full sm:w-auto"
                    disabled={isSavingChanges}
                  >
                    Close
                  </button>
                  <button
                    onClick={savePermissionChanges}
                    disabled={!hasPermissionChanges() || isSavingChanges}
                    className="btn-primary text-sm px-4 sm:px-6 py-2 disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    {isSavingChanges && <div className="loader w-4 h-4"></div>}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
