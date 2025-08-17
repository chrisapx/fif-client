import React from 'react';
import { Sidebar } from 'primereact/sidebar';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchParamsVariables } from '../../../utilities/UrlParamVariables';
import { Logout05Icon, Home04Icon, UserAccountIcon, File01Icon, MoneySend01Icon, More01Icon, MoneyExchange01Icon, SecurityCheckIcon } from 'hugeicons-react';
import { logout } from '../../../utilities/AuthCookieManager';

const MenuPanel: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const menuStatus = searchParams.get(searchParamsVariables.menuPanelOpen);
  const navigate = useNavigate();

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
    navigate('/login')
  }

  return (
    <div>
      <Sidebar
        visible={menuStatus === '1'}
        onHide={handleHideMenuPanel}
        className="w-10/12 max-w-[320px]"
        position="left"
        content={({ hide }) => (
          <section className="h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center px-3 py-4 bg-blue-600 text-white">
                <i className="pi pi-times text-lg" onClick={hide}></i>
                <p className="font-semibold text-sm">FIFund Menu</p>
                <Logout05Icon size={18} onClick={handleLogout} />
              </div>

              <div className="divide-y text-sm font-medium">
                <div
                  className="px-4 py-3 flex gap-3 items-center hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                  onClick={() => handleNavigate('/home')}
                >
                  <Home04Icon size={18} />
                  <span>Home</span>
                </div>
                <div
                  className="px-4 py-3 flex gap-3 items-center hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                  onClick={() => handleNavigate('/profile')}
                >
                  <UserAccountIcon size={18} />
                  <span>Profile</span>
                </div>
                <div
                  className="px-4 py-3 flex gap-3 items-center hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                  onClick={() => handleNavigate('/apply-products')}
                >
                  <MoneySend01Icon size={18} />
                  <span>Apply for Products</span>
                </div>
                <div
                  className="px-4 py-3 flex gap-3 items-center hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                  onClick={() => handleNavigate('/fund-account')}
                >
                  <MoneyExchange01Icon size={18} />
                  <span>Fund My Account</span>
                </div>
                <div
                  className="px-4 py-3 flex gap-3 items-center hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                  onClick={() => handleNavigate('/transactions')}
                >
                  <File01Icon size={18} />
                  <span>My Transactions</span>
                </div>
                <div
                  className="px-4 py-3 flex gap-3 items-center hover:bg-blue-50 active:bg-blue-100 cursor-pointer text-red-300"
                  onClick={() => handleNavigate('/admin-actions')}
                >
                  <SecurityCheckIcon size={18} />
                  <span>Admin Actions</span>
                </div>
                <div
                  className="text-gray-200 px-4 py-3 flex gap-3 items-center hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                  // onClick={() => handleNavigate('/more')}
                >
                  <More01Icon size={18} />
                  <span>More</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-400 text-center">
              &copy; {new Date().getFullYear()} Family Investment Fund
            </div>
          </section>
        )}
      />
    </div>
  );
};

export default MenuPanel;