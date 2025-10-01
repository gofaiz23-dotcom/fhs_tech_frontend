// components/Navbar.tsx

"use client";

import { Settings, ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [productsOpen, setProductsOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) =>
    mounted && (pathname === href || pathname?.startsWith(href + "/"));
  const linkClass = (href: string) =>
    isActive(href) ? "text-yellow-300 underline" : "hover:underline";

  return (
    <nav className=" bg-blue-600 text-white shadow-md w-full">
      {" "}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo */}{" "}
        <Link href="/" className="flex items-center">
          {" "}
          <Image
            src="/fhs-tech-logo.png"
            alt="brand logo"
            width={130}
            height={130}
          />{" "}
        </Link>
        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-6 text-md font-medium justify-center flex-1 text-center">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Dashboard
          </Link>

          {/* Products Dropdown (Desktop) */}
          <div className="relative group">
            <button className="flex items-center hover:underline">
              Products <ChevronDown size={16} className="" />
            </button>
            <div className="absolute left-0  hidden group-hover:block bg-white text-gray-800 rounded shadow-md min-w-[160px]">
              <Link
                href="/products"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                All Products
              </Link>
              <Link
                href="/inventory"
                className="block px-4 py-2 hover:bg-gray-100"
              >
                Inventory
              </Link>
            </div>
          </div>

          <Link href="/listings" className={linkClass("/listings")}>
            Listings
          </Link>
          <Link href="/orders" className={linkClass("/orders")}>
            Orders
          </Link>
          <Link href="/reports" className={linkClass("/reports")}>
            Reports
          </Link>
        </ul>
        {/* Right: Settings + User */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/settings/channels"
            className="hover:text-gray-200 transition"
          >
            <Settings size={18} strokeWidth={2} />
          </Link>
          <Link href="/login" className="hover:text-gray-200 transition text-sm">Login</Link>
          <div className="flex items-center bg-purple-800 px-3 py-1 rounded text-sm font-medium cursor-pointer hover:bg-purple-900 transition">
            ths
            <ChevronDown size={16} className="ml-1" />
          </div>
        </div>
        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-purple-800 text-white px-6 pb-4 space-y-4">
          <Link
            href="/dashboard"
            className="block hover:underline"
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>

          {/* Products Dropdown (Mobile) */}
          {/* Products Dropdown (Desktop) */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button className="flex items-center hover:underline">
              Products <ChevronDown size={16} className="ml-1" />
            </button>
            {productsOpen && (
              <div className="absolute left-0 mt-2 bg-white text-gray-800 rounded shadow-md min-w-[160px]">
                <Link
                  href="/products"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  All Products
                </Link>
                <Link
                  href="/inventory"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Inventory
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/listings"
            className="block hover:underline"
            onClick={() => setMenuOpen(false)}
          >
            Listings
          </Link>
          <Link
            href="/orders"
            className="block hover:underline"
            onClick={() => setMenuOpen(false)}
          >
            Orders
          </Link>
          <Link
            href="/reports"
            className="block hover:underline"
            onClick={() => setMenuOpen(false)}
          >
            Reports
          </Link>

          <div className="flex items-center justify-between pt-4 border-t border-purple-600">
            <Link
              href="/settings/channels"
              className="hover:text-gray-200 transition"
              onClick={() => setMenuOpen(false)}
            >
              <Settings size={18} strokeWidth={2} />
            </Link>
            <Link href="/login" className="hover:text-gray-200 transition" onClick={() => setMenuOpen(false)}>Login</Link>
            <div className="flex items-center bg-purple-900 px-3 py-1 rounded text-sm font-medium cursor-pointer hover:bg-purple-950 transition">
              ths
              <ChevronDown size={16} className="ml-1" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
