"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Package, BarChart3, Database, X, RefreshCw, AlertCircle, CheckCircle, Clock, User, Users } from 'lucide-react';
import { statusApi, JobStatus } from '../lib/status/api';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../lib/auth';

interface StatusData {
  products: JobStatus[];
  listings: JobStatus[];
  inventory: JobStatus[];
}

const StatusPage = () => {
  const { state } = useAuth();
  const [statusData, setStatusData] = useState<StatusData>({
    products: [],
    listings: [],
    inventory: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showAllUsers, setShowAllUsers] = useState(false);

  const fetchStatusData = async () => {
    try {
      if (!state.accessToken) {
        console.error('No access token available');
        setLoading(false);
        return;
      }
      const data = await statusApi.getAllStatus(state.accessToken);
      setStatusData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching status data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelJob = async (jobId: string, type: 'product' | 'listing' | 'inventory') => {
    try {
      if (!state.accessToken) {
        console.error('No access token available');
        return;
      }
      const result = await statusApi.cancelJob(jobId, type, state.accessToken);
      if (result.success) {
        // Refresh data after cancellation
        fetchStatusData();
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  useEffect(() => {
    // Don't fetch if auth is still loading or no token available
    if (state.isLoading || !state.accessToken) {
      return;
    }

    fetchStatusData();
    
    // Set up polling every 3 seconds for real-time updates
    const interval = setInterval(fetchStatusData, 3000);
    
    return () => clearInterval(interval);
  }, [state.accessToken, state.isLoading]);

  // Auto-refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && state.accessToken && !state.isLoading) {
        fetchStatusData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.accessToken, state.isLoading]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };


  const StatusCard = ({ title, jobs, icon: Icon, type }: { 
    title: string; 
    jobs: JobStatus[]; 
    icon: React.ComponentType<any>; 
    type: 'product' | 'listing' | 'inventory';
  }) => {
    // Filter jobs based on user role and showAllUsers setting
    const filteredJobs = state.user?.role === 'ADMIN' && showAllUsers 
      ? jobs 
      : jobs.filter(job => !job.userId || job.userId === state.user?.id?.toString());

    // Get unique users for admin view
    const uniqueUsers = state.user?.role === 'ADMIN' 
      ? [...new Set(jobs.map(job => job.username).filter(Boolean))]
      : [];

    return (
    <div className="bg-white rounded-xl shadow-soft-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-500">
                {filteredJobs.length} active {filteredJobs.length === 1 ? 'job' : 'jobs'}
                {state.user?.role === 'ADMIN' && jobs.length > filteredJobs.length && (
                  <span className="text-blue-600 ml-1">
                    ({jobs.length} total)
                  </span>
                )}
              </p>
              {state.user?.role === 'ADMIN' && uniqueUsers.length > 0 && (
                <div className="flex items-center space-x-1 text-sm text-blue-600">
                  <Users className="w-4 h-4" />
                  <span>{uniqueUsers.length} user{uniqueUsers.length === 1 ? '' : 's'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={fetchStatusData}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {state.user?.role === 'ADMIN' && jobs.length > 0 
              ? 'No jobs visible (toggle to show all users)' 
              : 'No active processing jobs'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <ProgressBar 
              key={job.id} 
              job={job} 
              showUserInfo={state.user?.role === 'ADMIN'}
              onCancel={job.status === 'processing' ? () => cancelJob(job.id, type) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading status data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Processing Status</h1>
              <p className="text-gray-600 mt-2">
                Monitor real-time processing of products, listings, and inventory updates
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div className="text-sm text-gray-500">
                  Live updates • Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </div> */}
              {state.user?.role === 'ADMIN' && (
                <button
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    showAllUsers 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{showAllUsers ? 'Show All Users' : 'Show My Jobs'}</span>
                </button>
              )}
              <button
                onClick={fetchStatusData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatusCard
            title="Products"
            jobs={statusData.products}
            icon={Package}
            type="product"
          />
          <StatusCard
            title="Listings"
            jobs={statusData.listings}
            icon={BarChart3}
            type="listing"
          />
          <StatusCard
            title="Inventory"
            jobs={statusData.inventory}
            icon={Database}
            type="inventory"
          />
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  {state.user?.role === 'ADMIN' && showAllUsers ? 'All Jobs' : 'My Jobs'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const allJobs = [...statusData.products, ...statusData.listings, ...statusData.inventory];
                    const filteredJobs = state.user?.role === 'ADMIN' && showAllUsers 
                      ? allJobs 
                      : allJobs.filter(job => !job.userId || job.userId === state.user?.id?.toString());
                    return filteredJobs.length;
                  })()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const allJobs = [...statusData.products, ...statusData.listings, ...statusData.inventory];
                    const filteredJobs = state.user?.role === 'ADMIN' && showAllUsers 
                      ? allJobs 
                      : allJobs.filter(job => !job.userId || job.userId === state.user?.id?.toString());
                    return filteredJobs.filter(job => job.status === 'completed').length;
                  })()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Processing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const allJobs = [...statusData.products, ...statusData.listings, ...statusData.inventory];
                    const filteredJobs = state.user?.role === 'ADMIN' && showAllUsers 
                      ? allJobs 
                      : allJobs.filter(job => !job.userId || job.userId === state.user?.id?.toString());
                    return filteredJobs.filter(job => job.status === 'processing').length;
                  })()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(() => {
                    const allJobs = [...statusData.products, ...statusData.listings, ...statusData.inventory];
                    const filteredJobs = state.user?.role === 'ADMIN' && showAllUsers 
                      ? allJobs 
                      : allJobs.filter(job => !job.userId || job.userId === state.user?.id?.toString());
                    return filteredJobs.filter(job => job.status === 'failed').length;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
