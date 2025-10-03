"use client";

import React from 'react';
import { ProtectedRoute } from '../lib/auth';

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <div className="p-6 text-gray-800">Orders page placeholder</div>
    </ProtectedRoute>
  );
}


