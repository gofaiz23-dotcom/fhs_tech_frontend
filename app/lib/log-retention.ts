/**
 * Log Retention Management Utility
 * 
 * This utility handles the 6-month log retention policy with admin notifications
 * for log cleanup decisions. Now uses Zustand stores instead of localStorage.
 */

import { useRetentionStore } from './stores/retentionStore';
import { useActivityStore } from './stores/activityStore';

export interface LogRetentionPolicy {
  retentionMonths: number;
  notificationThreshold: number; // Days before expiration to notify
  autoDelete: boolean;
  lastNotificationDate?: string;
  adminDecision?: 'keep' | 'delete' | 'pending';
  adminDecisionDate?: string;
}

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

class LogRetentionManager {
  private static instance: LogRetentionManager;

  private constructor() {}

  static getInstance(): LogRetentionManager {
    if (!LogRetentionManager.instance) {
      LogRetentionManager.instance = new LogRetentionManager();
    }
    return LogRetentionManager.instance;
  }

  /**
   * Get the current retention policy from Zustand store
   */
  getPolicy(): LogRetentionPolicy {
    const store = useRetentionStore.getState();
    return store.policy;
  }

  /**
   * Update the retention policy in Zustand store
   */
  updatePolicy(policy: Partial<LogRetentionPolicy>): void {
    const store = useRetentionStore.getState();
    store.updatePolicy(policy);
  }

  /**
   * Check if logs need retention notification
   */
  checkRetentionStatus(): {
    needsNotification: boolean;
    expiredLogs: number;
    expiringSoonLogs: number;
    expirationDate: string;
  } {
    const store = useRetentionStore.getState();
    return store.checkRetentionStatus();
  }

  /**
   * Create a retention notification
   */
  createRetentionNotification(): RetentionNotification | null {
    const store = useRetentionStore.getState();
    return store.createRetentionNotification();
  }

  /**
   * Get all retention notifications
   */
  getNotifications(): RetentionNotification[] {
    const store = useRetentionStore.getState();
    return store.notifications;
  }

  /**
   * Mark a notification as read
   */
  markNotificationAsRead(id: string): void {
    const store = useRetentionStore.getState();
    store.markAsRead(id);
  }

  /**
   * Set admin action for a notification
   */
  setAdminAction(id: string, action: 'keep' | 'delete'): void {
    const store = useRetentionStore.getState();
    store.setAdminAction(id, action);
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    const store = useRetentionStore.getState();
    return store.getUnreadCount();
  }

  /**
   * Clean up old logs based on retention policy
   */
  cleanupOldLogs(): void {
    const activityStore = useActivityStore.getState();
    const policy = this.getPolicy();
    
    // Clean up logs older than retention period
    activityStore.cleanupOldLogs(policy.retentionMonths);
  }

  /**
   * Process retention notifications and cleanup
   */
  processRetention(): void {
    const status = this.checkRetentionStatus();
    
    if (status.needsNotification) {
      this.createRetentionNotification();
    }
    
    // If auto-delete is enabled and there are expired logs, clean them up
    const policy = this.getPolicy();
    if (policy.autoDelete && status.expiredLogs > 0) {
      this.cleanupOldLogs();
    }
  }
}

// Export singleton instance
export const logRetentionManager = LogRetentionManager.getInstance();