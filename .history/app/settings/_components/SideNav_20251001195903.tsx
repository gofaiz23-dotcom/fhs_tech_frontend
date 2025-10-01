"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Settings, User, KeyRound, Users, Code2, Store, Warehouse, Menu, X, ChevronsRight, ChevronsLeft } from "lucide-react";

export default function SideNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const item = (href: string, label: string, Icon: any) => (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${isActive(href) ? 'bg-white/10 text-white' : 'text-white/90 hover:bg-white/10'}`}>
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  return (
    <>
      <button className="md:hidden border rounded px-2 py-1 text-sm bg-cyan-500 text-white border-cyan-500" onClick={()=>setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
      <aside className={`bg-blue-600 text-white rounded h-fit ${collapsed ? 'w-14' : 'w-64'} transition-all duration-300 ${mobileOpen ? 'block' : 'hidden'} md:block`}> 
        <div className="p-2 flex items-center justify-between">
          <div className="text-xs font-semibold text-white/80">{!collapsed ? 'ACCOUNT SETTINGS' : 'AS'}</div>
          <button className="text-xs text-white/80" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
        </div>
        <div className="px-2 space-y-1">
          {/* {item('/settings/account','Account Info', (p:any)=> <User {...p} color="#facc15" />)} */}
          {/* {item('/settings/change-password','Change Password', (p:any)=> <KeyRound {...p} color="#34d399" />)} */}
          {/* {item('/settings/users','Users', (p:any)=> <Users {...p} color="#60a5fa" />)} */}
          {item('/settings/manage-users','Manage Users', (p:any)=> <Users {...p} color="#e879f9" />)}
          {item('/settings/api','API', (p:any)=> <Code2 {...p} color="#f472b6" />)}
        </div>

        <div className="p-2 mt-4">
          <div className="text-xs font-semibold text-white/80">{!collapsed ? 'APPLICATION SETTINGS' : 'AP'}</div>
        </div>
        <div className="px-2 space-y-1">
          {item('/settings/channels','Sales Channel Integrations', (p:any)=> <Store {...p} color="#a78bfa" />)}
          {item('/settings/warehouses','Warehouse Locations', (p:any)=> <Warehouse {...p} color="#fb7185" />)}
        </div>

        <div className="mt-6 px-2 pb-2">
          <Link href={'/settings'} className="flex items-center justify-center border border-white/30 rounded py-2 text-sm text-white hover:bg-white/10">
            <Settings size={16} className="mr-2" color="#fde68a" /> {!collapsed ? 'Settings' : ''}
          </Link>
        </div>
      </aside>
    </>
  );
}



