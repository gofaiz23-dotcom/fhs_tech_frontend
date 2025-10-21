"use client";

import React from 'react';
import { FileText, X, User } from 'lucide-react';

interface ProgressBarProps {
  job: {
    id: string;
    type: 'product' | 'listing' | 'inventory';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    totalItems: number;
    processedItems: number;
    fileName?: string;
    fileSize?: string;
    startedAt: string;
    completedAt?: string;
    error?: string;
    userId?: string;
    username?: string;
  };
  onCancel?: () => void;
  showUserInfo?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ job, onCancel, showUserInfo = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-green-400 to-green-600';
      case 'failed':
        return 'from-red-400 to-red-600';
      case 'processing':
        return 'from-blue-400 to-purple-600';
      case 'pending':
        return 'from-yellow-400 to-orange-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
        return 'bg-gradient-to-r from-blue-400 to-purple-600';
      case 'pending':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-soft-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {job.fileName || `${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Processing`}
            </h3>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-500">
                {job.status === 'processing' ? 'Processing your file...' : 
                 job.status === 'completed' ? 'File processing completed' :
                 job.status === 'failed' ? 'Processing failed' : 'Waiting to start'}
              </p>
              {showUserInfo && job.username && (
                <div className="flex items-center space-x-1 text-sm text-blue-600">
                  <User className="w-4 h-4" />
                  <span>{job.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {job.status === 'processing' && onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Cancel processing"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {job.fileName || `${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Processing`}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {job.progress}% Completed
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getProgressBarColor(job.status)}`}
              style={{ width: `${job.progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500">
              {job.processedItems} / {job.totalItems} items
            </span>
            {job.fileSize && (
              <span className="text-sm text-gray-500">
                {job.fileSize}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              job.status === 'completed' ? 'bg-green-500' :
              job.status === 'failed' ? 'bg-red-500' :
              job.status === 'processing' ? 'bg-blue-500 animate-pulse' :
              'bg-yellow-500'
            }`} />
            <span className={`text-sm font-medium ${
              job.status === 'completed' ? 'text-green-700' :
              job.status === 'failed' ? 'text-red-700' :
              job.status === 'processing' ? 'text-blue-700' :
              'text-yellow-700'
            }`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
          
          <div className="text-xs text-gray-500">
            Started: {new Date(job.startedAt).toLocaleString()}
          </div>
        </div>

        {/* Error Message */}
        {job.error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{job.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
