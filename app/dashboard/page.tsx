"use client";

import React from 'react';
import Dashboard from '../components/dashboard';
import { ProtectedRoute } from '../lib/auth';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="p-4">
        <Dashboard />
      </div>
    </ProtectedRoute>
  );
}


