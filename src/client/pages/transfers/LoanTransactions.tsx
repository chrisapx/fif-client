import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationTabs from '../../components/BottomNavigationTabs';
import Header from '../../components/Header';
import { ArrowRight01Icon } from 'hugeicons-react';
import { api_urls } from '../../../utilities/api_urls';
import { getUserToken, getAuthUser, isAuthenticated } from '../../../utilities/AuthCookieManager';
import axios from 'axios';
import { useToast } from '../../../contexts/ToastContext';

interface LoanAccount {
  id: number;
  loanName: string;
  accountNo: string;
  principalDue: number;
  interestDue: number;
  currency: string;
  status: string;
}

const LoanTransactions: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [loanAccounts, setLoanAccounts] = useState<LoanAccount[]>([]);
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

    const fetchLoanAccounts = async () => {
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
        const loans: LoanAccount[] = [];

        if (accountsData.loanAccounts) {
          const activeLoans = accountsData.loanAccounts.filter((loan: any) => {
            const status = loan.status?.value?.toLowerCase() || '';
            return status === 'active';
          });

          activeLoans.forEach((loan: any) => {
            const summary = loan.summary || {};
            loans.push({
              id: loan.id,
              accountNo: loan.accountNo,
              loanName: loan.productName || loan.loanProductName || 'Loan Account',
              principalDue: summary.principalOutstanding || 0,
              interestDue: summary.interestOutstanding || 0,
              currency: loan.currency?.code || 'UGX',
              status: loan.status?.value || 'Active',
            });
          });
        }

        setLoanAccounts(loans);
      } catch (error: any) {
        console.error('Error fetching loan accounts:', error);
        showError(error.response?.data?.defaultUserMessage || 'Failed to load loan accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoanAccounts();
  }, [navigate, showError]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header title="Loan Transactions" />

      {/* Loan Selection */}
      <div className="flex-1 overflow-y-auto pb-20 pt-12">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a8ca5] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading loans...</p>
            </div>
          </div>
        ) : loanAccounts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">No active loans available</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {loanAccounts.map((loan) => (
              <div
                key={loan.id}
                className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
              >
                <div className="shrink-0 w-10 h-10 bg-black rounded flex items-center justify-center relative overflow-hidden">
                  <div className="w-[3px] h-4 bg-[#0099eb] absolute top-2 left-3 transform -skew-x-12"></div>
                  <div className="w-[3px] h-4 bg-[#00a651] absolute bottom-2 right-3 transform -skew-x-12"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-[#0d121b] text-[15px] font-bold">{loan.loanName}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[#666] text-[13px]">{loan.accountNo}</span>
                    <span className="text-green-600 text-[10px] font-semibold px-1.5 py-0.5 bg-green-50 rounded-full uppercase tracking-wide">
                      {loan.status}
                    </span>
                  </div>
                  <p className="text-[#888] text-[11px] font-medium mt-0.5 uppercase tracking-wide">
                    Principal: {loan.currency} {loan.principalDue.toLocaleString()} • Interest: {loan.currency} {loan.interestDue.toLocaleString()}
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

export default LoanTransactions;
