"use client";

import React from 'react';

interface AppleToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function AppleToggle({ 
  checked, 
  onChange, 
  disabled = false, 
  size = 'md',
  label 
}: AppleToggleProps) {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6', 
    lg: 'w-14 h-8'
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0',
    md: checked ? 'translate-x-5' : 'translate-x-0',
    lg: checked ? 'translate-x-6' : 'translate-x-0'
  };

  return (
    <div className="flex items-center space-x-3">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          ${sizeClasses[size]}
          relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 
          focus:ring-indigo-500 focus:ring-offset-2
          ${checked 
            ? 'bg-green-500' 
            : 'bg-gray-200'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-opacity-80'
          }
        `}
      >
        <span
          className={`
            ${thumbSizeClasses[size]}
            ${translateClasses[size]}
            pointer-events-none inline-block transform rounded-full bg-white shadow-lg 
            ring-0 transition duration-200 ease-in-out
            ${checked ? 'shadow-green-200' : 'shadow-gray-200'}
          `}
        />
      </button>
    </div>
  );
}
