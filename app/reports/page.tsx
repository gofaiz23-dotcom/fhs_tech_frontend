"use client";

import React from 'react';
import { ProtectedRoute } from '../lib/auth';

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <div className="p-6 text-gray-800">Reports page placeholder</div>
    </ProtectedRoute>
  );
}


