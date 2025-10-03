"use client";

import React from 'react';
import Inventory from "../components/inventory";
import { ProtectedRoute } from '../lib/auth';

export default function InventoryPage() {
  return (
    <ProtectedRoute>
      <div className="p-4">
        <Inventory />
      </div>
    </ProtectedRoute>
  );
}


