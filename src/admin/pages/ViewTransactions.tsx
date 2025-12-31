import { useEffect, useState } from 'react';
import axios from 'axios';
import { BsArrowDownCircle, BsArrowUpCircle } from 'react-icons/bs';
import { FiRefreshCcw } from 'react-icons/fi';
import { api_urls } from '../../utilities/api_urls';
import Header from '../../client/components/Header';
import BottomNavigationTabs from '../../client/components/BottomNavigationTabs';
import { PlusSignIcon } from 'hugeicons-react';
import { useSearchParams } from 'react-router-dom';
import { searchParamsVariables } from '../../utilities/UrlParamVariables';
import { getUserToken } from '../../utilities/AuthCookieManager';

const ViewTransactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isApprovalLoading, setIsApprovalLoading] = useState<string>('');

  const getIconAndColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
      case 'credit':
        return { icon: <BsArrowDownCircle className="text-green-500" size={20} />, color: 'text-green-600' };
      case 'withdraw':
      case 'debit':
        return { icon: <BsArrowUpCircle className="text-red-500" size={20} />, color: 'text-red-600' };
      case 'transfer':
        return { icon: <FiRefreshCcw className="text-[#1a8ca5]" size={20} />, color: 'text-[#1a8ca5]' };
      default:
        return { icon: <FiRefreshCcw className="text-gray-400" size={20} />, color: 'text-gray-600' };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };


  const fetchTransactions = async () => {
    setAllTransactions([]);
    setIsLoading(true);
    setErrorMessage('');

    try {
      // In Fineract, we need to fetch all clients first, then their transactions
      // For admin view, we'll get all clients and aggregate their transactions
      const clientsResponse = await axios.get(api_urls.clients.get_clients, { headers });
      const clients = clientsResponse.data.pageItems || clientsResponse.data;

      const allTransactionsPromises = clients.map(async (client: any) => {
        try {
          const accountsResponse = await axios.get(
            api_urls.clients.get_client_accounts(client.id),
            { headers }
          );

          const savingsAccounts = accountsResponse.data.savingsAccounts || [];

          // Fetch transactions for each savings account
          const transactionsPromises = savingsAccounts.map(async (account: any) => {
            try {
              const txnResponse = await axios.get(
                api_urls.transactions.get_transactions(account.id),
                { headers }
              );

              return (txnResponse.data.transactions || []).map((trx: any) => ({
                trxId: trx.id,
                trxRef: trx.id?.toString() || '—',
                trxDescription: trx.note || trx.transactionType?.value || '—',
                trxAmount: trx.amount || 0,
                transactionType: trx.transactionType?.deposit ? 'DEPOSIT' : 'WITHDRAW',
                accountId: account.accountNo,
                clientName: client.displayName || client.firstname,
                createdAt: trx.date || trx.submittedOnDate,
                status: trx.reversed ? 'REVERSED' : 'COMPLETED', // Fineract doesn't have pending status for posted transactions
                currency: trx.currency?.displaySymbol || 'UGX'
              }));
            } catch (err) {
              return [];
            }
          });

          const clientTransactions = await Promise.all(transactionsPromises);
          return clientTransactions.flat();
        } catch (err) {
          return [];
        }
      });

      const transactionsArrays = await Promise.all(allTransactionsPromises);
      let allTransactions = transactionsArrays.flat();

      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply status filter
      if (statusFilter) {
        allTransactions = allTransactions.filter(trx => trx.status === statusFilter);
      }

      setAllTransactions(allTransactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setErrorMessage(error.response?.data?.defaultUserMessage || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (trxId: string) => {
    // Note: In Fineract, savings transactions are posted immediately
    // This function is kept for compatibility but won't do anything in standard Fineract
    setIsApprovalLoading(trxId);
    setMessage('Transactions in Fineract are posted immediately and do not require approval.');
    setTimeout(() => {
      setMessage('');
      setIsApprovalLoading('');
    }, 3000);
  };

  const tabs = [
    { name: 'All', value: null },
    { name: 'Completed', value: 'COMPLETED' },
    { name: 'Pending', value: 'PENDING' },
    { name: 'Rejected', value: 'REJECTED' },
  ];

  const handleCreateNew = () => {
    searchParams.set(searchParamsVariables.newAdminTransactionPanelOpen, '1');
    setSearchParams(searchParams);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Tabs */}
      <div className="pt-18 px-3 flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tb, i) => (
          <button
            key={i}
            onClick={() => setStatusFilter(tb.value)}
            className={`px-3 py-1 text-sm rounded-md ${
              statusFilter === tb.value ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tb.name}
          </button>
        ))}
      </div>

      {/* New Transaction Button */}
      <button onClick={handleCreateNew} className="m-3 p-2 flex items-center gap-2 bg-teal-500 text-white rounded-md">
        <PlusSignIcon className="text-sm" />
        <p>New Transaction</p>
      </button>

      {message && <p className="px-3 py-1 text-white bg-green-500">{message}</p>}

      {/* Transaction List */}
      <div className="pt-5 px-3 flex-1 bg-gray-50">
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
                  <p className="text-sm font-medium text-gray-800">{trx?.trxRef || '—'}</p>
                  <div className={`text-sm font-semibold ${color}`}>
                    {trx?.trxAmount ? `UGX ${Number(trx.trxAmount).toLocaleString()}` : '—'}
                  </div>
                  <p className="text-xs text-gray-500 pt-4">A/C {trx?.accountId || '—'}</p>
                </div>
              </div>
              <div className="text-right">
                {trx.status === 'PENDING' && (
                  <button
                    onClick={() => handleApprove(trx.trxId)}
                    disabled={isApprovalLoading === trx.trxId}
                    className={`px-4 py-1 text-white rounded-md mb-2 ${
                      isApprovalLoading === trx.trxId ? 'bg-gray-400' : 'bg-green-600'
                    }`}
                  >
                    {isApprovalLoading === trx.trxId ? 'Approving...' : 'Approve'}
                  </button>
                )}
                <p className="text-[11px] text-gray-400">{formatDate(trx?.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default ViewTransactions;
