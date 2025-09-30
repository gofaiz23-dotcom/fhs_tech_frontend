// components/Navbar.tsx

'use client';

import {
  Settings,
  ChevronDown,
  } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const [productsOpen, setProductsOpen] = React.useState(false);
  const productsRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => { setMounted(true); }, []);
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!productsRef.current) return;
      if (!productsRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);
  const isActive = (href: string) => mounted && (pathname === href || pathname?.startsWith(href + '/'));
  const linkClass = (href: string) => isActive(href) ? 'text-yellow-300 underline' : 'hover:underline';
  const productsActive = mounted && (pathname?.startsWith('/products') || pathname?.startsWith('/inventory'));
  const productsLinkClass = productsActive ? 'text-yellow-300 underline' : 'hover:underline';
  return (
    <nav className="bg-purple-700 text-white item-center justify-center flex  px-6 py-10 shadow-md w-full">
      {/* Left: Logo and Navigation */}
      <div className="flex items-center space-x-3 w-1/2">
        <div className="tracking-wide justify-start left-0">
            <a href="/">
            <Image src="/fhs-tech-logo.png" alt='brand logo' width={100} height={100} ></Image></a>
        </div>


        <ul className="hidden  md:flex space-x-6 pr-10 text-md font-medium">
          <Link
            href='/dashboard'
            className={linkClass('/dashboard')}
          >
            Dashboard
          </Link>
          <div
            className="relative"
            ref={productsRef}
            onMouseEnter={() => setProductsOpen(true)}
          >
            <Link
              href='/products'
              className={`${productsLinkClass} inline-block`}
              onClick={(e) => { e.preventDefault(); setProductsOpen((v) => !v); }}
            >
              Products
            </Link>
            {productsOpen && (
              <div className="absolute left-0 top-full mt-1 z-50">
                <div className="bg-white text-gray-800 rounded shadow-md min-w-[180px] py-2">
                  <Link href='/products' className="block px-4 py-2 hover:bg-gray-100" onClick={() => setProductsOpen(false)}>All products</Link>
                  <Link href='/inventory' className="block px-4 py-2 hover:bg-gray-100" onClick={() => setProductsOpen(false)}>Inventory</Link>
                </div>
              </div>
            )}
          </div>
          <Link
            href='/listings'
            className={linkClass('/listings')}
          >
            Listings
          </Link>
          <Link
            href='/orders'
            className={linkClass('/orders')}
          >
            Orders
          </Link>
          <Link
            href='/reports'
            className={linkClass('/reports')}
          >
            Reports
          </Link>
        </ul>
      </div>

      {/* Right: Settings Icon + User */}
      <div className="flex items-center space-x-4">
        <Link href='/settings/channels' className="hover:text-gray-200 transition">
          <Settings size={18} strokeWidth={2} />
        </Link>

        <div className="flex items-center bg-purple-800 px-3 py-1 rounded text-sm font-medium cursor-pointer hover:bg-purple-900 transition">
          ths
          <ChevronDown size={16} className="ml-1" />
        </div>
      </div>
    </nav>
  );
}
