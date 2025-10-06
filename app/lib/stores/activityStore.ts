import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface ActivityLog {
  id: string;
  type: 'user_edit' | 'permission' | 'login' | 'system';
  action: string;
  description: string;
  timestamp: string;
  user: { email: string; username?: string };
  details?: any;
}

interface ActivityStore {
  logs: ActivityLog[];
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  removeLog: (id: string) => void;
  clearLogs: () => void;
  getLogsByType: (type: ActivityLog['type']) => ActivityLog[];
  getLogsByUser: (userEmail: string) => ActivityLog[];
  getRecentLogs: (days: number) => ActivityLog[];
  cleanupOldLogs: (monthsToKeep: number) => void;
}

export const useActivityStore = create<ActivityStore>()((set, get) => ({
  logs: [],

  addLog: (logData) => {
    const newLog: ActivityLog = {
      ...logData,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    
    set((state) => ({
      logs: [newLog, ...state.logs].slice(0, 1000), // Keep only last 1000 logs
    }));
  },

  removeLog: (id) => {
    set((state) => ({
      logs: state.logs.filter(log => log.id !== id),
    }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  getLogsByType: (type) => {
    return get().logs.filter(log => log.type === type);
  },

  getLogsByUser: (userEmail) => {
    return get().logs.filter(log => 
      log.user.email === userEmail || 
      log.details?.targetUserEmail === userEmail
    );
  },

  getRecentLogs: (days) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return get().logs.filter(log => 
      new Date(log.timestamp) >= cutoffDate
    );
  },

  cleanupOldLogs: (monthsToKeep) => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
    
    set((state) => ({
      logs: state.logs.filter(log => 
        new Date(log.timestamp) >= cutoffDate
      ),
    }));
  },
}));
