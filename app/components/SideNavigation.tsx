"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  X, 
  Settings, 
  Users, 
  Shield, 
  Key, 
  UserPlus, 
  Database,
  Captions,
  Globe
} from 'lucide-react';

interface SideNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideNavigation({ isOpen, onClose }: SideNavigationProps) {
  const pathname = usePathname();

  const settingsLinks = [
    {
      href: '/settings/channels',
      label: 'Channels',
      icon: Captions,
      description: 'Manage sales channels'
    },
    {
      href: '/settings/manage-users',
      label: 'Manage Users',
      icon: Users,
      description: 'User management and roles'
    },
    {
      href: '/settings/access-control',
      label: 'Access Control',
      icon: Shield,
      description: 'User permissions and access'
    },
    {
      href: '/settings/account',
      label: 'Account Settings',
      icon: Settings,
      description: 'Account preferences'
    },
    {
      href: '/settings/change-password',
      label: 'Change Password',
      icon: Key,
      description: 'Update your password'
    },
    {
      href: '/settings/api',
      label: 'API Settings',
      icon: Database,
      description: 'API keys and integrations'
    },
    {
      href: '/settings/warehouses',
      label: 'Warehouses',
      icon: Globe,
      description: 'Warehouse management'
    }
  ];

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

      {/* Side Navigation */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-soft-lg z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <p className="text-sm text-gray-500">Manage your account and preferences</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-4">
              {settingsLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={`flex items-center p-4 rounded-xl transition-all duration-200 group ${
                      active 
                        ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-soft' 
                        : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 hover:shadow-soft'
                    }`}
                  >
                    <Icon size={20} className={`mr-3 ${active ? 'text-primary-500' : 'text-secondary-400 group-hover:text-secondary-500'}`} />
                    <div className="flex-1">
                      <div className="font-medium">{link.label}</div>
                      <div className="text-xs text-gray-500">{link.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Settings Panel
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
