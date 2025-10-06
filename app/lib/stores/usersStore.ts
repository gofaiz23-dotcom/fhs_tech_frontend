import { create } from 'zustand';

export interface SavedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  companyName: string;
}

interface UsersStore {
  users: SavedUser[];
  
  // User methods
  addUser: (user: Omit<SavedUser, 'id'>) => void;
  removeUser: (id: number) => void;
  updateUser: (id: number, updates: Partial<SavedUser>) => void;
  getUser: (id: number) => SavedUser | undefined;
  clearUsers: () => void;
}

export const useUsersStore = create<UsersStore>()((set, get) => ({
  users: [],

  addUser: (userData) => {
    const newUser: SavedUser = {
      ...userData,
      id: Date.now(),
    };
    
    set((state) => ({
      users: [newUser, ...state.users],
    }));
  },

  removeUser: (id) => {
    set((state) => ({
      users: state.users.filter(user => user.id !== id),
    }));
  },

  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map(user =>
        user.id === id ? { ...user, ...updates } : user
      ),
    }));
  },

  getUser: (id) => {
    return get().users.find(user => user.id === id);
  },

  clearUsers: () => {
    set({ users: [] });
  },
}));
