// components/Navbar.tsx

'use client';

import {
  Settings,
  ChevronDown,
  } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import Router from 'next/router';

export default function Navbar() {
  return (
    <nav className="bg-purple-700 text-white flex items-center justify-between px-6 py-10 shadow-md">
      {/* Left: Logo and Navigation */}
      <div className="flex items-center space-x-3">
        <div className="tracking-wide">
            <a href="/">
            <Image src="/fhs-tech-logo.png" alt='brand logo' width={100} height={100} ></Image></a>
        </div>


        <ul className="hidden md:flex space-x-6 ml-10 text-sm font-medium">
          <Link href='/dashboard.tsx' className="hover:underline">Dashboard </Link>
          <Link href='/Products' className="hover:underline">Products </Link>
          <Link href='/Listing' className="hover:underline">Listings </Link>
          <Link href='/Orders' className="hover:underline">Orders </Link>
          <Link href='/Reports' className="hover:underline">Reports </Link>
        </ul>
      </div>

      {/* Right: Settings Icon + User */}
      <div className="flex items-center space-x-4">
        <button className="hover:text-gray-200 transition">
          <Settings size={18} strokeWidth={2} />
        </button>

        <div className="flex items-center bg-purple-800 px-3 py-1 rounded text-sm font-medium cursor-pointer hover:bg-purple-900 transition">
          ths
          <ChevronDown size={16} className="ml-1" />
        </div>
      </div>
    </nav>
  );
}
