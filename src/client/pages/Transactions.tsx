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

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

   const headers = {
      Authorization: `Bearer ${getUserToken()}`,
      'Content-Type': 'application/json',
    };

  useEffect(() => {
    const fetchUserTransactions = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await axios.get<any[]>(
          api_urls.transactions.get_current_user_transactions(getAuthUser()?.userId),
          { headers }
        );
        setAllTransactions(response.data);
      } catch (err) {
        setErrorMessage('Unable to load your transactions.');
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
                  <p className="text-sm font-medium text-gray-800">{trx?.trxRef || '—'}</p>
                  <p className="text-xs text-gray-500">{trx?.trxDescription || '—'}</p>
                  <p className="text-[11px] text-gray-400">{formatDate(trx?.createdAt)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${color}`}>
                  {trx?.trxAmount ? `UGX ${Number(trx.trxAmount).toLocaleString()}` : '—'}
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
