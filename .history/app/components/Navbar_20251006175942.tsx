// components/Navbar.tsx

"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useAuth } from "../lib/auth";
import CollapsibleSidebar from "./CollapsibleSidebar";
import { useSidebar } from "./SidebarContext";

export default function Navbar() {
  const { state, logout } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Fixed Top Bar */}
      <div className="fixed top-0 right-0 z-30 transition-all duration-300 ease-in-out" style={{
        left: sidebarCollapsed ? '64px' : '256px',
        width: `calc(100% - ${sidebarCollapsed ? '64px' : '256px'})`
      }}>
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-end px-6 py-4">
            {state.isAuthenticated && state.user ? (
              <button
                onClick={handleLogout}
                className="bg-orange-300 hover:bg-orange-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                Sign out
                <LogOut size={16} />
              </button>
            ) : (
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
