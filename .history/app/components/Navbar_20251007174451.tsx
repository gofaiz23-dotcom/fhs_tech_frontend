"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import CollapsibleSidebar from "./CollapsibleSidebar";
import { useSidebar } from "./SidebarContext";
import { ThemeToggle } from "./ui/theme-toggle";

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
      {/* Sidebar Component */}
      <CollapsibleSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={toggleMobileMenu}
      />

      {/* Top Navigation Bar */}
      <div 
        className="z-30 transition-all duration-300 ease-in-out" 
        // style={{
        //   width: `calc(100% - ${sidebarCollapsed ? '256px' : '64px'})`
        // }}
      >
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Logo - Only show when sidebar is collapsed */}
            {sidebarCollapsed && (
              <Link href="/dashboard" className="flex items-center ml-1 md:ml-10 lg:ml-10">
                  <Image src="/fhs-tech-logo.png" alt="brand logo" width={130} height={130} />
                </Link>
            )}
          </div>

          {/* Right Section */}
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
    </>
  );
}
