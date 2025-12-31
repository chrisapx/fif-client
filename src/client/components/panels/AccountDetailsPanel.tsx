import { Sidebar } from 'primereact/sidebar'
import { useSearchParams } from 'react-router-dom'
import { searchParamsVariables } from '../../../utilities/UrlParamVariables';
import { decryptParams } from '../../../utilities/EncryptionHelper';
import { Logout05Icon } from 'hugeicons-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { api_urls } from '../../../utilities/api_urls';
import { getUserToken } from '../../../utilities/AuthCookieManager';

const AccountDetailsPanel = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const panelStatus = searchParams.get(searchParamsVariables.accountPanelOpen);
    const account: any = searchParams.get(searchParamsVariables.selectedAccount) !== null && decryptParams(searchParams.get(searchParamsVariables.selectedAccount));

    const [accountDetails, setAccountDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

    const handleHideAccountPanel = () => {
        searchParams.delete(searchParamsVariables.accountPanelOpen);
        searchParams.delete(searchParamsVariables.selectedAccount);
        setSearchParams(searchParams);
    }

    const formatDate = (date: number[]) => {
        if (!date || !Array.isArray(date)) return '--';
        const dateObj = new Date(date[0], date[1] - 1, date[2]);
        return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
    const token = getUserToken();

    const headers = {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json',
        'Fineract-Platform-TenantId': tenant,
    };

    useEffect(() => {
        const fetchAccountDetails = async () => {
            if (!account?.accountId || panelStatus !== '1') return;

            setIsLoading(true);
            try {
                const response = await axios.get(
                    api_urls.transactions.get_savings_with_transactions(account.accountId),
                    { headers }
                );

                setAccountDetails(response.data);
                // Get last 5 transactions
                setRecentTransactions((response.data.transactions || []).slice(0, 5));
            } catch (error) {
                console.error('Error fetching account details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccountDetails();
    }, [account?.accountId, panelStatus]);
  return (
    <div>
      <Sidebar 
        visible={panelStatus === '1'}
        onHide={handleHideAccountPanel}
        className='w-full'
        content={({ hide }) => (
            <section className='pb-16'>
              <div className='flex justify-between items-center px-2 py-3 bg-teal-500 text-white sticky top-0 z-10'>
                <i className='pi pi-times' onClick={hide}/>
                <p>Account Details</p>
                <Logout05Icon/>
              </div>

              {isLoading && (
                <div className="p-4 text-center text-gray-500">Loading account details...</div>
              )}

              {/* Basic Account Information */}
              <div className='px-2 py-3'>
                <p className='text-xs'>Product Name</p>
                <p className='text-sm font-semibold'>{account?.accName || accountDetails?.productName || "--"}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Account Number</p>
                <p className='text-sm font-mono'>{account?.accNumber || accountDetails?.accountNo || "--"}</p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Deposit Type</p>
                <p className='text-sm'>{account?.depositType || accountDetails?.depositType?.value || "Savings"}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Available Balance</p>
                <p className='text-sm text-green-500'>
                  <span className='text-[8px]'>{accountDetails?.currency?.displaySymbol || 'UGX'} </span>
                  {(account?.accBalance || accountDetails?.accountBalance || 0).toLocaleString()}
                </p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Account Status</p>
                <p className='text-sm underline font-bold'>
                  {account?.accStatus || accountDetails?.status?.value || "--"}
                </p>
              </div>

              {/* Interest Details */}
              {accountDetails?.nominalAnnualInterestRate && (
                <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                  <p className='text-xs'>Interest Rate</p>
                  <p className='text-sm'>{accountDetails.nominalAnnualInterestRate}% per annum</p>
                </div>
              )}

              {/* Timeline Details */}
              {accountDetails?.timeline && (
                <>
                  <div className='px-2 py-3'>
                    <p className='text-xs'>Submitted On</p>
                    <p className='text-sm'>{formatDate(accountDetails.timeline.submittedOnDate)}</p>
                  </div>
                  {accountDetails.timeline.activatedOnDate && (
                    <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                      <p className='text-xs'>Activated On</p>
                      <p className='text-sm'>{formatDate(accountDetails.timeline.activatedOnDate)}</p>
                    </div>
                  )}
                  {accountDetails.timeline.lastActiveTransactionDate && (
                    <div className='px-2 py-3'>
                      <p className='text-xs'>Last Transaction</p>
                      <p className='text-sm'>{formatDate(accountDetails.timeline.lastActiveTransactionDate)}</p>
                    </div>
                  )}
                </>
              )}

              {/* Sub Status */}
              {accountDetails?.subStatus && (
                <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                  <p className='text-xs'>Sub Status</p>
                  <p className='text-sm'>{accountDetails.subStatus.value || 'None'}</p>
                </div>
              )}

              {/* Recent Transactions */}
              {recentTransactions.length > 0 && (
                <div className='mt-4'>
                  <div className='px-2 py-3 bg-[#1a8ca5] text-white'>
                    <p className='font-semibold'>Recent Transactions (Last 5)</p>
                  </div>
                  {recentTransactions.map((trx: any, index: number) => (
                    <div key={index} className='px-2 py-3 border-b border-gray-100 flex justify-between items-center'>
                      <div>
                        <p className='text-sm font-medium'>
                          {trx.transactionType?.value || '—'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {formatDate(trx.date || trx.submittedOnDate)}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className={`text-sm font-semibold ${trx.transactionType?.deposit ? 'text-green-600' : 'text-red-600'}`}>
                          {trx.transactionType?.deposit ? '+' : '-'}
                          {accountDetails?.currency?.displaySymbol || 'UGX'} {(trx.amount || 0).toLocaleString()}
                        </p>
                        {trx.reversed && (
                          <p className='text-xs text-orange-600'>Reversed</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
        )}
      />
    </div>
  )
}

export default AccountDetailsPanel
