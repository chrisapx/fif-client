import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle02Icon } from 'hugeicons-react';
import { getAuthUser, setAuthUser } from '../../utilities/AuthCookieManager';

const SelectAccount: React.FC = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    const user = getAuthUser();

    if (!user || !user.accounts || user.accounts.length === 0) {
      // No accounts found, redirect to login
      navigate('/login');
      return;
    }

    if (user.accounts.length === 1) {
      // Only one account, go directly to home
      navigate('/home');
      return;
    }

    setAccounts(user.accounts);
  }, [navigate]);

  const handleAccountSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleContinue = () => {
    if (selectedIndex === null) {
      return;
    }

    const user = getAuthUser();
    const selectedAccount = accounts[selectedIndex];

    // Update user data with selected account
    const updatedUserData = {
      ...user,
      selectedAccountIndex: selectedIndex,
      userId: selectedAccount.clientId,
      email: selectedAccount.email,
      firstName: selectedAccount.displayName
    };

    setAuthUser(updatedUserData);
    navigate('/home');
  };

  return (
    <div className="p-5 flex flex-col justify-between min-h-screen bg-white relative overflow-hidden">
      {/* Header Background */}
      <div className="absolute top-0 left-0 w-full h-3/7">
        <svg
          className="absolute top-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#1a8ca5"
            fillOpacity="0.9"
            d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,213.3C840,224,960,224,1080,213.3C1200,203,1320,181,1380,170.7L1440,160L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
          />
        </svg>
      </div>

      {/* Header */}
      <section className='z-30 mt-3'>
        <div className='flex justify-center items-center'>
          <img src="/logos/fif 3.png" alt="" className='h-10'/>
        </div>
        <h1 className="text-white mt-8 text-left text-lg font-bold">
          Select Account
          <p className="font-normal mt-2 text-sm">Choose which account you want to access</p>
        </h1>
      </section>

      {/* Account Selection */}
      <div className="flex flex-col z-30 flex-1 justify-center space-y-4 w-full mt-8">
        {accounts.map((account, index) => (
          <div
            key={index}
            onClick={() => handleAccountSelect(index)}
            className={`
              w-full p-5 border-2 rounded-lg cursor-pointer transition-all
              ${selectedIndex === index
                ? 'border-[#1a8ca5] bg-teal-50'
                : 'border-gray-200 bg-white hover:border-teal-300'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`
                p-3 rounded-full
                ${selectedIndex === index ? 'bg-[#1a8ca5]' : 'bg-gray-200'}
              `}>
                <UserCircle02Icon
                  size={28}
                  className={selectedIndex === index ? 'text-white' : 'text-gray-600'}
                />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-gray-800">
                  {account.displayName}
                </p>
                <p className="text-sm text-gray-500">
                  {account.accountNo ? `A/C: ${account.accountNo}` : account.email}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {account.officeName} • {account.status}
                </p>
              </div>
              {selectedIndex === index && (
                <div className="w-6 h-6 rounded-full bg-[#1a8ca5] flex items-center justify-center">
                  <i className="pi pi-check text-white text-xs"></i>
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={handleContinue}
          disabled={selectedIndex === null}
          className={`
            w-full py-4 mt-6 rounded-md font-bold text-white transition-colors
            ${selectedIndex !== null
              ? 'bg-[#1a8ca5] hover:bg-[#044f5f]'
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          Continue
        </button>
      </div>

      {/* Footer */}
      <div className="flex justify-center items-center border-t pt-4 border-gray-300 z-30">
        <p className="text-sm text-gray-400">Family Investment Fund © FIF Inc</p>
      </div>
    </div>
  );
};

export default SelectAccount;
