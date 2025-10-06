"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  BarChart3,
  ShoppingCart,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
  Settings,
  Shield,
  Globe,
  History,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useTheme } from "next-themes";
import HydrationSafe from "./HydrationSafe";
// import Link from "next/link";
import Image from "next/image";

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function CollapsibleSidebar({
  isCollapsed,
  onToggle,
}: CollapsibleSidebarProps) {
  const pathname = usePathname();
  const { state } = useAuth();
  const { resolvedTheme } = useTheme();

  // Function to render icons dynamically
  const renderIcon = (iconName: string, size: number, className: string) => {
    const iconProps = { size, className };

    switch (iconName) {
      case "Home":
        return <Home {...iconProps} />;
      case "Package":
        return <Package {...iconProps} />;
      case "BarChart3":
        return <BarChart3 {...iconProps} />;
      case "ShoppingCart":
        return <ShoppingCart {...iconProps} />;
      case "FileText":
        return <FileText {...iconProps} />;
      case "Users":
        return <Users {...iconProps} />;
      case "Settings":
        return <Settings {...iconProps} />;
      case "Shield":
        return <Shield {...iconProps} />;
      case "Globe":
        return <Globe {...iconProps} />;
      case "History":
        return <History {...iconProps} />;
      // case "ShoppingBag":
      //   return <ShoppingBag {...iconProps} />;
      case "Truck":
        return <Truck {...iconProps} />;
      default:
        return <Home {...iconProps} />;
    }
  };

  const mainNavigation = useMemo(
    () => [
      {
        label: "Dashboard",
        href: "/dashboard",
        iconName: "Home",
        active: pathname === "/dashboard",
      },
      {
        label: "Products",
        href: "/products",
        iconName: "Package",
        active: pathname === "/products" || pathname === "/inventory",
        subItems: [
          { label: "All Products", href: "/products" },
          { label: "Inventory", href: "/inventory" },
        ],
      },
      {
        label: "Listings",
        href: "/listings",
        iconName: "BarChart3",
        active: pathname === "/listings",
      },
      {
        label: "Orders",
        href: "/orders",
        iconName: "ShoppingCart",
        active: pathname === "/orders",
      },
    ],
    [pathname]
  );

  const settingsNavigation = useMemo(
    () => {
      const isAdmin = state.user?.role === 'ADMIN';
      console.log('🔍 Sidebar: User role:', state.user?.role, 'Is Admin:', isAdmin);
      console.log('🔍 Sidebar: Full user object:', state.user);
      console.log('🔍 Sidebar: Auth state:', { 
        isAuthenticated: state.isAuthenticated, 
        hasUser: !!state.user,
        userKeys: state.user ? Object.keys(state.user) : 'no user'
      });
      
      // Temporary fix: If role is undefined, try to determine from other fields or default to USER
      const userRole = state.user?.role || 'USER';
      const isAdminSafe = userRole === 'ADMIN';
      
      const baseSettings = [
        {
          label: "Marketplaces",
          href: "/settings/marketplaces",
          iconName: "ShoppingBag",
          active: pathname === "/settings/marketplaces",
        },
        {
          label: "Brands",
          href: "/settings/brands",
          iconName: "Package",
          active: pathname === "/settings/brands",
        },
        {
          label: "Shipping Platforms",
          href: "/settings/shipping",
          iconName: "Truck",
          active: pathname === "/settings/shipping",
        },
      ];

      // Add admin-only settings if user is admin
      if (isAdminSafe) {
        return [
          {
            label: "Manage Users",
            href: "/settings/manage-users",
            iconName: "Users",
            active: pathname === "/settings/manage-users",
          },
          {
            label: "User Access",
            href: "/settings/access-control",
            iconName: "Shield",
            active: pathname === "/settings/access-control",
          },
          {
            label: "History",
            href: "/settings/history",
            iconName: "History",
            active: pathname === "/settings/history",
          },
          ...baseSettings,
        ];
      }

      return baseSettings;
    },
    [pathname, state.user?.role, state.isAuthenticated]
  );

  const renderNavigationItem = (item: any, isSubItem = false) => {
    const active = item.active;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center p-3 rounded-lg transition-colors group ${
          active
            ? resolvedTheme === 'dark' 
              ? "bg-indigo-900/20 text-indigo-300 border border-indigo-700"
              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
            : resolvedTheme === 'dark'
              ? "text-gray-300 hover:bg-gray-800 hover:text-gray-100"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        } ${isSubItem ? "ml-6 text-sm" : ""} ${
          isCollapsed ? "justify-center" : ""
        }`}
      >
        <div className={`flex-shrink-0 ${!isCollapsed ? "mr-3" : ""}`}>
          {renderIcon(
            item.iconName,
            20,
            `${ 
              active
                ? resolvedTheme === 'dark' ? "text-indigo-400" : "text-indigo-500"
                : resolvedTheme === 'dark' 
                  ? "text-gray-500 group-hover:text-gray-400"
                  : "text-gray-400 group-hover:text-gray-500"
            }`
          )}
        </div>
        {!isCollapsed && <span className="font-medium">{item.label}</span>}
      </Link>
    );
  };

  return (
    <HydrationSafe fallback={
      <div className={`fixed top-0 left-0 h-full bg-white shadow-lg z-40 transform transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      } hidden md:block`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard" className="flex items-center">
                  <Image src="/fhs-tech-logo.png" alt="brand logo" width={130} height={130} />
                </Link>
              </div>
            )}
            <button onClick={onToggle} className="p-2 rounded-lg hover:bg-blue-50 transition-colors">
              {isCollapsed ? <ChevronRight size={20} className="text-blue-600" /> : <ChevronLeft size={20} className="text-blue-600" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-1 p-4">
              <div>
                {mainNavigation.map((item) => (
                  <div key={item.href}>
                    <Link href={item.href} className="flex items-center p-3 rounded-lg transition-colors group text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                      <div className="flex-shrink-0 mr-3">
                        {renderIcon(item.iconName, 20, "text-gray-400 group-hover:text-gray-500")}
                      </div>
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>
    }>
      <div
        className={`fixed top-0 left-0 h-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} shadow-lg z-40 transform transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        } hidden md:block`}
      >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="flex items-center">
                {" "}
                <Image
                  src="/fhs-tech-logo.png"
                  alt="brand logo"
                  width={130}
                  height={130}
                />{" "}
              </Link>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={20} className="text-blue-600" />
            ) : (
              <ChevronLeft size={20} className="text-blue-600" />
            )}
          </button>
        </div>

        {/* User Profile */}
        {state.isAuthenticated && state.user && (
          <div className={`p-4 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  (state.user.role || 'USER') === "ADMIN" ? "bg-purple-500" : "bg-blue-500"
                }`}
              >
                {state.user.username?.charAt(0).toUpperCase() ||
                  state.user.email?.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {state.user.username}
                  </div>
                  <div className={`text-xs flex items-center gap-1 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        (state.user.role || 'USER') === "ADMIN"
                          ? "bg-purple-400"
                          : "bg-blue-400"
                      }`}
                    ></div>
                    {state.user.role || 'USER'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-1 p-4">
            {/* Main Navigation */}
            <div>
              {mainNavigation.map((item) => (
                <div key={item.href}>
                  {renderNavigationItem(item)}
                  {item.subItems && !isCollapsed && (
                    <div className="mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`flex items-center p-2 ml-6 text-sm rounded-lg transition-colors ${
                            pathname === subItem.href
                              ? resolvedTheme === 'dark' 
                                ? "bg-indigo-900/20 text-indigo-300"
                                : "bg-indigo-50 text-indigo-700"
                              : resolvedTheme === 'dark'
                                ? "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <span className="font-medium">{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Settings Section */}
            <div className="pt-4">
              <div className="flex items-center mb-3">
                {!isCollapsed && (
                  <span className={`text-xs font-semibold uppercase tracking-wider ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Settings
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {settingsNavigation.map((item) => renderNavigationItem(item))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
    </HydrationSafe>
  );
}
