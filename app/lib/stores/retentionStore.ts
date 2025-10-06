import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface RetentionNotification {
  id: string;
  type: 'retention_warning' | 'retention_expired';
  message: string;
  logsCount: number;
  expirationDate: string;
  createdAt: string;
  isRead: boolean;
  adminAction?: 'keep' | 'delete' | 'pending';
}

export interface LogRetentionPolicy {
  retentionMonths: number;
  notificationThreshold: number; // Days before expiration to notify
  autoDelete: boolean;
  lastNotificationDate?: string;
  adminDecision?: 'keep' | 'delete' | 'pending';
  adminDecisionDate?: string;
}

interface RetentionStore {
  notifications: RetentionNotification[];
  policy: LogRetentionPolicy;
  
  // Notification methods
  addNotification: (notification: Omit<RetentionNotification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  setAdminAction: (id: string, action: 'keep' | 'delete') => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
  
  // Policy methods
  updatePolicy: (policy: Partial<LogRetentionPolicy>) => void;
  checkRetentionStatus: () => {
    needsNotification: boolean;
    expiredLogs: number;
    expiringSoonLogs: number;
    expirationDate: string;
  };
  createRetentionNotification: () => RetentionNotification | null;
}

export const useRetentionStore = create<RetentionStore>()((set, get) => ({
  notifications: [],
  policy: {
    retentionMonths: 6,
    notificationThreshold: 7,
    autoDelete: false,
  },

  addNotification: (notificationData) => {
    const newNotification: RetentionNotification = {
      ...notificationData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only last 50 notifications
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      ),
    }));
  },

  setAdminAction: (id, action) => {
    set((state) => ({
      notifications: state.notifications.map(notification =>
        notification.id === id
          ? { ...notification, adminAction: action, isRead: true }
          : notification
      ),
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(notification => notification.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.isRead).length;
  },

  updatePolicy: (newPolicy) => {
    set((state) => ({
      policy: { ...state.policy, ...newPolicy },
    }));
  },

  checkRetentionStatus: () => {
    const { policy } = get();
    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() - policy.retentionMonths);

    // This would need to be connected to the activity store
    // For now, return mock data
    return {
      needsNotification: false,
      expiredLogs: 0,
      expiringSoonLogs: 0,
      expirationDate: expirationDate.toISOString(),
    };
  },

  createRetentionNotification: () => {
    const status = get().checkRetentionStatus();
    
    if (!status.needsNotification) {
      return null;
    }

    const notification: RetentionNotification = {
      id: uuidv4(),
      type: status.expiredLogs > 0 ? 'retention_expired' : 'retention_warning',
      message: status.expiredLogs > 0 
        ? `${status.expiredLogs} log entries have exceeded the 6-month retention period and should be reviewed for deletion.`
        : `${status.expiringSoonLogs} log entries will expire soon. Please review the retention policy.`,
      logsCount: status.expiredLogs + status.expiringSoonLogs,
      expirationDate: status.expirationDate,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    get().addNotification(notification);
    return notification;
  },
}));
