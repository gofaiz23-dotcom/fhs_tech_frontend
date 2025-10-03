"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { useSidebar } from "./SidebarContext";
import "./ResponsiveLayout.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/login";
  const { sidebarCollapsed } = useSidebar();
  
  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className={`main-content transition-all duration-300 ease-in-out ${
        hideNavbar ? '' : `pt-16`
      }`} style={{
        marginLeft: hideNavbar ? '0' : (sidebarCollapsed ? '64px' : '256px'),
        width: hideNavbar ? '100%' : `calc(100% - ${sidebarCollapsed ? '64px' : '256px'})`,
        maxWidth: hideNavbar ? '100%' : `calc(100% - ${sidebarCollapsed ? '64px' : '256px'})`
      }}>
        <div className="w-full min-h-screen overflow-x-hidden">
          {children}
        </div>
      </main>
    </>
  );
}


