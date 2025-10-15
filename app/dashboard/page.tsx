"use client";

import React from 'react';
import { ProtectedRoute } from '../lib/auth';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="p-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
            <p className="text-gray-600 dark:text-slate-300">Welcome to your FHS Tech dashboard</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Products</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Total products</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Orders</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">0</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Total orders</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Revenue</h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">$0</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Total revenue</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Users</h3>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">0</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Active users</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


