"use client";

import React from 'react';
import { ProtectedRoute } from '../lib/auth';
import Listings from '../components/listings';


export default function ListingsPage() {
  return (
    <ProtectedRoute>
      <div className="p-4">
        <Listings />
      </div>
    </ProtectedRoute>
  );
}


