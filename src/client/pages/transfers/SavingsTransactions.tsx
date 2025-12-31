import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationTabs from '../../components/BottomNavigationTabs';
import Header from '../../components/Header';
import { ArrowRight01Icon } from 'hugeicons-react';
import { api_urls } from '../../../utilities/api_urls';
import { getUserToken, getAuthUser, isAuthenticated } from '../../../utilities/AuthCookieManager';
import axios from 'axios';
import { useToast } from '../../../contexts/ToastContext';

interface SavingsAccount {
  id: number;
  accountName: string;
  accountNo: string;
  balance: number;
  currency: string;
}

const SavingsTransactions: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchSavingsAccounts = async () => {
      setIsLoading(true);
      try {
        const user = getAuthUser();
        const clientId = user?.userId;

        if (!clientId) {
          showError('Client ID not found');
          setIsLoading(false);
          return;
        }

        const response = await axios.get(
          api_urls.clients.get_client_accounts(clientId),
          { headers }
        );

        const accountsData = response.data || {};
        const accounts: SavingsAccount[] = [];

        if (accountsData.savingsAccounts) {
          const activeSavings = accountsData.savingsAccounts.filter((acc: any) => {
            const status = acc.status?.value?.toLowerCase() || '';
            return status === 'active';
          });

          activeSavings.forEach((acc: any) => {
            accounts.push({
              id: acc.id,
              accountNo: acc.accountNo,
              accountName: acc.productName || acc.savingsProductName || 'Savings Account',
              balance: acc.accountBalance || 0,
              currency: acc.currency?.code || 'UGX',
            });
          });
        }

        setSavingsAccounts(accounts);
      } catch (error: any) {
        console.error('Error fetching savings accounts:', error);
        showError(error.response?.data?.defaultUserMessage || 'Failed to load savings accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavingsAccounts();
  }, [navigate, showError]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header title="Savings Transactions" />

      {/* Account Selection */}
      <div className="flex-1 overflow-y-auto pb-20 pt-12">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a8ca5] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading accounts...</p>
            </div>
          </div>
        ) : savingsAccounts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">No savings accounts available</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {savingsAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
              >
                <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-[#1a8ca5] to-[#044f5f] rounded-full flex items-center justify-center">
                  <span className="text-white text-base font-bold">
                    {account.accountName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-[#0d121b] text-[15px] font-bold">{account.accountName}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[#666] text-[13px]">{account.accountNo}</span>
                    <span className="text-[#666] text-[13px] font-medium">{account.currency}</span>
                  </div>
                  <p className="text-[#888] text-[11px] font-medium mt-0.5 uppercase tracking-wide">
                    Balance: {account.currency} {account.balance.toLocaleString()}
                  </p>
                </div>
                <ArrowRight01Icon size={28} className="text-gray-300" />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default SavingsTransactions;
