"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Navbar from "./Navbar";
import { useSidebar } from "./SidebarContext";
import HydrationSafe from "./HydrationSafe";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/login";
  const { sidebarCollapsed } = useSidebar();
  const { resolvedTheme } = useTheme();
  
  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className={`main-content transition-all duration-300 ease-in-out`} style={{
        marginLeft: hideNavbar ? '0' : (sidebarCollapsed ? '64px' : '256px'),
        width: hideNavbar ? '100%' : `calc(100% - ${sidebarCollapsed ? '64px' : '256px'})`,
        maxWidth: hideNavbar ? '100%' : `calc(100% - ${sidebarCollapsed ? '64px' : '256px'})`
      }}>
    <HydrationSafe fallback={<div className="w-full min-h-screen overflow-x-hidden bg-secondary-50 dark:bg-black"><div className={hideNavbar ? '' : 'p-4 sm:p-6'}>{children}</div></div>}>
      <div className={`w-full min-h-screen overflow-x-hidden ${resolvedTheme === 'dark' ? 'bg-black' : 'bg-secondary-50'}`}>
        <div className={hideNavbar ? '' : 'p-4 sm:p-6'}>
          {children}
        </div>
      </div>
    </HydrationSafe>
      </main>
    </>
  );
}


