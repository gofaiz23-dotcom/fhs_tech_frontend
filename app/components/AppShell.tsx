"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/login";
  return (
    <>
      {!hideNavbar && <Navbar />}
      <main>
        {children}
      </main>
    </>
  );
}


