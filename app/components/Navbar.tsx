// components/Navbar.tsx

"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import React from "react";
import { useAuth } from "../lib/auth";
import CollapsibleSidebar from "./CollapsibleSidebar";
import { useSidebar } from "./SidebarContext";
import { ThemeToggle } from "./ui/theme-toggle";

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
        <div className="bg-white border-b border-secondary-200 shadow-soft dark:bg-gray-900 dark:border-gray-700">
          <div className="flex items-center justify-end px-6 py-4 gap-3">
            <ThemeToggle />
            {state.isAuthenticated && state.user ? (
              <button
                onClick={handleLogout}
                className="btn-warning text-sm flex items-center gap-2"
              >
                Sign out
                <LogOut size={16} />
              </button>
            ) : (
              <Link href="/login" className="btn-primary text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
