import BottomNavigationTabs from '../components/BottomNavigationTabs'
import { WalletAdd02Icon } from 'hugeicons-react'
import Header from '../components/Header'
import { useSearchParams } from 'react-router-dom'
import { searchParamsVariables } from '../../utilities/UrlParamVariables'

const FundMyAccount = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const handleFundWithCash = () => {
        searchParams.set(searchParamsVariables.newTransactionPanelOpen, '1');
        setSearchParams(searchParams);
      }
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className='pt-10'>
        <div className='flex justify-center pt-[5vh]'>
            <WalletAdd02Icon className='text-blue-400 w-20 h-20' />
        </div>

        <p className='text-center pt-5 text-gray-600 text-lg'>How to Fund My Account</p>

        <div className='py-12 px-5'>
            <p className='text-blue-300 py-5 px-3 font-medium border-y border-gray-200' onClick={handleFundWithCash}>Cash Deposit</p>
            <p className='text-blue-300 py-5 px-3 font-medium border-b border-gray-200'>Transfer From Another Account</p>
        </div>

      </div>
      <BottomNavigationTabs/>
    </div>
  )
}

export default FundMyAccount