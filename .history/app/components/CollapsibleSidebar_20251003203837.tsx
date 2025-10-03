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

  // Function to render icons dynamically
  const renderIcon = (iconName: string, size: number, className: string) => {
    const iconProps = { size, className };

    switch (iconName) {
      case 'Home': return <Home {...iconProps} />;
      case 'Package': return <Package {...iconProps} />;
      case 'BarChart3': return <BarChart3 {...iconProps} />;
      case 'ShoppingCart': return <ShoppingCart {...iconProps} />;
      case 'FileText': return <FileText {...iconProps} />;
      case 'Users': return <Users {...iconProps} />;
      case 'Settings': return <Settings {...iconProps} />;
      case 'Shield': return <Shield {...iconProps} />;
      case 'Globe': return <Globe {...iconProps} />;
      case 'History': return <History {...iconProps} />;
      case 'ShoppingBag': return <ShoppingBag {...iconProps} />;
      case 'Truck': return <Truck {...iconProps} />;
      default: return <Home {...iconProps} />;
    }
  };

  const mainNavigation = useMemo(() => [
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
  ], [pathname]);

  const settingsNavigation = useMemo(() => [
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
    // {
    //   label: "Warehouses",
    //   href: "/settings/warehouses",
    //   iconName: "Globe",
    //   active: pathname === "/settings/warehouses",
    // },
    {
      label: "History",
      href: "/settings/history",
      iconName: "History",
      active: pathname === "/settings/history",
    },
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
  ], [pathname]);

  const renderNavigationItem = (item: any, isSubItem = false) => {
    const active = item.active;
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center p-3 rounded-lg transition-colors group ${
          active
            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        } ${isSubItem ? "ml-6 text-sm" : ""} ${isCollapsed ? "justify-center" : ""}`}
      >
        <div className={`flex-shrink-0 ${!isCollapsed ? "mr-3" : ""}`}>
          {renderIcon(
            item.iconName,
            20,
            `${
              active
                ? "text-indigo-500"
                : "text-gray-400 group-hover:text-gray-500"
            }`
          )}
        </div>
        {!isCollapsed && <span className="font-medium">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-white shadow-lg z-40 transform transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      } hidden md:block`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        {/* <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {/* {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-semibold text-gray-900">FHS Tech</span>
            </div>
          )} *
          {/* <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={20} className="text-gray-600" />
            ) : (
              <ChevronLeft size={20} className="text-gray-600" />
            )}
          </button> 
        </div> */}

        {/* User Profile */}
        {state.isAuthenticated && state.user && (
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                  state.user.role === 'ADMIN' 
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                }`}>
                  {state.user.username?.charAt(0).toUpperCase() || state.user.email?.charAt(0).toUpperCase()}
                </div>
                {/* Online status indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {state.user.username}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      state.user.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {state.user.role}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-white/50 transition-all duration-200 hover:shadow-sm"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight size={18} className="text-gray-600" />
                ) : (
                  <ChevronLeft size={18} className="text-gray-600" />
                )}
              </button>
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
                              ? "bg-indigo-50 text-indigo-700"
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
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
  );
}