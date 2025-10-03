"use client";

import React from 'react';
import { testApiConnectivity } from '../lib/auth/api';

export default function ApiDebugger() {
  const [testResult, setTestResult] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const runConnectivityTest = async () => {
    setIsLoading(true);
    try {
      const result = await testApiConnectivity();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        isReachable: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 API Debugger</h3>
      <p className="text-sm text-yellow-700 mb-3">
        Use this tool to test API connectivity and diagnose login issues.
      </p>
      
      <button
        onClick={runConnectivityTest}
        disabled={isLoading}
        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test API Connectivity'}
      </button>

      {testResult && (
        <div className="mt-3 p-3 bg-white rounded border">
          <h4 className="font-medium text-gray-900 mb-2">Test Results:</h4>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Reachable:</span>{' '}
              <span className={testResult.isReachable ? 'text-green-600' : 'text-red-600'}>
                {testResult.isReachable ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Status:</span> {testResult.status}
            </div>
            {testResult.error && (
              <div>
                <span className="font-medium">Error:</span>{' '}
                <span className="text-red-600">{testResult.error}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-600">
        <p><strong>Current API Base URL:</strong> http://192.168.0.23:5000/api</p>
        <p><strong>Login Endpoint:</strong> http://192.168.0.23:5000/api/auth/login</p>
      </div>
    </div>
  );
}
