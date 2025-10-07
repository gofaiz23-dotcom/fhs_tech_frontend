// components/Navbar.tsx

"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import CollapsibleSidebar from "./CollapsibleSidebar";
import { useSidebar } from "./SidebarContext";
import { ThemeToggle } from "./ui/theme-toggle";
import Image from "next/image";

export default function Navbar() {
  const { state, logout } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={toggleMobileMenu}
      />

      {/* Fixed Top Bar */}
      <div className=" top-0 right-0 z-30 transition-all duration-300 ease-in-out" style={{
        // left: sidebarCollapsed ? '64px' : '256px',
        width: `calc(100% - ${sidebarCollapsed ? '64px' : '256px'})`
      }}>
        <div className="">
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            {/* Left side - Mobile Menu Button and Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              
              {/* Logo - Always visible */}
              <Link href="/dashboard" className="flex items-center">
                <Image
                  src="/fhs-tech-logo.png"
                  alt="FHS Tech Logo"
                  width={40}
                  height={40}
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            {/* Right side - Theme Toggle and Logout */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {state.isAuthenticated && state.user ? (
                <button
                  onClick={handleLogout}
                  className="btn-warning text-sm flex items-center gap-2"
                >
                  <span className="hidden sm:inline">Sign out</span>
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
      </div>
    </>
  );
}
