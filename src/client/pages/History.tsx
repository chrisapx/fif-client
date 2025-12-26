import Header from '../components/Header';
import BottomNavigationTabs from '../components/BottomNavigationTabs';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { api_urls } from '../../utilities/api_urls';
import { getAuthUser, getUserToken } from '../../utilities/AuthCookieManager';
import { BsArrowDownCircle, BsArrowUpCircle } from 'react-icons/bs';
import { FiRefreshCcw } from 'react-icons/fi';

const History = () => {
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const getIconAndColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
      case 'credit':
        return { icon: <BsArrowDownCircle className="text-green-500" size={20} />, color: 'text-green-600' };
      case 'withdraw':
      case 'withdrawal':
      case 'debit':
        return { icon: <BsArrowUpCircle className="text-red-500" size={20} />, color: 'text-red-600' };
      case 'repayment':
        return { icon: <FiRefreshCcw className="text-green-500" size={20} />, color: 'text-green-600' };
      case 'disbursement':
        return { icon: <FiRefreshCcw className="text-blue-500" size={20} />, color: 'text-blue-600' };
      case 'purchase':
        return { icon: <BsArrowDownCircle className="text-purple-500" size={20} />, color: 'text-purple-600' };
      case 'redeem':
        return { icon: <BsArrowUpCircle className="text-orange-500" size={20} />, color: 'text-orange-600' };
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
    const fetchAllTransactions = async () => {
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

        // First, get all accounts for the client
        const accountsResponse = await axios.get(
          api_urls.clients.get_client_accounts(clientId),
          { headers }
        );

        const accountsData = accountsResponse.data || {};
        const savingsAccounts = accountsData.savingsAccounts || [];
        const loanAccounts = accountsData.loanAccounts || [];
        const shareAccounts = accountsData.shareAccounts || [];

        // Fetch transactions for each savings account using associations
        const savingsTransactionsPromises = savingsAccounts.map(async (account: any) => {
          try {
            const accountResponse = await axios.get(
              api_urls.transactions.get_savings_with_transactions(account.id),
              { headers }
            );

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

        // Fetch transactions for each loan account using associations
        const loanTransactionsPromises = loanAccounts.map(async (loan: any) => {
          try {
            const loanResponse = await axios.get(
              api_urls.loans.get_loan_with_transactions(loan.id),
              { headers }
            );

            return (loanResponse.data.transactions || []).map((trx: any) => ({
              trxId: trx.id,
              trxRef: trx.id?.toString() || '—',
              trxDescription: trx.type?.value || 'Loan Transaction',
              trxAmount: trx.amount || 0,
              transactionType: trx.type?.disbursement ? 'DISBURSEMENT' : 'REPAYMENT',
              accountType: 'LOAN',
              accountId: loan.accountNo,
              accountName: loan.productName || loan.shortProductName,
              createdAt: trx.date || trx.submittedOnDate,
              trxStatus: trx.reversed ? 'REVERSED' : 'COMPLETED',
              currency: trx.currency?.displaySymbol || 'UGX'
            }));
          } catch (err) {
            console.error(`Error fetching loan transactions for loan ${loan.id}:`, err);
            return [];
          }
        });

        // Fetch transactions for each share account using associations
        const shareTransactionsPromises = shareAccounts.map(async (share: any) => {
          try {
            const shareResponse = await axios.get(
              api_urls.shareAccounts.get_share_account_with_transactions(share.id),
              { headers }
            );

            return (shareResponse.data.purchasedShares || []).map((trx: any) => ({
              trxId: trx.id,
              trxRef: trx.id?.toString() || '—',
              trxDescription: `Share ${trx.type?.value || 'Transaction'}`,
              trxAmount: trx.amount || (trx.numberOfShares * trx.purchasePrice) || 0,
              transactionType: trx.type?.purchased ? 'PURCHASE' : 'REDEEM',
              accountType: 'SHARES',
              accountId: share.accountNo,
              accountName: share.productName || share.shortProductName,
              createdAt: trx.purchasedDate || trx.submittedDate,
              trxStatus: trx.status?.value || 'COMPLETED',
              currency: share.currency?.displaySymbol || 'UGX'
            }));
          } catch (err) {
            console.error(`Error fetching share transactions for account ${share.id}:`, err);
            return [];
          }
        });

        // Wait for all transactions to be fetched
        const savingsTransactionsArrays = await Promise.all(savingsTransactionsPromises);
        const loanTransactionsArrays = await Promise.all(loanTransactionsPromises);
        const shareTransactionsArrays = await Promise.all(shareTransactionsPromises);

        const allTransactions = [
          ...savingsTransactionsArrays.flat(),
          ...loanTransactionsArrays.flat(),
          ...shareTransactionsArrays.flat()
        ];

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
        setErrorMessage(err.response?.data?.defaultUserMessage || 'Unable to load your transaction history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTransactions();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="pt-14 px-3 flex-1 bg-gray-50 pb-16">
        <h2 className="text-lg font-semibold text-gray-800 py-3">Transaction History</h2>

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
                    {trx?.accountType} - {trx?.accountName}
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

export default History;
