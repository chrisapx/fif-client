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
import LoanRequestForm from '../components/forms/LoanRequestForm';
// import { getAuthUser, getUserToken } from '../utilities/AuthCookieManager';
import { api_urls } from '../../utilities/api_urls';
import axios from 'axios';
import { getUserToken, isAuthenticated } from '../../utilities/AuthCookieManager';

// const user = getAuthUser();
// const token = getUserToken();

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [totalSavings, setTotalSavings] = useState<number>(0.0);
  const [totalLoans, setTotalLoans] = useState<number>(0.0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  console.log(errorMessage);

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

  const headers = {
    Authorization: `Bearer ${getUserToken()}`,
    'Content-Type': 'application/json',
  };


  useEffect(() => {
    if(!isAuthenticated()){
      navigate('/login');
    }
    const fetchAccountsAndLoans = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [accountsRes, loansRes] = await Promise.allSettled([
        axios.get<any[]>(api_urls.accounts.get_current_user_accounts, { headers }),
        axios.get<any[]>(api_urls.accounts.get_current_user_loans, { headers }),
      ]);

      if (accountsRes.status === 'fulfilled') {
        setAccounts(accountsRes.value.data);
        const total = accountsRes.value.data.reduce((acc: number, account: any) => acc + account.accBalance, 0);
        setTotalSavings(total);
      } else {
        setErrorMessage(prev => prev + ' Failed to load accounts.');
      }

      if (loansRes.status === 'fulfilled') {
        setLoans(loansRes.value.data);
        const total = loansRes.value.data.reduce((acc: number, loan: any) => acc + loan.amountUnPaid, 0);
        setTotalLoans(total);
      } else {
        setErrorMessage(prev => prev + ' Failed to load loans.');
      }

    } catch (err) {
      setErrorMessage('Unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  fetchAccountsAndLoans();
}, []);


  return (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden">
      <Header/>
      { isLoading && 
        <span className="relative block w-full h-1.5 bg-blue-100 overflow-hidden rounded-full">
          <span className="absolute top-0 left-0 h-1.5 w-48 bg-blue-600 animate-loaderSlide rounded-full"></span>
        </span>

      }
      <section className='overflow-y-auto mt-12 mb-12'>
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
                  <p className='text-sm'>{ln?.loanStatus?.replace("_"," ")}</p>
                  <p className='text-[10px] font-[200]'>
                    <span>Due on </span>
                    {(() => {
                      const dueDate = new Date(ln?.dateDispatched);
                      dueDate.setMonth(dueDate.getMonth() + ln.loanDuration);
                      const day = dueDate.getDate();
                      const month = dueDate.toLocaleString('en-US', { month: 'short' });
                      const year = dueDate.getFullYear();
                      const ordinal = 
                        day % 10 === 1 && day !== 11 ? 'st' :
                        day % 10 === 2 && day !== 12 ? 'nd' :
                        day % 10 === 3 && day !== 13 ? 'rd' : 'th';
                      return `${day}${ordinal} ${month}, ${year}`;
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
      <LoanRequestForm/>
    </div>
  );
};

export default Home;