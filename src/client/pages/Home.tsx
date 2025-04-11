import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InformationCircleIcon, MoneySavingJarIcon } from 'hugeicons-react';
import BottomNavigationTabs from '../components/BottomNavigationTabs';
import Header from '../components/Header';
import { FaAngleRight } from 'react-icons/fa';
import AccountDetailsPanel from '../components/panels/AccountDetailsPanel';
import { searchParamsVariables } from '../utilities/UrlParamVariables';
import { encryptParams } from '../utilities/EncryptionHelper';

const user = {
  username: "Chrisapx",
  passCode: "hja989jij98jnsjnk988ijs09j0a0j0j09ms0s",
  accounts: [
    { accNumber: "0328992012332", accBalance: 2883222.98, accName: "MWESIGWA CHRISTOPHER", createdAt: new Date() },
    { accNumber: "0328992929983", accBalance: 2313.98, accName: "MWESIGWA CHRISTOPHER", createdAt: new Date() }
  ]
}

const Home: React.FC = () => {
  // const [accounts, setAccounts] = useState<any[]>([]);
  // const [loans, setLoans] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  console.log(errorMessage);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          setErrorMessage('Not authenticated. Please log in.');
        //   navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:8091/users/balance', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-API-Key': '',
            'X-Client-Key': 'native',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch balance');
        }

        // const data = await response.json();
      } catch (error) {
        console.error('Error fetching balance:', error);
        setErrorMessage('Failed to load balance. Please try again.');
      }
    };

    fetchBalance();
  }, [navigate]);

  const handleAccountPanelClick = ( selectedAcc: any) => {
    searchParams.set(searchParamsVariables.accountPanelOpen, '1');
    searchParams.set(searchParamsVariables.selectedAccount, encryptParams(selectedAcc));
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
            <span className='text-[8px]'>UGX</span> {(2399933.00).toLocaleString()}
          </p>
        </div>

        <div className=''>
          { user.accounts.map((acc, ix) => (
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
          <p className='text-sm text-white'><span className='text-[8px]'>UGX</span> {(0.00).toLocaleString()}</p>
        </div>
      </section>

      <BottomNavigationTabs/>
      <AccountDetailsPanel/>
    </div>
  );
};

export default Home;