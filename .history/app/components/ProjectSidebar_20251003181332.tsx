"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  CheckSquare, 
  Activity, 
  MessageSquare, 
  Users, 
  Calendar,
  Settings,
  HelpCircle,
  ChevronDown,
  BarChart3,
  Package,
  ShoppingCart,
  FileText
} from 'lucide-react';
import { useAuth } from '../lib/auth';

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  const pathname = usePathname();
  const { state } = useAuth();

  const mainNavigation = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: pathname === '/dashboard'
    },
    {
      label: 'Products',
      href: '/products',
      icon: Package,
      active: pathname === '/products'
    },
    {
      label: 'Inventory',
      href: '/inventory',
      icon: CheckSquare,
      active: pathname === '/inventory'
    },
    {
      label: 'Listings',
      href: '/listings',
      icon: BarChart3,
      active: pathname === '/listings'
    },
    {
      label: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      active: pathname === '/orders'
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: FileText,
      active: pathname === '/reports'
    }
  ];

  // const secondaryNavigation = [
  //   {
  //     label: 'Team Members',
  //     href: '/team',
  //     icon: Users,
  //     active: pathname === '/team'
  //   },
  //   {
  //     label: 'Messages',
  //     href: '/messages',
  //     icon: MessageSquare,
  //     active: pathname === '/messages'
  //   },
  //   {
  //     label: 'Calendar',
  //     href: '/calendar',
  //     icon: Calendar,
  //     active: pathname === '/calendar'
  //   }
  // ];

  const bottomNavigation = [
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings')
    },
    {
      label: 'Support & Help',
      href: '/support',
      icon: HelpCircle,
      active: pathname === '/support'
    }
  ];

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

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">FHS Tech</h2>
              <p className="text-sm text-gray-500">Project Management</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDown size={20} className="text-gray-500 rotate-90" />
            </button>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-4">
              {/* Primary Navigation */}
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center p-3 rounded-lg transition-colors group ${
                      active 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={20} className={`mr-3 ${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Secondary Navigation */}
              <div className="pt-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 px-3">
                  Additional
                </div>
                {secondaryNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center p-3 rounded-lg transition-colors group ${
                        active 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={20} className={`mr-3 ${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Bottom Navigation */}
          <div className="border-t border-gray-200 p-4">
            <nav className="space-y-1">
              {bottomNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center p-3 rounded-lg transition-colors group ${
                      active 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={20} className={`mr-3 ${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            {state.isAuthenticated && state.user && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(state.user.username || state.user.email)}`}>
                    {getInitials(state.user.username || state.user.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{state.user.username}</div>
                    <div className="text-xs text-gray-500 truncate">{state.user.email}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
