import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileDollarIcon, InformationCircleIcon, MoneySavingJarIcon } from 'hugeicons-react';
import BottomNavigationTabs from '../components/BottomNavigationTabs';
import Header from '../components/Header';
import { FaAngleRight } from 'react-icons/fa';
import AccountDetailsPanel from '../components/panels/AccountDetailsPanel';
import { searchParamsVariables } from '../utilities/UrlParamVariables';
import { encryptParams } from '../utilities/EncryptionHelper';
import LoanDetailsPanel from '../components/panels/LoanDetailsPanel';
import LoanRequestForm from '../components/forms/LoanRequestForm';
import { getAuthUser, getUserToken } from '../utilities/AuthCookieManager';

const user = getAuthUser();
const token = getUserToken();

// const loans = [
//   {
//     loanName: "Emergency Loan for School",
//     loanAmount: 340000,
//     loanRate: 0.08,
//     accGroup: "Family Investment Fund",
//     amoundPaid: 0,
//     amountUnPaid: 340000,
//     loanStatus: "APPROVED",   // PENDING_APPROVAL, APPROVED, DENIED, DISPATCHED, FULLY_UNPAID, PARTIALLY_PAID, PAID, OUTSTANDING 
//     loanDuration: 4,
//     requestedBy: "Chris",
//     owner: "Chrisapx",
//     dateDispatched: new Date(2025, 3, 20),
//     settlementAccountNumber: "0758085749",
//     settlementAccountName: "MWESIGWA CHRISTOPHER",
//     createdAt: new Date(2025, 3, 18),
//     updatedAt: new Date(2025, 3, 30),
//     approvals: [
//       { name: "", createdAt: new Date(2025, 3, 1) },
//       { name: "", createdAt: new Date(2025, 3, 7) },
//     ],
//     signatories: [
//       { name: "", createdAt: new Date(2025, 3, 1) }
//     ]
//   },
//   {
//     loanName: "Salary Advance Loan",
//     loanAmount: 2000000,
//     loanRate: 0.025,
//     accGroup: "Family Investment Fund",
//     amoundPaid: 1200000,
//     amountUnPaid: 800000,
//     loanStatus: "PARTIALLY_PAID",   // PENDING_APPROVAL, APPROVED, DENIED, DISPATCHED, FULLY_UNPAID, PARTIALLY_PAID, PAID, OUTSTANDING 
//     loanDuration: 6,
//     dateDispatched: new Date(2025, 3, 20),
//     createdAt: new Date(2025, 3, 18),
//     updatedAt: new Date(2025, 3, 30)
//   }
// ]

const Home: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [totalSavings, setToatlSavings] = useState<number>(0.0);
  const [totalLoans, setTotalLoans] = useState<number>(0.0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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

  return (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden">
      <Header/>

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