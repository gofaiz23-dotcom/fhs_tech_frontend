/**
 * Activity Logger Utility
 * 
 * This utility tracks user activities and stores them using Zustand
 * for display in the activity logs section.
 */

import { useActivityStore } from './stores/activityStore';
import { useRetentionStore } from './stores/retentionStore';

export interface ActivityLog {
  id: string;
  type: 'user_edit' | 'permission' | 'login' | 'system';
  action: string;
  description: string;
  timestamp: string;
  user: {
    email: string;
    username?: string;
  };
  details?: any;
}

class ActivityLogger {
  private static instance: ActivityLogger;

  static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  /**
   * Log a user activity
   */
  logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    try {
      // Get the Zustand store
      const { addLog, cleanupOldLogs } = useActivityStore.getState();
      const { createRetentionNotification } = useRetentionStore.getState();
      
      // Add the log
      addLog(activity);
      
      // Clean up old logs (6 months)
      cleanupOldLogs(6);
      
      console.log('📝 Activity logged:', activity);
      
      // Check for retention notifications after adding new log
      try {
        createRetentionNotification();
      } catch (error) {
        console.error('Failed to check retention notifications:', error);
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Log user edit activity
   */
  logUserEdit(
    userEmail: string,
    username: string,
    changes: { field: string; oldValue: any; newValue: any }[],
    adminUser: { email: string; username?: string }
  ): void {
    const changeDescriptions = changes.map(change => 
      `${change.field}: ${change.oldValue} → ${change.newValue}`
    ).join(', ');

    this.logActivity({
      type: 'user_edit',
      action: 'User Updated',
      description: `Updated user ${userEmail}: ${changeDescriptions}`,
      user: adminUser,
      details: {
        targetUser: userEmail,
        changes: changes
      }
    });
  }

  /**
   * Log permission change activity
   */
  logPermissionChange(
    userEmail: string,
    permissionType: 'brand' | 'marketplace' | 'shipping',
    itemName: string,
    action: 'granted' | 'revoked',
    adminUser: { email: string; username?: string }
  ): void {
    this.logActivity({
      type: 'permission',
      action: 'Permission Changed',
      description: `${action === 'granted' ? 'Granted' : 'Revoked'} ${permissionType} access to "${itemName}" for user ${userEmail}`,
      user: adminUser,
      details: {
        targetUser: userEmail,
        permissionType,
        itemName,
        action
      }
    });
  }

  /**
   * Log user login activity
   */
  logUserLogin(
    userEmail: string,
    username?: string
  ): void {
    this.logActivity({
      type: 'login',
      action: 'User Login',
      description: `User logged in successfully`,
      user: { email: userEmail, username },
      details: {
        loginTime: new Date().toISOString()
      }
    });
  }

  /**
   * Clear all logs (for testing)
   */
  clearLogs(): void {
    const { clearLogs } = useActivityStore.getState();
    clearLogs();
    console.log('🧹 Activity logs cleared');
  }
}

// Export singleton instance
export const activityLogger = ActivityLogger.getInstance();
