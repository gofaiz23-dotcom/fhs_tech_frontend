"use client";

import React from 'react';
import Products from '../components/products';
import { ProtectedRoute } from '../lib/auth';

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <div className="p-4">
        <Products />
      </div>
    </ProtectedRoute>
  );
}


