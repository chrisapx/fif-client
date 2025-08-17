import { useNavigate } from 'react-router-dom';
import logoIcon from '/logos/Splach Logo.png';
import React from 'react';

const Welcome: React.FC = () => {
    const navigate = useNavigate();
  return (
    <div className="flex dark flex-col items-center justify-center h-screen bg-white relative overflow-hidden">
      <div className="flex flex-col items-center z-10">
        <img
          src={logoIcon}
          alt="SACCO Logo"
          className="h-16 mb-2"
        />
      </div>

        <button onClick={() => navigate('/login')} className='absolute z-20 bottom-4 py-3 px-4 text-white border flex-1 w-[90%] font-semibold rounded-lg mx-4'>
            Get Started
        </button>

      {/* Wavy Background */}
      <div className="absolute bottom-0 left-0 w-full h-2/3">
        <svg
          className="absolute bottom-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#115DA9"
            fillOpacity="1"
            d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,213.3C840,224,960,224,1080,213.3C1200,203,1320,181,1380,170.7L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
        </svg>
      </div>
    </div>
  );
};

export default Welcome;