"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './lib/auth/context';

export default function Home() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated, dashboard if authenticated
    if (!state.isLoading) {
      if (state.isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [state.isAuthenticated, state.isLoading, router]);

  // Show loading while determining authentication status
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // This should not be reached due to redirects above
  return null;
}
