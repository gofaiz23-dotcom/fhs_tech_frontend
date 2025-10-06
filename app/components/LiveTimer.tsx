"use client";

import React, { useState, useEffect } from 'react';

interface LiveTimerProps {
  startTime: string; // ISO string of when the session started
  className?: string;
}

export default function LiveTimer({ startTime, className = "" }: LiveTimerProps) {
  const [duration, setDuration] = useState<string>('0m');

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      
      if (hours > 0) {
        setDuration(`${hours}h ${mins}m`);
      } else {
        setDuration(`${mins}m`);
      }
    };

    // Update immediately
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className={`text-sm text-gray-900 dark:text-gray-100 ${className}`}>
      {duration}
    </span>
  );
}
