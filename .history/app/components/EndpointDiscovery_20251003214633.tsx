"use client";

import React from 'react';

export default function EndpointDiscovery() {
  const [discoveryResults, setDiscoveryResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const testEndpoints = [
    'http://192.168.0.23:5000/api/admin/users',
    'http://192.168.0.23:5000/api/admin/users/history',
    'http://192.168.0.23:5000/api/admin/users/access',
    'http://192.168.0.23:5000/api/users',
    'http://192.168.0.23:5000/api/admin/user',
    'http://192.168.0.23:5000/health',
    'http://192.168.0.23:5000/api/health',
    'http://192.168.0.23:5000/',
  ];

  const discoverEndpoints = async () => {
    setIsLoading(true);
    setDiscoveryResults([]);

    const results = [];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🔍 Testing: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        };

        if (response.ok) {
          try {
            const data = await response.json();
            result.data = data;
          } catch (e) {
            result.data = 'Non-JSON response';
          }
        }

        results.push(result);
        console.log(`✅ ${endpoint}: ${response.status}`);
      } catch (error) {
        const result = {
          endpoint,
          status: 0,
          statusText: 'Network Error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        results.push(result);
        console.log(`❌ ${endpoint}: Network error`);
      }
    }

    setDiscoveryResults(results);
    setIsLoading(false);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">🔍 API Endpoint Discovery</h3>
      <p className="text-sm text-blue-700 mb-3">
        This tool will test various API endpoints to find which ones are available on your server.
      </p>
      
      <button
        onClick={discoverEndpoints}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
      >
        {isLoading ? 'Discovering...' : 'Discover Available Endpoints'}
      </button>

      {discoveryResults.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-900">Discovery Results:</h4>
          {discoveryResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded border text-sm ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs">{result.endpoint}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    result.success
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {result.success ? '✅ Available' : '❌ Not Found'}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                <div>Status: {result.status} {result.statusText}</div>
                {result.error && <div>Error: {result.error}</div>}
                {result.data && (
                  <div className="mt-1">
                    <details>
                      <summary className="cursor-pointer">Response Data</summary>
                      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
