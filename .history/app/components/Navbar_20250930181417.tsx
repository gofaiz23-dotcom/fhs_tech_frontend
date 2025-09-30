// components/Navbar.tsx

'use client';

import {
  Settings,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="bg-purple-700 text-white flex items-center justify-between px-6 py-3 shadow-md">
      {/* Left: Logo and Navigation */}
      <div className="flex items-center space-x-3">
        <div className="tracking-wide">
            <a href="/">
            <Image src="fhs-tech-logo.png" alt='brand logo' width={50} height={50} ></Image></a>
        </div>

        <ul className="hidden md:flex space-x-6 ml-10 text-sm font-medium">
          <li><a href="#" className="hover:underline">Dashboard</a></li>
          <li><a href="#" className="hover:underline">Products</a></li>
          <li><a href="#" className="hover:underline">Listings</a></li>
          <li><a href="#" className="hover:underline">Orders</a></li>
          <li><a href="#" className="hover:underline">Reports</a></li>
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
