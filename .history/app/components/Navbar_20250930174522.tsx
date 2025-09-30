// components/Navbar.tsx

'use client';

import { Settings } from 'lucide-vue-next';

export default function Navbar() {
  return (
    <nav className="bg-purple-700 text-white flex items-center justify-between px-6 py-3 shadow-md">
      {/* Left: Logo */}
      <div className="flex items-center space-x-3">
        <div className="text-xl font-bold">Sellbrite</div>
        <ul className="hidden md:flex space-x-6 ml-10">
          <li><a href="#" className="hover:underline">Dashboard</a></li>
          <li><a href="#" className="hover:underline">Products</a></li>
          <li><a href="#" className="hover:underline">Listings</a></li>
          <li><a href="#" className="hover:underline">Orders</a></li>
          <li><a href="#" className="hover:underline">Reports</a></li>
        </ul>
      </div>

      {/* Right: Settings + User */}
      <div className="flex items-center space-x-4">
        <button className="hover:text-gray-200">
          <Settings size={18} />
        </button>
        <div className="bg-purple-800 px-3 py-1 rounded text-sm font-semibold">
          ths ▼
        </div>
      </div>
    </nav>
  );
}
