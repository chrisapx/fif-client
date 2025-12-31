import React, { useEffect, useState } from 'react';

const MobileOnlyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      // Check if viewport width is mobile size (768px or less)
      const isMobileViewport = window.innerWidth <= 768;

      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);

      // Consider it mobile if either viewport is mobile-sized OR it's a mobile user agent
      setIsMobile(isMobileViewport || isMobileUserAgent);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  if (!isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 px-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-24 w-24 text-[#1a8ca5]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Mobile Only Access
          </h1>
          <p className="text-gray-600 mb-6">
            This application is designed exclusively for mobile devices.
            Please access it from your smartphone or tablet for the best experience.
          </p>
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-teal-800">
              <strong>How to access:</strong>
            </p>
            <ul className="text-sm text-[#157582] mt-2 text-left list-disc list-inside">
              <li>Open this URL on your mobile device</li>
              <li>Or resize your browser to mobile width (≤768px)</li>
            </ul>
          </div>
          <div className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Family Investment Fund
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MobileOnlyWrapper;
