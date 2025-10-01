"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Settings, User, KeyRound, Users, Code2, Store, Warehouse, Menu, X } from "lucide-react";

export default function SideNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const item = (href: string, label: string, Icon: any) => (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${isActive(href) ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-50'}`}>
      <Icon size={16} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  return (
    <>
      <button className="md:hidden border rounded px-2 py-1 text-sm" onClick={()=>setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
      <aside className={`bg-white border rounded h-fit ${collapsed ? 'w-14' : 'w-64'} transition-all duration-300 ${mobileOpen ? 'block' : 'hidden'} md:block`}> 
        <div className="p-2 flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-500">{!collapsed ? 'ACCOUNT SETTINGS' : 'AS'}</div>
          <button className="text-xs text-gray-500" onClick={() => setCollapsed(!collapsed)}>{collapsed ? '»' : '«'}</button>
        </div>
        <div className="px-2 space-y-1">
          {item('/settings/account','Account Info', User)}
          {item('/settings/change-password','Change Password', KeyRound)}
          {item('/settings/users','Users', Users)}
          {item('/settings/manage-users','Manage Users', Users)}
          {item('/settings/api','API', Code2)}
        </div>

        <div className="p-2 mt-4">
          <div className="text-xs font-semibold text-gray-500">{!collapsed ? 'APPLICATION SETTINGS' : 'AP'}</div>
        </div>
        <div className="px-2 space-y-1">
          {item('/settings/channels','Sales Channel Integrations', Store)}
          {item('/settings/warehouses','Warehouse Locations', Warehouse)}
        </div>

        <div className="mt-6 px-2 pb-2">
          <Link href={'/settings'} className="flex items-center justify-center border rounded py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Settings size={16} className="mr-2" /> {!collapsed ? 'Settings' : ''}
          </Link>
        </div>
      </aside>
    </>
  );
}



