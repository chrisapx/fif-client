import Header from '../components/Header';
import BottomNavigationTabs from '../components/BottomNavigationTabs';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { api_urls } from '../../utilities/api_urls';
import { getAuthUser, getUserToken } from '../../utilities/AuthCookieManager';
import { BsArrowDownCircle, BsArrowUpCircle } from 'react-icons/bs';
import { FiRefreshCcw } from 'react-icons/fi';

const Transactions = () => {
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const getIconAndColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
      case 'credit':
        return { icon: <BsArrowDownCircle className="text-green-500" size={20} />, color: 'text-green-600' };
      case 'withdraw':
      case 'debit':
        return { icon: <BsArrowUpCircle className="text-red-500" size={20} />, color: 'text-red-600' };
      case 'transfer':
        return { icon: <FiRefreshCcw className="text-blue-500" size={20} />, color: 'text-blue-600' };
      default:
        return { icon: <FiRefreshCcw className="text-gray-400" size={20} />, color: 'text-gray-600' };
    }
  };

  const formatDate = (dateString: string | number[]) => {
    if (!dateString) return '—';

    // Handle array format [2025, 12, 26]
    if (Array.isArray(dateString)) {
      const date = new Date(dateString[0], dateString[1] - 1, dateString[2]);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    // Handle string format
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      'Fineract-Platform-TenantId': tenant,
    };

  useEffect(() => {
    const fetchUserTransactions = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const user = getAuthUser();
        const clientId = user?.userId;

        // Debug: Check if clientId exists
        if (!clientId) {
          console.error('Client ID not found in user data');
          setIsLoading(false);
          return;
        }

        // First, get all savings accounts for the client
        const accountsResponse = await axios.get(
          api_urls.clients.get_client_accounts(clientId),
          { headers }
        );

        const accountsData = accountsResponse.data || {};

        // Filter out closed/withdrawn accounts
        const savingsAccounts = (accountsData.savingsAccounts || []).filter((acc: any) => {
          const status = acc.status?.value?.toLowerCase() || '';
          const statusCode = acc.status?.code?.toLowerCase() || '';
          const excludedStatuses = ['withdrawn', 'rejected', 'closed'];
          return !excludedStatuses.some(excluded => status.includes(excluded) || statusCode.includes(excluded));
        });

        // Fetch transactions for savings accounts using associations parameter
        const savingsTransactionsPromises = savingsAccounts.map(async (account: any) => {
          try {
            // Use associations=transactions for efficient fetching
            const accountResponse = await axios.get(
              api_urls.transactions.get_savings_with_transactions(account.id),
              { headers }
            );

            // Map Fineract transactions to your app's format
            return (accountResponse.data.transactions || []).map((trx: any) => ({
              trxId: trx.id,
              trxRef: trx.id?.toString() || '—',
              trxDescription: trx.note || trx.transactionType?.value || 'Savings Transaction',
              trxAmount: trx.amount || 0,
              transactionType: trx.transactionType?.deposit ? 'DEPOSIT' : 'WITHDRAW',
              accountType: 'SAVINGS',
              accountId: account.accountNo,
              accountName: account.productName || account.shortProductName,
              createdAt: trx.date || trx.submittedOnDate,
              trxStatus: trx.reversed ? 'REVERSED' : 'COMPLETED',
              currency: trx.currency?.displaySymbol || 'UGX'
            }));
          } catch (err) {
            console.error(`Error fetching savings transactions for account ${account.id}:`, err);
            return [];
          }
        });

        const transactionsArrays = await Promise.all(savingsTransactionsPromises);
        const allTransactions = transactionsArrays.flat();

        // Sort by date (newest first)
        allTransactions.sort((a, b) => {
          const dateA = Array.isArray(a.createdAt)
            ? new Date(a.createdAt[0], a.createdAt[1] - 1, a.createdAt[2]).getTime()
            : new Date(a.createdAt).getTime();
          const dateB = Array.isArray(b.createdAt)
            ? new Date(b.createdAt[0], b.createdAt[1] - 1, b.createdAt[2]).getTime()
            : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setAllTransactions(allTransactions);
      } catch (err: any) {
        console.error('Error:', err);
        setErrorMessage(err.response?.data?.defaultUserMessage || 'Unable to load your transactions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTransactions();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="pt-14 px-3 flex-1 bg-gray-50">
        {isLoading && <p className="text-center text-gray-500 py-4">Loading transactions...</p>}
        {errorMessage && <p className="text-center text-red-500 py-4">{errorMessage}</p>}

        {!isLoading && !errorMessage && allTransactions.length === 0 && (
          <p className="text-center text-gray-400 py-4">No transactions available</p>
        )}

        {allTransactions.map((trx, index) => {
          const { icon, color } = getIconAndColor(trx?.transactionType);
          return (
            <div
              key={index}
              className="flex items-center justify-between bg-white p-4 mb-3 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <p className="text-sm font-medium text-gray-800">{trx?.trxDescription || '—'}</p>
                  <p className="text-xs text-gray-500">
                    {trx?.accountType && `${trx.accountType} - `}{trx?.accountName || 'Account'}
                  </p>
                  <p className="text-[11px] text-gray-400">{formatDate(trx?.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${color}`}>
                  {trx?.trxAmount ? `${trx.currency} ${Number(trx.trxAmount).toLocaleString()}` : '—'}
                </div>
                <p className="text-xs text-gray-500">A/C {trx?.accountId || '—'}</p>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default Transactions;
