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
  const [isApprovalLoading, setIsApprovalLoading] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

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

  const headers = {
    Authorization: `Bearer ${getUserToken()}`,
    'Content-Type': 'application/json',
    };


  const fetchTransactions = async () => {
    setAllTransactions([]);
    setIsLoading(true);
    setErrorMessage('');
    axios.get<any[]>(api_urls.transactions.get_all_transactions, {
        params: {
          page: 0,
          size: 20,
          status: statusFilter || undefined,
        }, headers
    }).then(resp => {
        setAllTransactions(resp.data);
    }).catch(res => {
        setErrorMessage(res.data);
    }).finally(() => {
        setIsLoading(false);
    });
  };

  const handleApprove = async (trxId: string) => {
    setIsApprovalLoading(trxId);
    setMessage('');
    setErrorMessage('');
    axios.patch<any>(api_urls.transactions.approve_transaction(trxId), { headers },
        { params: { command: 1 }}
    ).then(resp => {
        setMessage(resp.data);
    }).catch(res => {
        setErrorMessage(res.data);
    }).finally(() => {
        setIsApprovalLoading('');
    });
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
              statusFilter === tb.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tb.name}
          </button>
        ))}
      </div>

      {/* New Transaction Button */}
      <button onClick={handleCreateNew} className="m-3 p-2 flex items-center gap-2 bg-blue-500 text-white rounded-md">
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
