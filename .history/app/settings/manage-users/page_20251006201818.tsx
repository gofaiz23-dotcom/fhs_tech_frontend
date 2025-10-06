"use client";
import SettingsLayout from "../_components/SettingsLayout";
import React from "react";
import { Pencil, Trash2, Eye, AlertCircle, Loader2, RefreshCw, Search, CheckCircle } from "lucide-react";
import { AdminService, AdminUtils } from "../../lib/admin";
import { useAuth, AuthService } from "../../lib/auth";
import type { DetailedUser } from "../../lib/admin/types";
import AppleToggle from "../../components/AppleToggle";
import { AccessControlService, type Brand, type Marketplace, type ShippingPlatform } from "../../lib/access-control";
import { activityLogger } from "../../lib/activity-logger";
// import { usePermissionsStore } from "../../lib/stores/permissionsStore"; // No longer needed

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
  
  // Permissions store (no longer needed - using API data directly)

  // API data state
  const [users, setUsers] = React.useState<DetailedUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

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
  const [isToggling, setIsToggling] = React.useState<Record<string, boolean>>({});

  // Available items from API
  const [availableBrands, setAvailableBrands] = React.useState<Brand[]>([]);
  const [availableMarketplaces, setAvailableMarketplaces] = React.useState<Marketplace[]>([]);
  const [availableShipping, setAvailableShipping] = React.useState<ShippingPlatform[]>([]);
  const [isLoadingAvailableItems, setIsLoadingAvailableItems] = React.useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = React.useState('');

  // Mock data removed - now using actual API data

  // Initialize toggle states when user is selected
  React.useEffect(() => {
    if (showAccessFor) {
      // Initialize brand access from API data
      const brandStates: Record<number, boolean> = {};
      showAccessFor.brandAccess?.forEach(brand => {
        brandStates[brand.id] = brand.isActive;
      });
      setBrandAccess(brandStates);

      // Initialize marketplace access from API data
      const marketplaceStates: Record<number, boolean> = {};
      showAccessFor.marketplaceAccess?.forEach(marketplace => {
        marketplaceStates[marketplace.id] = marketplace.isActive;
      });
      setMarketplaceAccess(marketplaceStates);

      // Initialize shipping access from API data
      const shippingStates: Record<number, boolean> = {};
      showAccessFor.shippingAccess?.forEach(shipping => {
        shippingStates[shipping.id] = shipping.isActive;
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
      
      const response = await AdminService.getAllUsersWithAccess(authState.accessToken);
      console.log('🔍 Load Users: API response:', response);
      console.log('🔍 Load Users: Users count:', response.users?.length);
      setUsers(response.users);
      console.log('🔍 Load Users: Users state updated');
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

  // Load available items from API
  const loadAvailableItems = React.useCallback(async () => {
    if (!authState.accessToken) return;

    try {
      setIsLoadingAvailableItems(true);
      setError(null);
      
      const [brandsResponse, marketplacesResponse, shippingResponse] = await Promise.all([
        AccessControlService.getBrands(authState.accessToken),
        AccessControlService.getMarketplaces(authState.accessToken),
        AccessControlService.getShippingPlatforms(authState.accessToken)
      ]);
      
      setAvailableBrands(brandsResponse.brands || []);
      setAvailableMarketplaces(marketplacesResponse.marketplaces || []);
      setAvailableShipping(shippingResponse.shippingCompanies || []);
    } catch (error: any) {
      console.error('Failed to load available items:', error);
      setError(error.message || 'Failed to load available items');
    } finally {
      setIsLoadingAvailableItems(false);
    }
  }, [authState.accessToken]);

  // Load users on component mount
  React.useEffect(() => {
    // Only load users if authentication is complete and we have a token
    if (authState.isAuthenticated && authState.accessToken && !authState.isLoading) {
      loadUsers();
      loadAvailableItems();
    }
  }, [loadUsers, loadAvailableItems, authState.isAuthenticated, authState.accessToken, authState.isLoading]);

  /**
   * Handle user registration (only for creating new users)
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isEditing) {
        console.log('🔍 Form: Starting user update...');
        console.log('🔍 Form: Current form data:', form);
        console.log('🔍 Form: isSubmitting state:', isSubmitting);
        
        // Handle updates via separate functions
        await handleUpdateUser();
        
        // Check if username was in the form but might have been skipped
        const currentUser = users.find(u => u.id === isEditing);
        if (currentUser && getDisplayUsername(currentUser) !== form.username) {
          setSuccessMessage('User updated successfully! (Note: Username update may not be available yet)');
        } else {
          setSuccessMessage('User updated successfully!');
        }
        console.log('✅ Form: User update completed');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
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
        setSuccessMessage('User created successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
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
      console.log('🔍 Update User: Starting update for user ID:', isEditing);
      console.log('🔍 Update User: Current user:', currentUser);
      console.log('🔍 Update User: Form data:', form);
      
      const changes: { field: string; oldValue: any; newValue: any }[] = [];
      const adminUser = { email: authState.user?.email || 'unknown', username: authState.user?.username };

      // Update username if changed
      if (!currentUser) {
        console.error('❌ Update User: Current user not found');
        setError('User not found');
        return;
      }
      
      const currentUsername = getDisplayUsername(currentUser);
      console.log('🔍 Update User: Current username:', currentUsername);
      console.log('🔍 Update User: Form username:', form.username);
      console.log('🔍 Update User: Username changed?', currentUsername !== form.username);
      
      if (currentUsername !== form.username) {
        console.log('🔍 Update User: Username update requested:', form.username);
        changes.push({ field: 'username', oldValue: currentUsername, newValue: form.username });
        
        try {
          await AdminService.updateUsername(isEditing, form.username, authState.accessToken);
          console.log('✅ Update User: Username updated successfully');
        } catch (usernameError: any) {
          console.error('❌ Username update failed:', usernameError);
          
          // Check if it's a 404 error (endpoint not implemented) or network error
          if (usernameError.statusCode === 404 || 
              usernameError.message?.includes('404') || 
              usernameError.message?.includes('Not Found') ||
              usernameError.message?.includes('Network error') ||
              usernameError.status === 404) {
            console.log('⚠️ Username update endpoint not implemented yet, skipping...');
            // Remove username from changes since it failed
            changes.pop();
          } else {
            setError(`Failed to update username: ${usernameError.message || 'Unknown error'}`);
            throw usernameError; // Re-throw to stop the update process
          }
        }
      }

      // Update email if changed
      if (currentUser.email !== form.email) {
        console.log('🔍 Update User: Updating email from', currentUser.email, 'to', form.email);
        changes.push({ field: 'email', oldValue: currentUser.email, newValue: form.email });
        await AdminService.updateUserEmail(isEditing, form.email, authState.accessToken);
        console.log('✅ Update User: Email updated successfully');
      }

      // Update password if provided
      if (form.password && form.password !== '••••••••') {
        console.log('🔍 Update User: Updating password');
        changes.push({ field: 'password', oldValue: '••••••••', newValue: '••••••••' });
        await AdminService.updateUserPassword(isEditing, form.password, authState.accessToken);
        console.log('✅ Update User: Password updated successfully');
      }

      // Update role if changed
      if (currentUser.role !== form.role) {
        console.log('🔍 Update User: Updating role from', currentUser.role, 'to', form.role);
        changes.push({ field: 'role', oldValue: currentUser.role, newValue: form.role });
        await AdminService.updateUserRole(isEditing, form.role, authState.accessToken);
        console.log('✅ Update User: Role updated successfully');
      }

      // Log the activity if there were changes
      if (changes.length > 0) {
        activityLogger.logUserEdit(
          currentUser.email,
          getDisplayUsername(currentUser),
          changes,
          adminUser
        );
      }

      // Show warning if username update was skipped
      if (currentUsername !== form.username && changes.length === 0) {
        console.log('⚠️ No changes were made - username update was skipped');
        setSuccessMessage('User updated successfully! (Note: Username update was skipped - endpoint may not be available)');
      } else if (currentUsername !== form.username && changes.length > 0) {
        console.log('⚠️ Username update was skipped, but other changes were made');
        setSuccessMessage('User updated successfully! (Note: Username update was skipped - endpoint may not be available)');
      }

      // Reload users to get updated data
      console.log('🔄 Update User: Reloading users...');
      await loadUsers();
      console.log('✅ Update User: Users reloaded successfully');
      
      // Reset form
      console.log('🔍 Update User: Resetting form and closing modal...');
      setForm({ username: "", email: "", password: "", role: 'USER' });
      setIsEditing(null);
      setOpen(false);
      console.log('🔍 Update User: Form reset and modal closed');
      
      console.log('✅ Update User: All updates completed successfully');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      setError(error.message || 'Failed to update user');
      throw error;
    } finally {
      setIsSubmitting(false);
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

  /**
   * Toggle brand access for a user
   */
  const handleToggleBrandAccess = async (userId: number, brandId: number) => {
    if (!authState.accessToken || !showAccessFor) return;
    
    const toggleKey = `brand-${userId}-${brandId}`;
    setIsToggling(prev => ({ ...prev, [toggleKey]: true }));
    
    try {
      console.log('Calling toggleBrandAccess...');
      
      // Get current state before toggle
      const currentState = brandAccess[brandId];
      const brand = availableBrands.find(b => b.id === brandId);
      const brandName = brand?.name || `Brand ${brandId}`;
      
      // @ts-ignore - Temporary workaround for TypeScript issue
      await AdminService.toggleBrandAccess(userId, brandId, authState.accessToken);
      
      // Update local state
      setBrandAccess(prev => ({
        ...prev,
        [brandId]: !prev[brandId]
      }));
      
      // Log the activity
      const adminUser = { email: authState.user?.email || 'unknown', username: authState.user?.username };
      activityLogger.logPermissionChange(
        showAccessFor.email,
        'brand',
        brandName,
        !currentState ? 'granted' : 'revoked',
        adminUser
      );
      
      // Reload users to get updated data
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to toggle brand access:', error);
      setError(error.message || 'Failed to toggle brand access');
    } finally {
      setIsToggling(prev => ({ ...prev, [toggleKey]: false }));
    }
  };

  /**
   * Toggle marketplace access for a user
   */
  const handleToggleMarketplaceAccess = async (userId: number, marketplaceId: number) => {
    if (!authState.accessToken || !showAccessFor) return;
    
    const toggleKey = `marketplace-${userId}-${marketplaceId}`;
    setIsToggling(prev => ({ ...prev, [toggleKey]: true }));
    
    try {
      // Get current state before toggle
      const currentState = marketplaceAccess[marketplaceId];
      const marketplace = availableMarketplaces.find(m => m.id === marketplaceId);
      const marketplaceName = marketplace?.name || `Marketplace ${marketplaceId}`;
      
      // @ts-ignore - Temporary workaround for TypeScript issue
      await AdminService.toggleMarketplaceAccess(userId, marketplaceId, authState.accessToken);
      
      // Update local state
      setMarketplaceAccess(prev => ({
        ...prev,
        [marketplaceId]: !prev[marketplaceId]
      }));
      
      // Log the activity
      const adminUser = { email: authState.user?.email || 'unknown', username: authState.user?.username };
      activityLogger.logPermissionChange(
        showAccessFor.email,
        'marketplace',
        marketplaceName,
        !currentState ? 'granted' : 'revoked',
        adminUser
      );
      
      // Reload users to get updated data
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to toggle marketplace access:', error);
      setError(error.message || 'Failed to toggle marketplace access');
    } finally {
      setIsToggling(prev => ({ ...prev, [toggleKey]: false }));
    }
  };

  /**
   * Toggle shipping access for a user
   */
  const handleToggleShippingAccess = async (userId: number, shippingId: number) => {
    if (!authState.accessToken || !showAccessFor) return;
    
    const toggleKey = `shipping-${userId}-${shippingId}`;
    setIsToggling(prev => ({ ...prev, [toggleKey]: true }));
    
    try {
      // Get current state before toggle
      const currentState = shippingAccess[shippingId];
      const shipping = availableShipping.find(s => s.id === shippingId);
      const shippingName = shipping?.name || `Shipping ${shippingId}`;
      
      // @ts-ignore - Temporary workaround for TypeScript issue
      await AdminService.toggleShippingAccess(userId, shippingId, authState.accessToken);
      
      // Update local state
      setShippingAccess(prev => ({
        ...prev,
        [shippingId]: !prev[shippingId]
      }));
      
      // Log the activity
      const adminUser = { email: authState.user?.email || 'unknown', username: authState.user?.username };
      activityLogger.logPermissionChange(
        showAccessFor.email,
        'shipping',
        shippingName,
        !currentState ? 'granted' : 'revoked',
        adminUser
      );
      
      // Reload users to get updated data
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to toggle shipping access:', error);
      setError(error.message || 'Failed to toggle shipping access');
    } finally {
      setIsToggling(prev => ({ ...prev, [toggleKey]: false }));
    }
  };

  // Helper functions to filter user access based on available items
  const getFilteredBrandAccess = (user: DetailedUser) => {
    if (!user.brandAccess || !availableBrands.length) return [];
    return user.brandAccess.filter(brand => 
      availableBrands.some(available => available.id === brand.id)
    );
  };

  const getFilteredMarketplaceAccess = (user: DetailedUser) => {
    if (!user.marketplaceAccess || !availableMarketplaces.length) return [];
    return user.marketplaceAccess.filter(marketplace => 
      availableMarketplaces.some(available => available.id === marketplace.id)
    );
  };

  const getFilteredShippingAccess = (user: DetailedUser) => {
    if (!user.shippingAccess || !availableShipping.length) return [];
    return user.shippingAccess.filter(shipping => 
      availableShipping.some(available => available.id === shipping.id)
    );
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    getDisplayUsername(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              className="btn-ghost text-sm flex items-center gap-2 disabled:opacity-50"
              title="Refresh users"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button 
              onClick={() => setOpen(true)} 
              className="btn-primary text-sm px-4 py-2"
              disabled={isLoading}
            >
              Create New User
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
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
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <div>
              <div className="text-green-800 font-medium">Success</div>
              <div className="text-green-700 text-sm">{successMessage}</div>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="card p-8 text-center">
            <Loader2 size={32} className="animate-spin mx-auto mb-4 text-primary-600" />
            <div className="text-secondary-600">Loading users...</div>
          </div>
        ) : (
          <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-secondary-600 border-b bg-secondary-50">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b last:border-b-0 hover:bg-secondary-50">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="relative">
                      <span className={`h-8 w-8 rounded-full ${getAvatarClass(user.id)}`}></span>
                      {/* Online status indicator */}
                      {user.loginStats?.currentSession?.isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 animate-pulse border-white rounded-full"></div>
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
                    {user.loginStats?.currentSession?.isActive ? (
                      <span className="text-green-600 text-sm font-medium">Active</span>
                    ) : (
                      <span className="text-gray-500 text-sm">Offline</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
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
                          console.log('🔍 Edit User: User data:', user);
                          console.log('🔍 Edit User: Username field:', user.username);
                          console.log('🔍 Edit User: Display username:', getDisplayUsername(user));
                          setForm({ 
                            username: user.username || user.email.split('@')[0], 
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
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td className="py-8 px-4 text-center text-gray-600" colSpan={4}>
                    {searchTerm 
                      ? 'No users match your search criteria.' 
                      : authState.user?.role === 'ADMIN' 
                        ? 'Click Create New User to get started.' 
                        : 'Contact your administrator to add users.'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}

        {open && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <form onSubmit={handleRegister} className="card p-6 w-full max-w-md space-y-4">
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
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
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
            <div className="card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-semibold text-gray-800">View Access - {getDisplayUsername(showAccessFor)}</div>
                <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={()=>setShowAccessFor(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              {/* Read-only notice */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-blue-800 text-sm">
                  <strong>Read-only view:</strong> This shows the current access permissions for this user. 
                  To modify permissions, use the Access Control page.
                </div>
              </div>
              
              {/* Show all access categories with toggle switches */}
              <div className="space-y-6">
                {/* Loading state for available items */}
                {isLoadingAvailableItems && (
                  <div className="text-center py-4">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                    <div className="text-gray-600">Loading available items...</div>
                  </div>
                )}

                {/* Brands Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Brands</h3>
                    <span className="text-sm text-gray-500">({getFilteredBrandAccess(showAccessFor).length} available)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getFilteredBrandAccess(showAccessFor).map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{brand.name}</div>
                          {brand.description && (
                            <div className="text-sm text-gray-500">{brand.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {brand.isActive ? 'Active' : 'Inactive'} • 
                            Granted: {AdminUtils.formatRelativeTime(brand.grantedAt)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            brand.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {brand.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {getFilteredBrandAccess(showAccessFor).length === 0 && (
                      <div className="col-span-full text-center py-4 text-gray-500">
                        {isLoadingAvailableItems ? 'Loading brands...' : 'No brand access available'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Marketplaces Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Marketplaces</h3>
                    <span className="text-sm text-gray-500">({getFilteredMarketplaceAccess(showAccessFor).length} available)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getFilteredMarketplaceAccess(showAccessFor).map((marketplace) => (
                      <div key={marketplace.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{marketplace.name}</div>
                          {marketplace.description && (
                            <div className="text-sm text-gray-500">{marketplace.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {marketplace.isActive ? 'Active' : 'Inactive'} • 
                            Granted: {AdminUtils.formatRelativeTime(marketplace.grantedAt)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            marketplace.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {marketplace.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {getFilteredMarketplaceAccess(showAccessFor).length === 0 && (
                      <div className="col-span-full text-center py-4 text-gray-500">
                        {isLoadingAvailableItems ? 'Loading marketplaces...' : 'No marketplace access available'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Platforms Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Shipping Platforms</h3>
                    <span className="text-sm text-gray-500">({getFilteredShippingAccess(showAccessFor).length} available)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getFilteredShippingAccess(showAccessFor).map((shipping) => (
                      <div key={shipping.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{shipping.name}</div>
                          {shipping.description && (
                            <div className="text-sm text-gray-500">{shipping.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {shipping.isActive ? 'Active' : 'Inactive'} • 
                            Granted: {AdminUtils.formatRelativeTime(shipping.grantedAt)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            shipping.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {shipping.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {getFilteredShippingAccess(showAccessFor).length === 0 && (
                      <div className="col-span-full text-center py-4 text-gray-500">
                        {isLoadingAvailableItems ? 'Loading shipping platforms...' : 'No shipping access available'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Access Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Access Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Brands:</span>
                      <span className="ml-1 font-medium">{getFilteredBrandAccess(showAccessFor).length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Marketplaces:</span>
                      <span className="ml-1 font-medium">{getFilteredMarketplaceAccess(showAccessFor).length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Shipping:</span>
                      <span className="ml-1 font-medium">{getFilteredShippingAccess(showAccessFor).length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => setShowAccessFor(null)}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="card p-6 w-full max-w-md">
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
                  className="btn-danger text-sm px-4 py-2" 
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


