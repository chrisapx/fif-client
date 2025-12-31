import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileDollarIcon, InformationCircleIcon, MoneySavingJarIcon } from 'hugeicons-react';
import BottomNavigationTabs from '../components/BottomNavigationTabs';
import Header from '../components/Header';
import { FaAngleRight } from 'react-icons/fa';
import AccountDetailsPanel from '../components/panels/AccountDetailsPanel';
import { searchParamsVariables } from '../../utilities/UrlParamVariables';
import { encryptParams } from '../../utilities/EncryptionHelper';
import LoanDetailsPanel from '../components/panels/LoanDetailsPanel';
import { api_urls } from '../../utilities/api_urls';
import axios from 'axios';
import { getUserToken, isAuthenticated, getAuthUser } from '../../utilities/AuthCookieManager';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [totalSavings, setTotalSavings] = useState<number>(0.0);
  const [totalLoans, setTotalLoans] = useState<number>(0.0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  console.log('Error:', errorMessage);

  const handleAccountPanelClick = ( selectedAcc: any) => {
    searchParams.set(searchParamsVariables.accountPanelOpen, '1');
    searchParams.set(searchParamsVariables.selectedAccount, encryptParams(selectedAcc));
    setSearchParams(searchParams);
  }

  const handleLoanPanelClick = ( selectedLn: any) => {
    searchParams.set(searchParamsVariables.loanDetailsPanelOpen, '1');
    searchParams.set(searchParamsVariables.selectedLoan, encryptParams(selectedLn));
    setSearchParams(searchParams);
  }

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };


  useEffect(() => {
    // Check authentication first
    if(!isAuthenticated()){
      navigate('/login');
      return; // Stop execution if not authenticated
    }

    const fetchAccountsAndLoans = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        // Get user data using the helper function
        const user = getAuthUser();
        const clientId = user?.userId;

        console.log('Fetching accounts for client:', clientId);

        // Debug: Check if clientId exists
        if (!clientId) {
          console.error('Client ID not found in user data');
          setIsLoading(false);
          return;
        }

        console.log('API URL:', api_urls.clients.get_client_accounts(clientId));
        console.log('Headers:', headers);

        // Fineract returns both savings and loan accounts in one call
        const response = await axios.get(
          api_urls.clients.get_client_accounts(clientId),
          { headers }
        );

        console.log('Accounts response:', response.data);

        const accountsData = response.data || {};

      // Helper function to convert array date to Date object
      const convertArrayToDate = (dateArray: number[]) => {
        if (!dateArray || !Array.isArray(dateArray)) return null;
        return new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
      };

      // Extract savings accounts
      if (accountsData.savingsAccounts) {
        // Filter out closed, withdrawn, and rejected savings accounts
        const activeSavingsAccounts = accountsData.savingsAccounts.filter((acc: any) => {
          const status = acc.status?.value?.toLowerCase() || '';
          const statusCode = acc.status?.code?.toLowerCase() || '';
          const excludedStatuses = ['withdrawn', 'rejected', 'closed'];
          return !excludedStatuses.some(excluded => status.includes(excluded) || statusCode.includes(excluded));
        });

        const savingsAccounts = activeSavingsAccounts.map((acc: any) => ({
          accountId: acc.id,
          accNumber: acc.accountNo,
          accName: acc.productName || acc.shortProductName,
          accBalance: acc.accountBalance || 0,
          accStatus: acc.status?.value || 'Unknown',
          currency: acc.currency?.displaySymbol || 'UGX',
          productId: acc.productId,
          depositType: acc.depositType?.value || 'Savings'
        }));

        setAccounts(savingsAccounts);
        const total = savingsAccounts.reduce((acc: number, account: any) => acc + account.accBalance, 0);
        setTotalSavings(total);
      } else {
        setAccounts([]);
        setTotalSavings(0);
      }

      // Extract loan accounts
      if (accountsData.loanAccounts) {
        // Filter out withdrawn, rejected, and closed loans
        const activeLoanAccounts = accountsData.loanAccounts.filter((loan: any) => {
          const status = loan.status?.value?.toLowerCase() || '';
          const statusCode = loan.status?.code?.toLowerCase() || '';
          const excludedStatuses = ['withdrawn', 'rejected', 'closed', 'overpaid', 'writeoff', 'written'];
          return !excludedStatuses.some(excluded => status.includes(excluded) || statusCode.includes(excluded));
        });

        const loanAccounts = activeLoanAccounts.map((loan: any) => {
          const disbursementDate = convertArrayToDate(loan.timeline?.actualDisbursementDate);
          const maturityDate = convertArrayToDate(loan.timeline?.actualMaturityDate || loan.timeline?.expectedMaturityDate);

          // Calculate amount paid (original - balance)
          const originalAmount = loan.originalLoan || 0;
          const balanceAmount = loan.loanBalance || 0;
          const paidAmount = originalAmount > balanceAmount ? originalAmount - balanceAmount : 0;

          // Calculate duration in months
          let durationMonths = 0;
          if (disbursementDate && maturityDate) {
            const diffTime = maturityDate.getTime() - disbursementDate.getTime();
            durationMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
          }

          return {
            loanId: loan.id,
            accountNo: loan.accountNo,
            // Show custom account name if present, otherwise show product name
            loanName: loan.externalId || loan.accountNo || loan.productName || loan.shortProductName,
            loanStatus: loan.status?.value || 'Unknown',
            amountPaid: paidAmount,
            amountUnPaid: balanceAmount,
            totalAmount: originalAmount,
            interestRate: 0,
            loanDuration: durationMonths || 4,
            dateDispatched: disbursementDate?.toISOString() || null,
            maturityDate: maturityDate?.toISOString() || null,
            currency: loan.currency?.displaySymbol || 'UGX',
            inArrears: loan.inArrears || false
          };
        });

        setLoans(loanAccounts);
        const total = loanAccounts.reduce((acc: number, loan: any) => acc + loan.amountUnPaid, 0);
        setTotalLoans(total);
      } else {
        setLoans([]);
        setTotalLoans(0);
      }

      } catch (err: any) {
        console.error('Error fetching accounts:', err);
        console.error('Error response:', err.response);
        setErrorMessage(err.response?.data?.defaultUserMessage || err.message || 'Failed to load accounts and loans.');
      } finally {
        setIsLoading(false);
      }
    };

    // Call the fetch function
    fetchAccountsAndLoans();
  }, [navigate]); // Add navigate to dependencies


  return (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden">
      <Header/>
      { isLoading && 
        <span className="relative block w-full h-1.5 bg-teal-100 overflow-hidden rounded-full">
          <span className="absolute top-0 left-0 h-1.5 w-48 bg-[#1a8ca5] animate-loaderSlide rounded-full"></span>
        </span>

      }
      <section className='overflow-y-auto mt-12 mb-12'>
        {errorMessage && (
          <div className="mx-2 my-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <div className='flex justify-between items-center px-2 py-4 bg-[#012951]'>
          <p className='text-sm text-white flex gap-2 items-center'>
            I Have
            <span className='opacity-50'>
              <InformationCircleIcon size={16}/>
            </span>
          </p>
          <p className='text-sm text-white'>
            <span className='text-[8px]'>UGX</span> {totalSavings.toLocaleString()}
          </p>
        </div>

        <div className=''>
          {accounts.length === 0 && !isLoading && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No savings accounts found. Create one to get started!
            </div>
          )}
          { accounts.map((acc, ix) => (
            <article key={ix} className='px-2 py-3 flex justify-between items-center border-b border-gray-100 select-none' onClick={() => handleAccountPanelClick(acc)}>
              <div className='flex gap-2 items-center'>
                <MoneySavingJarIcon size={30}/>
                <article>
                  <p className='text-[10px] font-semibold text-gray-500'>{acc.accName}</p>
                  <p className='text-[10px] font-[200]'>{acc.accNumber}</p>
                </article>
              </div>
              <div>
                <p className='text-sm flex itemc-center gap-1'>
                  <span className='text-[8px] text-green-500'>UGX</span> 
                  <span className='font-semibold text-green-500'>{(acc.accBalance).toLocaleString()}</span>
                  <span className='text-gray-500'><FaAngleRight size={16}/></span>
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className='flex justify-between items-center px-2 py-4 bg-[#012951]'>
          <p className='text-sm text-white flex gap-2 itemc-center'>I Owe [Loans] 
            <span className='opacity-50'> 
              <InformationCircleIcon size={16}/>
            </span>
          </p>
          <p className='text-sm text-white'><span className='text-[8px]'>UGX</span> {(totalLoans).toLocaleString()}</p>
        </div>

        <div className=''>
          {loans.length === 0 && !isLoading && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No loans found.
            </div>
          )}
          { loans.map((ln, ix) => (
            <article key={ix} className='px-2 py-3 flex justify-between items-center border-b border-gray-100 select-none' onClick={() => handleLoanPanelClick(ln)}>
              <div className='flex gap-2 items-center'>
                <FileDollarIcon size={30}/>
                <article>
                  <p className='text-[10px] font-semibold text-gray-500'>{ln?.loanName}</p>
                  <p className='text-sm flex itemc-center gap-1'>
                    <span className='text-[8px] text-red-500'>UGX</span> 
                    <span className='font-semibold text-red-500'>{(ln?.amountUnPaid).toLocaleString()}</span>
                  </p>
                </article>
              </div>
              <div className='flex items-center gap-3'>
                <div className='border border-gray-200 rounded px-3 py-1'>
                  {/* Show "Pending" for pending approval status */}
                  {ln?.loanStatus?.toLowerCase().includes('pending') ||
                   ln?.loanStatus?.toLowerCase().includes('submitted') ? (
                    <p className='text-sm font-semibold text-orange-600'>Pending</p>
                  ) : (
                    <p className='text-sm'>{ln?.loanStatus?.replace("_"," ")}</p>
                  )}
                  <p className='text-[10px] font-[200]'>
                    {ln?.maturityDate && (() => {
                      const dueDate = new Date(ln.maturityDate);
                      const day = dueDate.getDate();
                      const month = dueDate.toLocaleString('en-US', { month: 'short' });
                      const year = dueDate.getFullYear();
                      const ordinal =
                        day % 10 === 1 && day !== 11 ? 'st' :
                        day % 10 === 2 && day !== 12 ? 'nd' :
                        day % 10 === 3 && day !== 13 ? 'rd' : 'th';
                      return `Due: ${day}${ordinal} ${month}, ${year}`;
                    })()}
                  </p>
                </div>
                <span className='text-gray-500'><FaAngleRight size={16}/></span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BottomNavigationTabs/>
      <AccountDetailsPanel/>
      <LoanDetailsPanel/>
    </div>
  );
};

export default Home;