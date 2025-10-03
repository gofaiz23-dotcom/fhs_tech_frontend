"use client";

import React from 'react';
import { ProtectedRoute } from '../lib/auth';

export default function ListingsPage() {
  return (
    <ProtectedRoute>
      <div className="p-6 text-gray-800">Listings page placeholder</div>
    </ProtectedRoute>
  );
}


