/**
 * Admin Store using Zustand
 * 
 * This store manages admin-specific data including users, statistics,
 * and UI state for admin operations. It provides centralized state
 * management for all admin functionality.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DetailedUser, LoginSession } from '../admin/types';

interface AdminState {
  // User management data
  users: DetailedUser[];
  selectedUser: DetailedUser | null;
  usersLoading: boolean;
  usersError: string | null;
  lastUsersUpdate: number | null;
  
  // UI state
  userFormOpen: boolean;
  editingUserId: number | null;
  showUserAccess: DetailedUser | null;
  confirmDeleteUser: DetailedUser | null;
  
  // Statistics cache
  userStats: {
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    regularUsers: number;
    usersWithBrandAccess: number;
    usersWithMarketplaceAccess: number;
    usersWithShippingAccess: number;
  } | null;
  statsLoading: boolean;
  
  // Filters and sorting
  userFilters: {
    role: 'ALL' | 'ADMIN' | 'USER';
    status: 'ALL' | 'ONLINE' | 'OFFLINE';
    hasAccess: 'ALL' | 'YES' | 'NO';
  };
  userSortBy: 'name' | 'email' | 'role' | 'lastLogin';
  userSortOrder: 'asc' | 'desc';
}

interface AdminActions {
  // User management actions
  setUsers: (users: DetailedUser[]) => void;
  addUser: (user: DetailedUser) => void;
  updateUser: (userId: number, updates: Partial<DetailedUser>) => void;
  removeUser: (userId: number) => void;
  setUsersLoading: (loading: boolean) => void;
  setUsersError: (error: string | null) => void;
  clearUsersError: () => void;
  refreshUsers: () => void;
  
  // User selection
  setSelectedUser: (user: DetailedUser | null) => void;
  selectUserById: (userId: number) => void;
  
  // UI state management
  setUserFormOpen: (open: boolean) => void;
  setEditingUserId: (userId: number | null) => void;
  setShowUserAccess: (user: DetailedUser | null) => void;
  setConfirmDeleteUser: (user: DetailedUser | null) => void;
  
  // Statistics
  setUserStats: (stats: AdminState['userStats']) => void;
  setStatsLoading: (loading: boolean) => void;
  
  // Filters and sorting
  setUserFilters: (filters: Partial<AdminState['userFilters']>) => void;
  setUserSort: (sortBy: AdminState['userSortBy'], order?: AdminState['userSortOrder']) => void;
  clearFilters: () => void;
  
  // Utility actions
  getUserById: (userId: number) => DetailedUser | undefined;
  getFilteredUsers: () => DetailedUser[];
  getSortedUsers: (users: DetailedUser[]) => DetailedUser[];
  
  // Reset state
  resetAdminState: () => void;
}

type AdminStore = AdminState & AdminActions;

// Initial state
const initialState: AdminState = {
  users: [],
  selectedUser: null,
  usersLoading: false,
  usersError: null,
  lastUsersUpdate: null,
  
  userFormOpen: false,
  editingUserId: null,
  showUserAccess: null,
  confirmDeleteUser: null,
  
  userStats: null,
  statsLoading: false,
  
  userFilters: {
    role: 'ALL',
    status: 'ALL',
    hasAccess: 'ALL',
  },
  userSortBy: 'name',
  userSortOrder: 'asc',
};

/**
 * Admin store with subscription support for reactive updates
 */
export const useAdminStore = create<AdminStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Set users list
    setUsers: (users) => {
      set({ 
        users, 
        lastUsersUpdate: Date.now(),
        usersError: null 
      });
    },

    // Add new user
    addUser: (user) => {
      set((state) => ({
        users: [user, ...state.users],
        lastUsersUpdate: Date.now(),
      }));
    },

    // Update existing user
    updateUser: (userId, updates) => {
      set((state) => ({
        users: state.users.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        ),
        selectedUser: state.selectedUser?.id === userId 
          ? { ...state.selectedUser, ...updates }
          : state.selectedUser,
        lastUsersUpdate: Date.now(),
      }));
    },

    // Remove user
    removeUser: (userId) => {
      set((state) => ({
        users: state.users.filter(user => user.id !== userId),
        selectedUser: state.selectedUser?.id === userId ? null : state.selectedUser,
        lastUsersUpdate: Date.now(),
      }));
    },

    // Set loading state
    setUsersLoading: (usersLoading) => {
      set({ usersLoading });
    },

    // Set error state
    setUsersError: (usersError) => {
      set({ usersError, usersLoading: false });
    },

    // Clear error
    clearUsersError: () => {
      set({ usersError: null });
    },

    // Refresh users (triggers reload)
    refreshUsers: () => {
      set({ lastUsersUpdate: Date.now() });
    },

    // Set selected user
    setSelectedUser: (selectedUser) => {
      set({ selectedUser });
    },

    // Select user by ID
    selectUserById: (userId) => {
      const user = get().users.find(u => u.id === userId);
      set({ selectedUser: user || null });
    },

    // UI state setters
    setUserFormOpen: (userFormOpen) => {
      set({ userFormOpen });
    },

    setEditingUserId: (editingUserId) => {
      set({ editingUserId });
    },

    setShowUserAccess: (showUserAccess) => {
      set({ showUserAccess });
    },

    setConfirmDeleteUser: (confirmDeleteUser) => {
      set({ confirmDeleteUser });
    },

    // Statistics
    setUserStats: (userStats) => {
      set({ userStats });
    },

    setStatsLoading: (statsLoading) => {
      set({ statsLoading });
    },

    // Filters and sorting
    setUserFilters: (filters) => {
      set((state) => ({
        userFilters: { ...state.userFilters, ...filters }
      }));
    },

    setUserSort: (userSortBy, userSortOrder) => {
      set((state) => ({
        userSortBy,
        userSortOrder: userSortOrder || (
          state.userSortBy === userSortBy && state.userSortOrder === 'asc' 
            ? 'desc' 
            : 'asc'
        )
      }));
    },

    clearFilters: () => {
      set({
        userFilters: {
          role: 'ALL',
          status: 'ALL',
          hasAccess: 'ALL',
        }
      });
    },

    // Utility functions
    getUserById: (userId) => {
      return get().users.find(user => user.id === userId);
    },

    getFilteredUsers: () => {
      const { users, userFilters } = get();
      
      return users.filter(user => {
        // Role filter
        if (userFilters.role !== 'ALL' && user.role !== userFilters.role) {
          return false;
        }
        
        // Status filter
        if (userFilters.status !== 'ALL') {
          const isOnline = user.loginStats?.currentSession?.isActive || false;
          if (userFilters.status === 'ONLINE' && !isOnline) return false;
          if (userFilters.status === 'OFFLINE' && isOnline) return false;
        }
        
        // Access filter
        if (userFilters.hasAccess !== 'ALL') {
          const hasAccess = (user.accessSummary?.hasAnyAccess) || false;
          if (userFilters.hasAccess === 'YES' && !hasAccess) return false;
          if (userFilters.hasAccess === 'NO' && hasAccess) return false;
        }
        
        return true;
      });
    },

    getSortedUsers: (users) => {
      const { userSortBy, userSortOrder } = get();
      
      return [...users].sort((a, b) => {
        let compareValue = 0;
        
        switch (userSortBy) {
          case 'name':
            compareValue = a.email.localeCompare(b.email);
            break;
          case 'email':
            compareValue = a.email.localeCompare(b.email);
            break;
          case 'role':
            compareValue = a.role.localeCompare(b.role);
            break;
          case 'lastLogin':
            const aLogin = a.loginStats?.lastLogin || '';
            const bLogin = b.loginStats?.lastLogin || '';
            compareValue = aLogin.localeCompare(bLogin);
            break;
        }
        
        return userSortOrder === 'desc' ? -compareValue : compareValue;
      });
    },

    // Reset all state
    resetAdminState: () => {
      set(initialState);
    },
  }))
);

/**
 * Selectors for commonly used admin data
 */
export const adminSelectors = {
  // Get filtered and sorted users
  getProcessedUsers: () => {
    const store = useAdminStore.getState();
    const filtered = store.getFilteredUsers();
    return store.getSortedUsers(filtered);
  },
  
  // Get user statistics
  getUserStatsSummary: () => {
    const { users } = useAdminStore.getState();
    
    return {
      total: users.length,
      online: users.filter(u => u.loginStats?.currentSession?.isActive).length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      withAccess: users.filter(u => u.accessSummary?.hasAnyAccess).length,
    };
  },
  
  // Check if data needs refresh (older than 5 minutes)
  needsRefresh: () => {
    const { lastUsersUpdate } = useAdminStore.getState();
    if (!lastUsersUpdate) return true;
    
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - lastUsersUpdate > fiveMinutes;
  },
  
  // Get active filters count
  getActiveFiltersCount: () => {
    const { userFilters } = useAdminStore.getState();
    let count = 0;
    
    if (userFilters.role !== 'ALL') count++;
    if (userFilters.status !== 'ALL') count++;
    if (userFilters.hasAccess !== 'ALL') count++;
    
    return count;
  },
};
