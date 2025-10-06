import { create } from 'zustand';

export interface PermissionItem {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  grantedAt?: string;
}

export interface UserPermissions {
  userId: string;
  brandAccess: PermissionItem[];
  marketplaceAccess: PermissionItem[];
  shippingAccess: PermissionItem[];
}

interface PermissionsStore {
  userPermissions: Record<string, UserPermissions>;
  
  // Actions
  updateUserPermissions: (userId: string, permissions: Partial<UserPermissions>) => void;
  getUserPermissions: (userId: string) => UserPermissions;
  getPermissionCounts: (userId: string) => {
    brands: { granted: number; total: number };
    marketplaces: { granted: number; total: number };
    shipping: { granted: number; total: number };
  };
  resetUserPermissions: (userId: string) => void;
}

/**
 * Permissions store without persistence
 * 
 * Uses in-memory state management only. No localStorage persistence.
 * Permissions data is maintained during the session only and should
 * be fetched fresh from the server when needed.
 */
export const usePermissionsStore = create<PermissionsStore>()((set, get) => ({
  userPermissions: {},

  updateUserPermissions: (userId: string, permissions: Partial<UserPermissions>) => {
    set((state) => ({
      userPermissions: {
        ...state.userPermissions,
        [userId]: {
          ...state.userPermissions[userId],
          userId,
          brandAccess: permissions.brandAccess || state.userPermissions[userId]?.brandAccess || [],
          marketplaceAccess: permissions.marketplaceAccess || state.userPermissions[userId]?.marketplaceAccess || [],
          shippingAccess: permissions.shippingAccess || state.userPermissions[userId]?.shippingAccess || [],
        },
      },
    }));
  },

  getUserPermissions: (userId: string) => {
    const state = get();
    return state.userPermissions[userId] || {
      userId,
      brandAccess: [],
      marketplaceAccess: [],
      shippingAccess: [],
    };
  },

  getPermissionCounts: (userId: string) => {
    const permissions = get().getUserPermissions(userId);
    return {
      brands: {
        granted: permissions.brandAccess.filter(p => p.isActive).length,
        total: permissions.brandAccess.length,
      },
      marketplaces: {
        granted: permissions.marketplaceAccess.filter(p => p.isActive).length,
        total: permissions.marketplaceAccess.length,
      },
      shipping: {
        granted: permissions.shippingAccess.filter(p => p.isActive).length,
        total: permissions.shippingAccess.length,
      },
    };
  },

  resetUserPermissions: (userId: string) => {
    set((state) => {
      const newState = { ...state.userPermissions };
      delete newState[userId];
      return { userPermissions: newState };
    });
  },
}));
