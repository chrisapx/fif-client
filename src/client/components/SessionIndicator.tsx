/**
 * SessionIndicator Component
 *
 * Optional visual indicator for session status.
 * Use this for testing and development to see when the session is active.
 * Remove or comment out in production if not needed.
 */

import React, { useState, useEffect } from 'react';
import { isAuthenticated } from '../../utilities/AuthCookieManager';

const SessionIndicator: React.FC = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  useEffect(() => {
    // Check if user is authenticated
    setSessionActive(isAuthenticated());

    // Update last activity time on user interactions
    const updateActivity = () => {
      setLastActivity(new Date());
    };

    const events = ['mousedown', 'keypress', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  if (!sessionActive) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs z-50">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div>
          <div className="font-semibold">Session Active</div>
          <div className="text-[10px] opacity-75">
            Last activity: {lastActivity.toLocaleTimeString()}
          </div>
          <div className="text-[10px] opacity-75">
            Timeout: 30s inactive / 5min total
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionIndicator;
