"use client";

import React, { useState } from 'react';

export default function TestBackendPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testBackend = async () => {
    setIsLoading(true);
    setTestResult('Testing...');
    
    try {
      // Test basic connectivity
      const response = await fetch('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
        ok: response.ok,
      };
      
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Backend Connection Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Backend Connectivity</h2>
          <button
            onClick={testBackend}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Backend'}
          </button>
        </div>
        
        {testResult && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Result</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {testResult}
            </pre>
          </div>
        )}
        
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mt-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Troubleshooting Steps:</h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Make sure your backend server is running on port 3000</li>
            <li>Run: <code className="bg-yellow-100 px-2 py-1 rounded">cd fhs_tech_Backend\fhs_tech_Backend && npm run dev</code></li>
            <li>Check that the backend is accessible at <code className="bg-yellow-100 px-2 py-1 rounded">http://localhost:3000</code></li>
            <li>Verify the API endpoints are working</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

