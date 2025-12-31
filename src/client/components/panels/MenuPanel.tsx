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
  ChartHistogramIcon
} from 'hugeicons-react';
import { logout } from '../../../utilities/AuthCookieManager';
// import { sessionManager } from '../../../utilities/SessionManager';

const MenuPanel: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const menuStatus = searchParams.get(searchParamsVariables.menuPanelOpen);
  const navigate = useNavigate();
  const [lastLogin, setLastLogin] = useState<string>('');

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
        className="w-10/12 max-w-[320px]"
        position="left"
        content={() => (
          <section className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="bg-[#1a9ba8] text-white px-5 py-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">Menu</h2>
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleLogout}
                >
                  <Logout05Icon size={22} />
                </div>
              </div>
              <div className="text-sm text-white/90">
                Last login: {lastLogin}
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto">
              <div className="py-1">
                <div
                  className="px-5 py-4 flex items-center gap-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors border-b border-gray-100"
                  onClick={() => handleNavigate('/home')}
                >
                  <Home04Icon size={24} className="text-[#1a9ba8]" />
                  <span className="text-base font-medium">Home</span>
                </div>

                <div
                  className="px-5 py-4 flex items-center gap-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors border-b border-gray-100"
                  onClick={() => handleNavigate('/transactions')}
                >
                  <ArrowDataTransferVerticalIcon size={24} className="text-[#1a9ba8]" />
                  <span className="text-base font-medium">Transfers</span>
                </div>

                <div
                  className="px-5 py-4 flex items-center gap-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors border-b border-gray-100"
                  onClick={() => handleNavigate('/loans')}
                >
                  <MoneyExchange01Icon size={24} className="text-[#1a9ba8]" />
                  <span className="text-base font-medium">Loans</span>
                </div>

                <div
                  className="px-5 py-4 flex items-center gap-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors border-b border-gray-100"
                  onClick={() => handleNavigate('/history')}
                >
                  <ChartHistogramIcon size={24} className="text-[#1a9ba8]" />
                  <span className="text-base font-medium">History</span>
                </div>

                <div
                  className="px-5 py-4 flex items-center gap-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors border-b border-gray-100"
                  onClick={() => handleNavigate('/settings')}
                >
                  <Settings02Icon size={24} className="text-[#1a9ba8]" />
                  <span className="text-base font-medium">Settings</span>
                </div>
              </div>
            </div>
          </section>
        )}
      />
    </div>
  );
};

export default MenuPanel;