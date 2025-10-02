// components/Navbar.tsx

"use client";

import { Settings, ChevronDown, Menu, X, User, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useAuth } from "../lib/auth";
import SideNavigation from "./SideNavigation";

export default function Navbar() {
  const pathname = usePathname();
  const { state, logout } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [productsOpen, setProductsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [sideNavOpen, setSideNavOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close profile dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileOpen && !(event.target as Element).closest('.profile-dropdown')) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const isActive = (href: string) =>
    mounted && (pathname === href || pathname?.startsWith(href + "/"));
  const linkClass = (href: string) =>
    isActive(href) ? "text-yellow-300 underline" : "hover:underline";

  // Helper functions for user profile
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfileOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className=" bg-indigo-600/90 text-white shadow-md w-full">
      {" "}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo */}{" "}
        <Link href="/dashboard" className="flex items-center">
          {" "}
          <Image
            src="/fhs-tech-logo.png"
            alt="brand logo"
            width={130}
            height={130}
          />{" "}
        </Link>
        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 text-md font-medium justify-center flex-1 text-center">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>

          {/* Products Dropdown (Desktop) */}
          <div className="relative group">
            <button className="flex items-center hover:underline">
              Products <ChevronDown size={16} className="" />
            </button>
            <div className="absolute left-0  hidden group-hover:block bg-white text-gray-800 rounded shadow-md min-w-[160px]">
              <Link
                href="/products"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                All Products
              </Link>
              <Link
                href="/inventory"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Inventory
              </Link>
            </div>
          </div>

          <Link href="/listings" className={linkClass("/listings")}>
            Listings
          </Link>
          <Link href="/orders" className={linkClass("/orders")}>
            Orders
          </Link>
          <Link href="/reports" className={linkClass("/reports")}>
            Reports
          </Link>
        </ul>
        {/* Right: User Profile */}
        <div className="hidden md:flex items-center space-x-4">
          {state.isAuthenticated && state.user ? (
            <div className="relative profile-dropdown">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(state.user.username || state.user.email)}`}>
                  {getInitials(state.user.username || state.user.email)}
                </div>
                <span className="text-sm font-medium">{state.user.username}</span>
                <ChevronDown size={16} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(state.user.username || state.user.email)}`}>
                        {getInitials(state.user.username || state.user.email)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{state.user.username}</div>
                        <div className="text-sm text-gray-500">{state.user.email}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${state.user.role === 'ADMIN' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                          {state.user.role}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSideNavOpen(true);
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={16} className="mr-3 text-gray-400" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} className="mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
              Sign In
            </Link>
          )}
        </div>
        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-600 text-white px-6 pb-4 space-y-4">
          <Link
            href="/dashboard"
            className="block hover:underline"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>

          {/* Products Dropdown (Mobile) */}
          {/* Products Dropdown (Desktop) */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button className="flex items-center hover:underline">
              Products <ChevronDown size={16} className="ml-1" />
            </button>
            {productsOpen && (
              <div className="absolute left-0 mt-2 bg-white text-gray-800 rounded shadow-md min-w-[160px]">
                <Link
                  href="/products"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  All Products
                </Link>
                <Link
                  href="/inventory"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Inventory
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/listings"
            className="block hover:underline"
            onClick={() => setMenuOpen(false)}
          >
            Listings
          </Link>
          <Link
            href="/orders"
            className="block hover:underline"
            onClick={() => setMenuOpen(false)}
          >
            Orders
          </Link>
          <Link
            href="/reports"
            className="block hover:underline"
            onClick={() => setMenuOpen(false)}
          >
            Reports
          </Link>

          {/* Mobile User Profile */}
          <div className="pt-4 border-t border-purple-600">
            {state.isAuthenticated && state.user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(state.user.username || state.user.email)}`}>
                    {getInitials(state.user.username || state.user.email)}
                  </div>
                  <div>
                    <div className="font-medium">{state.user.username}</div>
                    <div className="text-sm text-gray-300">{state.user.email}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${state.user.role === 'ADMIN' ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
                      {state.user.role}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSideNavOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center text-sm hover:text-gray-200 transition"
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="flex items-center text-sm text-red-300 hover:text-red-200 transition"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="block bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium text-center"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
      
      {/* Side Navigation */}
      <SideNavigation isOpen={sideNavOpen} onClose={() => setSideNavOpen(false)} />
    </nav>
  );
}
