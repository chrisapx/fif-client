import React, { useState, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchParamsVariables } from '../../../utilities/UrlParamVariables';
import { Logout05Icon, Home04Icon, UserAccountIcon, File01Icon, More01Icon, MoneyExchange01Icon, ArrowDataTransferVerticalIcon } from 'hugeicons-react';
import { getAuthUser, logout, getAvailableAccounts, switchAccount } from '../../../utilities/AuthCookieManager';
import { sessionManager } from '../../../utilities/SessionManager';

const MenuPanel: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const menuStatus = searchParams.get(searchParamsVariables.menuPanelOpen);
  const navigate = useNavigate();
  const [user, setUser] = useState(getAuthUser());
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  // Update user data when menu opens
  useEffect(() => {
    if (menuStatus === '1') {
      setUser(getAuthUser());
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
    // Destroy session (clears timers and localStorage)
    sessionManager.destroy();
    // Also call logout to ensure cleanup
    logout();
    navigate('/login');
  }

  const handleSwitchAccount = (accountIndex: number) => {
    const success = switchAccount(accountIndex);
    if (success) {
      setShowAccountSwitcher(false);
      setUser(getAuthUser());
      // Refresh the current page
      window.location.reload();
    }
  }

  const accounts = getAvailableAccounts();
  const hasMultipleAccounts = accounts && accounts.length > 1;

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

              {/* Current Account Display */}
              {hasMultipleAccounts && (
                <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                  <p className="text-xs text-gray-500 mb-1">Current Account</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {user?.firstName || 'Account'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {accounts[user?.selectedAccountIndex || 0]?.accountNo || 'No account number'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100"
                    >
                      <ArrowDataTransferVerticalIcon size={14} />
                      Switch
                    </button>
                  </div>
                </div>
              )}

              {/* Account Switcher */}
              {showAccountSwitcher && hasMultipleAccounts && (
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Select Account:</p>
                  <div className="space-y-2">
                    {accounts.map((account: any, index: number) => (
                      <div
                        key={index}
                        onClick={() => handleSwitchAccount(index)}
                        className={`
                          p-2 rounded cursor-pointer transition-all text-sm
                          ${user?.selectedAccountIndex === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-white hover:bg-blue-50 text-gray-800'
                          }
                        `}
                      >
                        <p className="font-medium">{account.displayName}</p>
                        <p className={`text-xs ${user?.selectedAccountIndex === index ? 'text-blue-100' : 'text-gray-500'}`}>
                          {account.accountNo || account.email}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                {/* Temporarily disabled - will be enabled later */}
                {/* <div
                  className="px-4 py-3 flex gap-3 items-center hover:bg-blue-50 active:bg-blue-100 cursor-pointer"
                  onClick={() => handleNavigate('/apply-products')}
                >
                  <MoneySend01Icon size={18} />
                  <span>Apply for Products</span>
                </div> */}
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