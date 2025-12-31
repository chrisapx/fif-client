import React, { useState, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchParamsVariables } from '../../../utilities/UrlParamVariables';
import {
  Logout05Icon,
  Home04Icon,
  ArrowDataTransferVerticalIcon,
  Settings02Icon,
  MoneyExchange01Icon,
  ChartHistogramIcon,
  CustomerSupportIcon,
  ArrowDown01Icon,
  ArrowUp01Icon
} from 'hugeicons-react';
import { logout } from '../../../utilities/AuthCookieManager';
// import { sessionManager } from '../../../utilities/SessionManager';

const MenuPanel: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const menuStatus = searchParams.get(searchParamsVariables.menuPanelOpen);
  const navigate = useNavigate();
  const [lastLogin, setLastLogin] = useState<string>('');
  const [showServiceRequests, setShowServiceRequests] = useState(false);
  const [showTransfers, setShowTransfers] = useState(false);

  // Update last login display when menu opens
  useEffect(() => {
    if (menuStatus === '1') {
      const storedLastLogin = localStorage.getItem('lastLoginTime');
      if (storedLastLogin) {
        const date = new Date(storedLastLogin);
        const formatted = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) + ', ' + date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        setLastLogin(formatted);
      } else {
        setLastLogin('Just now');
      }
    }
  }, [menuStatus]);

  const handleHideMenuPanel = () => {
    searchParams.delete(searchParamsVariables.menuPanelOpen);
    setSearchParams(searchParams);
  };

  const handleNavigate = (path: string) => {
    handleHideMenuPanel();
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  return (
    <div>
      <Sidebar
        visible={menuStatus === '1'}
        onHide={handleHideMenuPanel}
        className="w-[85%] max-w-[340px]"
        position="left"
        content={() => (
          <section className="h-full flex flex-col bg-gradient-to-b from-[#1a8ca5] to-[#044f5f] text-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-12 pb-3 text-sm border-b border-white/20">
              <div className="flex items-center space-x-1">
                <span>Inbox</span>
                <span className="bg-red-600 text-white text-[10px] font-bold px-1 rounded-sm ml-1">NEW</span>
              </div>
              <div className="flex space-x-4 text-xs font-medium">
                <button
                  className="flex items-center space-x-1 hover:text-gray-200"
                  onClick={() => handleNavigate('/settings')}
                >
                  <Settings02Icon size={14} />
                  <span>Settings</span>
                </button>
                <button
                  className="flex items-center space-x-1 hover:text-gray-200"
                  onClick={handleLogout}
                >
                  <Logout05Icon size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Last Login */}
            <div className="px-5 py-3 text-[10px] text-white/70 border-b border-white/10">
              Your last login was {lastLogin}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto">
              <ul className="flex flex-col py-2">
                <li>
                  <a
                    className="flex items-center px-5 py-3 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => handleNavigate('/home')}
                  >
                    <Home04Icon size={20} className="mr-4" />
                    <span className="text-sm font-medium">Home</span>
                  </a>
                </li>

                {/* Transfers (Collapsible) */}
                <li className={showTransfers ? 'bg-white/10 border-l-4 border-white' : ''}>
                  <a
                    className="flex items-center justify-between px-5 py-3 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => setShowTransfers(!showTransfers)}
                  >
                    <div className="flex items-center">
                      <ArrowDataTransferVerticalIcon size={20} className="mr-4" />
                      <span className="text-sm font-medium">Transfers</span>
                    </div>
                    {showTransfers ? <ArrowUp01Icon size={18} /> : <ArrowDown01Icon size={18} />}
                  </a>

                  {/* Transfers Submenu */}
                  {showTransfers && (
                    <ul className="flex flex-col pl-[52px] pb-2 space-y-3 text-sm font-light text-white/90">
                      <li className="relative">
                        <div className="absolute -left-3 top-0 bottom-0 w-[1px] bg-white/30"></div>
                        <a
                          className="block hover:text-white pl-2 cursor-pointer"
                          onClick={() => handleNavigate('/transfers/own-accounts')}
                        >
                          Between Own Accounts
                        </a>
                      </li>
                    </ul>
                  )}
                </li>

                <li>
                  <a
                    className="flex items-center px-5 py-3 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => handleNavigate('/loans')}
                  >
                    <MoneyExchange01Icon size={20} className="mr-4" />
                    <span className="text-sm font-medium">Loans</span>
                  </a>
                </li>

                <li>
                  <a
                    className="flex items-center px-5 py-3 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => handleNavigate('/history')}
                  >
                    <ChartHistogramIcon size={20} className="mr-4" />
                    <span className="text-sm font-medium">History</span>
                  </a>
                </li>

                {/* Service Requests (Collapsible) */}
                <li className={showServiceRequests ? 'bg-white/10 border-l-4 border-white' : ''}>
                  <a
                    className="flex items-center justify-between px-5 py-3 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => setShowServiceRequests(!showServiceRequests)}
                  >
                    <div className="flex items-center">
                      <CustomerSupportIcon size={20} className="mr-4" />
                      <span className="text-sm font-medium">Service Requests</span>
                    </div>
                    {showServiceRequests ? <ArrowUp01Icon size={18} /> : <ArrowDown01Icon size={18} />}
                  </a>

                  {/* Service Requests Submenu */}
                  {showServiceRequests && (
                    <ul className="flex flex-col pl-[52px] pb-2 space-y-3 text-sm font-light text-white/90">
                      <li className="relative">
                        <div className="absolute -left-3 top-0 bottom-0 w-[1px] bg-white/30"></div>
                        <a
                          className="block hover:text-white pl-2 cursor-pointer"
                          onClick={() => handleNavigate('/apply-products')}
                        >
                          Apply for Loan
                        </a>
                      </li>
                      <li className="relative">
                        <div className="absolute -left-3 top-0 bottom-0 w-[1px] bg-white/30"></div>
                        <a
                          className="block hover:text-white pl-2 cursor-pointer"
                          onClick={() => handleNavigate('/savings-products')}
                        >
                          Apply for Savings Account
                        </a>
                      </li>
                    </ul>
                  )}
                </li>
              </ul>
            </div>

            {/* Referral Section */}
            <div className="bg-white text-gray-800 p-4 relative shrink-0">
              <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/30 rounded-full"></div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-[#007ba8] font-medium text-sm mb-1">Refer Family/Friends</h3>
                  <p className="text-[10px] text-gray-600 leading-tight mb-2">
                    Refer and stand to win<br/>
                    Exclusive LFC Rewards.<br/>
                    T&Cs Apply
                  </p>
                  <a
                    className="text-[#007ba8] text-xs font-medium underline decoration-1 underline-offset-2 cursor-pointer"
                    onClick={() => handleNavigate('/more')}
                  >
                    Refer Now
                  </a>
                </div>
                <div className="w-16 h-10 bg-gradient-to-tr from-blue-100 to-blue-200 rounded overflow-hidden"></div>
              </div>
            </div>
          </section>
        )}
      />
    </div>
  );
};

export default MenuPanel;