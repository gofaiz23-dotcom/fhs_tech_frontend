"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  CheckSquare,
  BarChart3,
  ShoppingCart,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
  Settings,
  HelpCircle,
  MessageSquare,
  Calendar,
  Shield,
  Key,
  Database,
  Captions,
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
      case 'CheckSquare': return <CheckSquare {...iconProps} />;
      case 'BarChart3': return <BarChart3 {...iconProps} />;
      case 'ShoppingCart': return <ShoppingCart {...iconProps} />;
      case 'FileText': return <FileText {...iconProps} />;
      case 'Users': return <Users {...iconProps} />;
      case 'Settings': return <Settings {...iconProps} />;
      case 'HelpCircle': return <HelpCircle {...iconProps} />;
      case 'MessageSquare': return <MessageSquare {...iconProps} />;
      case 'Calendar': return <Calendar {...iconProps} />;
      case 'Shield': return <Shield {...iconProps} />;
      case 'Key': return <Key {...iconProps} />;
      case 'Database': return <Database {...iconProps} />;
      case 'Captions': return <Captions {...iconProps} />;
      case 'Globe': return <Globe {...iconProps} />;
      case 'History': return <History {...iconProps} />;
      case 'ShoppingBag': return <ShoppingBag {...iconProps} />;
      case 'Truck': return <Truck {...iconProps} />;
      default: return <Home {...iconProps} />;
    }
  };

  const mainNavigation = [
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
      active: pathname === "/products",
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
    {
      label: "Reports",
      href: "/reports",
      iconName: "FileText",
      active: pathname === "/reports",
    },
  ];

  const settingsNavigation = [
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
  ];

  // const additionalNavigation = [
  //   {
  //     label: "Team Members",
  //     href: "/team",
  //     icon: Users,
  //     active: pathname === "/team",
  //   },
  //   {
  //     label: "Messages",
  //     href: "/messages",
  //     icon: MessageSquare,
  //     active: pathname === "/messages",
  //   },
  //   {
  //     label: "Calendar",
  //     href: "/calendar",
  //     icon: Calendar,
  //     active: pathname === "/calendar",
  //   },
  // ];

  const bottomNavigation = [
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
    {
      label: "Support & Help",
      href: "/support",
      icon: HelpCircle,
      active: pathname === "/support",
    },
  ];

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  const renderNavigationItem = (item: any, isSubItem = false) => {
    const active = isActive(item.href);
    const IconComponent = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center p-3 rounded-lg transition-colors group ${
          active
            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        } ${isSubItem ? "ml-6 text-sm" : ""}`}
      >
        {renderIcon(
          item.iconName,
          20,
          `${isCollapsed ? "mx-auto" : "mr-3"} ${
            active
              ? "text-indigo-500"
              : "text-gray-400 group-hover:text-gray-500"
          }`
        )}
        {!isCollapsed && <span className="font-medium">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-white shadow-lg z-40 transform transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900">FHS Tech</h2>
              <p className="text-sm text-gray-500">Project Management</p>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={20} className="text-gray-500" />
            ) : (
              <ChevronLeft size={20} className="text-gray-500" />
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {/* Primary Navigation */}
            {mainNavigation.map((item) => (
              <div key={item.href}>
                {renderNavigationItem(item)}
                {!isCollapsed && item.subItems && (
                  <div className="ml-4 space-y-1">
                    {item.subItems.map((subItem) =>
                      renderNavigationItem(subItem, true)
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Settings Navigation */}
            {!isCollapsed && (
              <div className="pt-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 px-3">
                  Settings
                </div>
                {settingsNavigation.map((item) => renderNavigationItem(item))}
              </div>
            )}

            {/* Additional Navigation */}
            {/* {!isCollapsed && (
              <div className="pt-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 px-3">
                  Additional
                </div>
                {additionalNavigation.map((item) => renderNavigationItem(item))}
              </div>
            )} */}
          </nav>
        </div>

        {/* Bottom Navigation & User Profile */}
        <div className="border-t border-gray-200 p-3">
          <nav className="space-y-1">
            {bottomNavigation.map((item) => renderNavigationItem(item))}
          </nav>

          {/* User Profile */}
          {state.isAuthenticated && state.user && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(
                    state.user.username || state.user.email
                  )}`}
                >
                  {getInitials(state.user.username || state.user.email)}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {state.user.username}
                    </div>
                    <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          state.user.role === "ADMIN"
                            ? "bg-purple-500"
                            : "bg-blue-500"
                        }`}
                      ></div>
                      {state.user.role}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
