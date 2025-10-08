"use client";

/**
 * Debug Authentication Page
 * 
 * Simple page to test authentication persistence across page refreshes.
 * This page will be deleted after testing.
 */

import React from 'react';
import { useAuth } from '../lib/auth/context';

export default function DebugAuthPage() {
  const { state } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Authentication Debug
          </h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Current State</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Authenticated:</strong> {state.isAuthenticated ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Loading:</strong> {state.isLoading ? '⏳ Yes' : '✅ No'}</p>
                <p><strong>Has Error:</strong> {state.error ? '❌ Yes' : '✅ No'}</p>
                <p><strong>User:</strong> {state.user?.username || 'None'}</p>
                <p><strong>Email:</strong> {state.user?.email || 'None'}</p>
                <p><strong>Role:</strong> {state.user?.role || 'None'}</p>
                <p><strong>Access Token:</strong> {state.accessToken ? '✅ Present' : '❌ Missing'}</p>
              </div>
            </div>

            {state.error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <strong>Error:</strong> {state.error}
              </div>
            )}

            <div className="p-4 bg-blue-100 rounded-lg">
              <h3 className="font-semibold mb-2">Test Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Login to your application</li>
                <li>Navigate to this debug page</li>
                <li>Refresh the page (F5 or Ctrl+R)</li>
                <li>Check if you remain authenticated</li>
                <li>Check the browser console for auth logs</li>
              </ol>
            </div>

            <div className="p-4 bg-yellow-100 rounded-lg">
              <h3 className="font-semibold mb-2">Expected Behavior:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>After login: All fields should show authenticated state</li>
                <li>After refresh: Should remain authenticated (no logout)</li>
                <li>Console should show successful token refresh</li>
                <li>Access token should be restored from localStorage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
