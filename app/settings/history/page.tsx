"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import SettingsLayout from "../_components/SettingsLayout";
import { History, Clock, User, Activity, Shield, Package, Truck, Store, RefreshCw, Loader2, AlertCircle, Search } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { AdminService, AdminUtils } from '../../lib/admin/api';
import { type UserWithHistory, type DetailedUser, type LoginSession } from '../../lib/admin/types';
import LiveTimer from '../../components/LiveTimer';
import { useActivityStore } from '../../lib/stores/activityStore';
import { useRetentionStore } from '../../lib/stores/retentionStore';
// import LoginHistoryDebugger from '../../components/LoginHistoryDebugger';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = React.useState<'user-logs' | 'activity-logs'>('user-logs');
  const { state: authState, logout } = useAuth();
  const router = useRouter();
  
  // API data state
  const [userLogs, setUserLogs] = React.useState<UserWithHistory[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<DetailedUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = React.useState(false);

  // Zustand stores
  const { logs: activityLogs, getRecentLogs } = useActivityStore();
  const { notifications: retentionNotifications, markAsRead, setAdminAction } = useRetentionStore();
  
  // UI state
  const [showRetentionModal, setShowRetentionModal] = React.useState(false);
  const [selectedNotification, setSelectedNotification] = React.useState<any>(null);

  // Search state
  const [searchTerm, setSearchTerm] = React.useState('');

  // Handle admin decision on retention
  const handleRetentionDecision = (notificationId: string, decision: 'keep' | 'delete') => {
    try {
      setAdminAction(notificationId, decision);
      setShowRetentionModal(false);
      setSelectedNotification(null);
      
      // Show success message
      console.log(`✅ Retention decision: ${decision} applied successfully`);
    } catch (error) {
      console.error('Failed to handle retention decision:', error);
    }
  };

  // Load activity logs from Zustand store (real user actions)
  const loadActivityLogs = React.useCallback(async () => {
    try {
      setError(null);
      // Activity logs are already available from Zustand store
      // No need to load them separately
    } catch (error: any) {
      console.error('Failed to load activity logs:', error);
      setError('Failed to load activity logs');
    }
  }, []);

  // Load users with login stats
  const loadUsers = React.useCallback(async () => {
    if (!authState.accessToken) {
      setError('No access token available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await AdminService.getUsersWithHistory(authState.accessToken, 6);
      console.log('🔍 Users response (6 months):', response);
      console.log('🔍 Users data:', response.users);
      setUserLogs(response.users);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to load users';
      
      if (error.message?.includes('Session expired') || error.message?.includes('Token expired') || error.message?.includes('Token refresh failed')) {
        // Handle token expiration by redirecting to login
        handleTokenExpiration();
        return;
      } else if (error.message?.includes('Authentication required')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message?.includes('Access denied')) {
        errorMessage = 'You do not have permission to view user data.';
      } else if (error.message?.includes('No access token')) {
        errorMessage = 'Authentication required. Please log in.';
      } else {
        errorMessage = error.message || 'Failed to load users';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [authState.accessToken]);

  // Load detailed user history
  const loadUserDetails = React.useCallback(async (userId: number) => {
    if (!authState.accessToken) return;

    try {
      setIsLoadingUserDetails(true);
      setError(null); // Clear any previous errors
      const response = await AdminService.getUserById(userId, authState.accessToken);
      console.log('🔍 User details response:', response);
      console.log('🔍 User loginStats:', response.user?.loginStats);
      console.log('🔍 User loginHistory:', response.user?.loginHistory);
      setSelectedUser(response.user);
    } catch (error: any) {
      console.error('Failed to load user details:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to load user details';
      
      if (error.message?.includes('Session expired') || error.message?.includes('Token expired') || error.message?.includes('Token refresh failed')) {
        // Handle token expiration by redirecting to login
        handleTokenExpiration();
        return;
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'User not found. The user may have been deleted or the ID is invalid.';
      } else if (error.message?.includes('Authentication required')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message?.includes('Access denied')) {
        errorMessage = 'You do not have permission to view this user\'s details.';
      } else if (error.message?.includes('Invalid user ID')) {
        errorMessage = 'Invalid user ID provided.';
      } else {
        errorMessage = error.message || 'Failed to load user details';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoadingUserDetails(false);
    }
  }, [authState.accessToken]);

  // Load users on component mount
  React.useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken && !authState.isLoading) {
      loadUsers();
      if (activeTab === 'activity-logs') {
        loadActivityLogs();
      }
    }
  }, [loadUsers, loadActivityLogs, authState.isAuthenticated, authState.accessToken, authState.isLoading, activeTab]);

  const formatRelativeTime = (dateString: string) => {
    return AdminUtils.formatRelativeTime(dateString);
  };

  // Handle tab change
  const handleTabChange = (tab: 'user-logs' | 'activity-logs') => {
    setActiveTab(tab);
    if (tab === 'activity-logs' && activityLogs.length === 0) {
      loadActivityLogs();
    }
  };

  const getDisplayUsername = (email: string) => {
    return email.split('@')[0];
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'brand': return <Package className="w-4 h-4" />;
      case 'marketplace': return <Store className="w-4 h-4" />;
      case 'shipping': return <Truck className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getNetworkIcon = (networkType: string): string => {
    switch (networkType.toLowerCase()) {
      case 'wifi':
        return '📶';
      case '4g':
      case '3g':
      case '2g':
        return '📱';
      case 'ethernet':
        return '🔌';
      default:
        return '🌐';
    }
  };

  const getNetworkColor = (networkType: string): string => {
    switch (networkType.toLowerCase()) {
      case 'wifi':
        return 'text-green-600';
      case '4g':
        return 'text-blue-600';
      case '3g':
        return 'text-yellow-600';
      case '2g':
        return 'text-red-600';
      case 'ethernet':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  // Clear errors when modal is closed
  const closeUserDetails = () => {
    setSelectedUser(null);
    setError(null);
  };

  // Handle token expiration by redirecting to login
  const handleTokenExpiration = async () => {
    console.log('🔄 Token expired, logging out and redirecting to login...');
    await logout();
    router.push('/login');
  };

  // Filter users based on search term
  const filteredUserLogs = userLogs.filter(user =>
    getDisplayUsername(user.email).toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">System History</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track user activities and system changes
            </p>
          </div>
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
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

        {/* API Debugger */}
        {/* <LoginHistoryDebugger /> */}

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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('user-logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'user-logs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              User Logs
            </button>
            <button
              onClick={() => handleTabChange('activity-logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity-logs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Activity Logs
              {retentionNotifications.filter(n => !n.isRead).length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {retentionNotifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'user-logs' && (
          <div className="space-y-6">
            {/* Loading State */}
            {isLoading ? (
              <div className="bg-white border rounded p-8 text-center">
                <Loader2 size={32} className="animate-spin mx-auto mb-4 text-blue-600" />
                <div className="text-gray-600">Loading user data...</div>
              </div>
            ) : (
              <>
                {/* User Logs Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-semibold text-gray-900">{filteredUserLogs.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-2xl font-semibold text-gray-900">{filteredUserLogs.filter(u => u.loginStats?.currentSession?.isActive).length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Admin Users</p>
                        <p className="text-2xl font-semibold text-gray-900">{filteredUserLogs.filter(u => u.role === 'ADMIN').length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                        <p className="text-2xl font-semibold text-gray-900">{filteredUserLogs.reduce((sum, u) => sum + (u.loginStats?.totalSessions || 0), 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Logs Table */}
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">User Activity Logs</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Sessions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Hours</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Login</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUserLogs.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAvatarColor(user.email)}`}>
                                  <span className="text-sm font-medium text-white">
                                    {getInitials(user.email)}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{getDisplayUsername(user.email)}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{user.loginStats?.totalSessions || 0}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.loginStats?.currentSession?.isActive ? (
                                <div className="flex items-center gap-2">
                                  <LiveTimer 
                                    startTime={user.loginStats.currentSession.loginTime} 
                                    className="text-green-600 font-medium"
                                  />
                                  <span className="text-xs text-green-500">●</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                  {AdminUtils.formatSessionDuration((user.loginStats?.totalLoginHours || 0) * 60)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">
                                {user.loginStats?.lastLogin ? formatRelativeTime(user.loginStats.lastLogin) : 'Never'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.loginStats?.currentSession?.isActive 
                                  ? 'bg-green-100 text-green-800 animate-pulse' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.loginStats?.currentSession?.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'ADMIN' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => loadUserDetails(user.id)}
                                disabled={isLoadingUserDetails}
                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium disabled:opacity-50"
                              >
                                {isLoadingUserDetails ? 'Loading...' : 'View Details'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'activity-logs' && (
          <div className="space-y-6">
            {/* Activity Logs Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Activity Logs</h3>
                <p className="text-sm text-gray-600 mt-1">
                  System changes and user activities from the last 6 months
                </p>
              </div>
              <button
                onClick={loadActivityLogs}
                className="btn-secondary text-sm flex items-center gap-2"
                title="Refresh activity logs"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {/* Retention Notifications */}
            {retentionNotifications.filter(n => !n.isRead).length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">
                      Log Retention Policy Notification
                    </h4>
                    <div className="space-y-2">
                      {retentionNotifications.filter(n => !n.isRead).map((notification) => (
                        <div key={notification.id} className="bg-white rounded p-3 border border-yellow-200">
                          <p className="text-sm text-yellow-700 mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-yellow-600">
                              {notification.logsCount} log entries affected
                            </span>
                            <button
                              onClick={() => {
                                setSelectedNotification(notification);
                                setShowRetentionModal(true);
                              }}
                              className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
                            >
                              Review & Decide
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Logs Content */}
            {activityLogs.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-8 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Activity Logs</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {error ? 'Failed to load activity logs. Please try again.' : 'No activity logs found for the last 6 months.'}
                </p>
                {error && (
                  <button
                    onClick={loadActivityLogs}
                    className="mt-4 btn-primary text-sm"
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Activities</h4>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activityLogs.map((log, index) => (
                    <div key={index} className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${
                              log.type === 'permission' ? 'bg-blue-500' :
                              log.type === 'user_edit' ? 'bg-green-500' :
                              log.type === 'login' ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}></div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {log.action || 'System Activity'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(log.timestamp || new Date().toISOString())}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {log.description || 'No description available'}
                          </p>
                          {log.user && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              By: {log.user.email || log.user.username || 'Unknown User'}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {log.type || 'unknown'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-semibold text-gray-800">
                  Login History - {getDisplayUsername(selectedUser.email)}
                </div>
                <button 
                  className="text-gray-400 hover:text-red-500 transition-colors" 
                  onClick={closeUserDetails}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Total Sessions</div>
                  <div className="text-2xl font-bold text-blue-900">{selectedUser.loginHistory?.length || 0}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-800 dark:text-green-300">Total Hours</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {selectedUser.loginStats?.currentSession?.isActive ? (
                      <div className="flex items-center gap-2">
                        <LiveTimer 
                          startTime={selectedUser.loginStats.currentSession.loginTime} 
                          className="text-green-600 dark:text-green-400"
                        />
                        <span className="text-xs text-green-500">● Live</span>
                      </div>
                    ) : (
                      AdminUtils.formatSessionDuration((selectedUser.loginStats?.totalLoginHours || 0) * 60)
                    )}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-purple-800">Role</div>
                  <div className="text-2xl font-bold text-purple-900">{selectedUser.role}</div>
                </div>
              </div>

              {/* Login History Table */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Login Sessions</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Login Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Logout Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IP Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Network</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {(selectedUser.loginHistory || []).map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(entry.loginTime).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatRelativeTime(entry.loginTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {entry.logoutTime ? new Date(entry.logoutTime).toLocaleString() : 'Active'}
                            </div>
                            {entry.logoutTime && (
                              <div className="text-xs text-gray-500">
                                {formatRelativeTime(entry.logoutTime)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {entry.sessionDuration 
                                ? AdminUtils.formatSessionDuration(entry.sessionDuration)
                                : entry.logoutTime ? 'Completed' : 'In Progress'
                              }
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{entry.ipAddress}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">
                                {getNetworkIcon(entry.networkType)}
                              </span>
                              <span className={`text-sm font-medium ${getNetworkColor(entry.networkType)}`}>
                                {entry.networkType.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              !entry.logoutTime 
                                ? 'bg-green-100 text-green-800 animate-pulse' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {!entry.logoutTime ? 'Active' : 'Completed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Retention Decision Modal */}
        {showRetentionModal && selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Log Retention Decision Required
                </h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {selectedNotification.message}
                </p>
                <div className="bg-gray-50 rounded p-3">
                  <div className="text-sm text-gray-700">
                    <strong>Affected Logs:</strong> {selectedNotification.logsCount} entries
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>Expiration Date:</strong> {new Date(selectedNotification.expirationDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Please decide what to do with logs that have exceeded the 6-month retention period:
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleRetentionDecision(selectedNotification.id, 'keep')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  Keep Logs (Extend 6 months)
                </button>
                <button
                  onClick={() => handleRetentionDecision(selectedNotification.id, 'delete')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                >
                  Delete Old Logs
                </button>
              </div>

              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowRetentionModal(false);
                    setSelectedNotification(null);
                  }}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
