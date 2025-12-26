import { Sidebar } from 'primereact/sidebar';
import { useSearchParams } from 'react-router-dom';
import { searchParamsVariables } from '../../../utilities/UrlParamVariables';
import { decryptParams } from '../../../utilities/EncryptionHelper';
import { Logout05Icon } from 'hugeicons-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { api_urls } from '../../../utilities/api_urls';
import { getUserToken } from '../../../utilities/AuthCookieManager';

const LoanDetailsPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const panelStatus = searchParams.get(searchParamsVariables.loanDetailsPanelOpen);
  const loan: any = searchParams.get(searchParamsVariables.selectedLoan) !== null && decryptParams(searchParams.get(searchParamsVariables.selectedLoan));

  const [loanDetails, setLoanDetails] = useState<any>(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleHideLoanPanel = () => {
    searchParams.delete(searchParamsVariables.loanDetailsPanelOpen);
    searchParams.delete(searchParamsVariables.selectedLoan);
    setSearchParams(searchParams);
  };

  const handleOpenLoanRequestForm = () => {
    handleHideLoanPanel();
    searchParams.set(searchParamsVariables.loanRequestPanelOpen, '1');
    setSearchParams(searchParams);
  };

  const formatDueDate = (dateDispatched: Date, loanDuration: number) => {
    const dueDate = new Date(dateDispatched);
    dueDate.setMonth(dueDate.getMonth() + loanDuration);
    const day = dueDate.getDate();
    const month = dueDate.toLocaleString('en-US', { month: 'short' });
    const year = dueDate.getFullYear();
    const ordinal =
      day % 10 === 1 && day !== 11 ? 'st' :
      day % 10 === 2 && day !== 12 ? 'nd' :
      day % 10 === 3 && day !== 13 ? 'rd' : 'th';
    return `${day}${ordinal} ${month}, ${year}`;
  };

  const formatDate = (date: Date | number[]) => {
    if (!date) return '--';

    // Handle array format [2025, 12, 26]
    if (Array.isArray(date)) {
      const dateObj = new Date(date[0], date[1] - 1, date[2]);
      return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };

  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (!loan?.loanId || panelStatus !== '1') return;

      setIsLoading(true);
      try {
        const response = await axios.get(
          api_urls.loans.get_loan_with_details(loan.loanId),
          { headers }
        );

        setLoanDetails(response.data);
        setRepaymentSchedule(response.data.repaymentSchedule?.periods || []);
        setRecentTransactions((response.data.transactions || []).slice(0, 5));
      } catch (error) {
        console.error('Error fetching loan details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoanDetails();
  }, [loan?.loanId, panelStatus]);

  return (
    <div>
      <Sidebar
        visible={panelStatus === '1'}
        onHide={handleHideLoanPanel}
        className='w-full'
        content={({ hide }) => (
          <section className='overflow-y-auto'>
            <div className='fixed w-full top-0 right-0 left-0 flex justify-between items-center px-2 py-3 bg-blue-500 text-white'>
              <i className='pi pi-times' onClick={hide} />
              <p>Loan Details</p>
              <Logout05Icon />
            </div>

            <section className='mt-12 mb-16'>
              {isLoading && (
                <div className="p-4 text-center text-gray-500">Loading loan details...</div>
              )}

              {/* Basic Loan Information */}
              <div className='px-2 py-3'>
                <p className='text-xs'>Loan Name</p>
                <p className='text-sm'>{loan?.loanName || loanDetails?.loanProductName || '--'}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Account Number</p>
                <p className='text-sm font-mono'>{loan?.accountNo || loanDetails?.accountNo || '--'}</p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Loan Amount (Principal)</p>
                <p className='text-sm'>
                  <span className='text-[8px]'>{loanDetails?.currency?.displaySymbol || 'UGX'} </span>
                  {(loan?.totalAmount || loanDetails?.originalLoan || 0).toLocaleString()}
                </p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Interest Rate</p>
                <p className='text-sm'>
                  {loanDetails?.interestRatePerPeriod
                    ? `${loanDetails.interestRatePerPeriod}% ${loanDetails?.interestRateFrequencyType?.value || 'per month'}`
                    : '--'}
                </p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Amount Paid</p>
                <p className='text-sm text-green-500'>
                  <span className='text-[8px]'>{loanDetails?.currency?.displaySymbol || 'UGX'} </span>
                  {(loan?.amountPaid || 0).toLocaleString()}
                </p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Outstanding Balance</p>
                <p className='text-sm text-red-500'>
                  <span className='text-[8px]'>{loanDetails?.currency?.displaySymbol || 'UGX'} </span>
                  {(loan?.amountUnPaid || loanDetails?.loanBalance || 0).toLocaleString()}
                </p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Loan Status</p>
                <p className='text-sm underline font-bold'>
                  {loan?.loanStatus?.replace("_", " ") || loanDetails?.status?.value || '--'}
                </p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Disbursed On</p>
                <p className='text-sm'>
                  {formatDate(loanDetails?.timeline?.actualDisbursementDate || loan?.dateDispatched)}
                </p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Maturity Date</p>
                <p className='text-sm'>
                  {formatDate(loanDetails?.timeline?.actualMaturityDate || loanDetails?.timeline?.expectedMaturityDate || loan?.maturityDate)}
                </p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Number of Repayments</p>
                <p className='text-sm'>
                  {loanDetails?.numberOfRepayments || loanDetails?.termFrequency || '--'}
                </p>
              </div>
              {loanDetails?.inArrears && (
                <div className='px-2 py-3 bg-red-50 border border-red-200'>
                  <p className='text-xs text-red-600'>⚠️ Loan in Arrears</p>
                  <p className='text-sm text-red-700 font-semibold'>Please contact support</p>
                </div>
              )}

              {/* Recent Transactions */}
              {recentTransactions.length > 0 && (
                <div className='mt-4'>
                  <div className='px-2 py-3 bg-blue-600 text-white'>
                    <p className='font-semibold'>Recent Transactions (Last 5)</p>
                  </div>
                  {recentTransactions.map((trx: any, index: number) => (
                    <div key={index} className='px-2 py-3 border-b border-gray-100 flex justify-between items-center'>
                      <div>
                        <p className='text-sm font-medium'>
                          {trx.type?.value || '—'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {formatDate(trx.date || trx.submittedOnDate)}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className={`text-sm font-semibold ${trx.type?.disbursement ? 'text-blue-600' : 'text-green-600'}`}>
                          {loanDetails?.currency?.displaySymbol || 'UGX'} {(trx.amount || 0).toLocaleString()}
                        </p>
                        {trx.reversed && (
                          <p className='text-xs text-orange-600'>Reversed</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Repayment Schedule */}
              {repaymentSchedule.length > 0 && (
                <div className='mt-6'>
                  <div className='px-2 py-3 bg-blue-600 text-white'>
                    <p className='font-semibold'>Repayment Schedule</p>
                  </div>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-xs'>
                      <thead className='bg-gray-100'>
                        <tr>
                          <th className='px-2 py-2 text-left'>Period</th>
                          <th className='px-2 py-2 text-left'>Due Date</th>
                          <th className='px-2 py-2 text-right'>Principal</th>
                          <th className='px-2 py-2 text-right'>Interest</th>
                          <th className='px-2 py-2 text-right'>Total</th>
                          <th className='px-2 py-2 text-center'>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repaymentSchedule
                          .filter((period: any) => period.period > 0) // Skip period 0 (disbursement)
                          .map((period: any, index: number) => (
                          <tr key={index} className='border-b border-gray-200'>
                            <td className='px-2 py-2'>{period.period}</td>
                            <td className='px-2 py-2'>{formatDate(period.dueDate)}</td>
                            <td className='px-2 py-2 text-right'>
                              {(period.principalDue || 0).toLocaleString()}
                            </td>
                            <td className='px-2 py-2 text-right'>
                              {(period.interestDue || 0).toLocaleString()}
                            </td>
                            <td className='px-2 py-2 text-right font-semibold'>
                              {(period.totalDueForPeriod || 0).toLocaleString()}
                            </td>
                            <td className='px-2 py-2 text-center'>
                              {period.complete ? (
                                <span className='text-green-600 text-xs'>✓ Paid</span>
                              ) : (
                                <span className='text-orange-600 text-xs'>Pending</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
            {/* Temporarily disabled - will be enabled later */}
            {/* <div onClick={handleOpenLoanRequestForm} className='border-t border-gray-200 px-2 py-3 fixed bottom-0 left-0 right-0 w-full pb-4 bg-white'>
              <button className='text-[#115DA9] border-2 border-[#115DA9] px-4 py-2 rounded w-full'>+ Request New Loan</button>
            </div> */}
          </section>
        )}
      />
    </div>
  );
};

export default LoanDetailsPanel;