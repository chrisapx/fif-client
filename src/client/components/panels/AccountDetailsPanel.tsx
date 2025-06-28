import { Sidebar } from 'primereact/sidebar'
import { useSearchParams } from 'react-router-dom'
import { searchParamsVariables } from '../../utilities/UrlParamVariables';
import { decryptParams } from '../../utilities/EncryptionHelper';
import { Logout05Icon } from 'hugeicons-react';

const AccountDetailsPanel = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const panelStatus = searchParams.get(searchParamsVariables.accountPanelOpen);
    const account: any = searchParams.get(searchParamsVariables.selectedAccount) !== null && decryptParams(searchParams.get(searchParamsVariables.selectedAccount));
    
    const handleHideAccountPanel = () => {
        searchParams.delete(searchParamsVariables.accountPanelOpen);
        searchParams.delete(searchParamsVariables.selectedAccount);
        setSearchParams(searchParams);
    }
  return (
    <div>
      <Sidebar 
        visible={panelStatus === '1'}
        onHide={handleHideAccountPanel}
        className='w-full'
        content={({ hide }) => (
            <section>
              <div className='flex justify-between items-center px-2 py-3 bg-blue-500 text-white'>
                <i className='pi pi-times' onClick={hide}/>
                <p>Account Details</p>
                <Logout05Icon/>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Account Name</p>
                <p className='text-sm'>{account?.accName || "--"}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Account Number</p>
                <p className='text-sm'>{account?.accNumber || "--"}</p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Account Group [SACCO]</p>
                <p className='text-sm'>{account?.accGroup || "FIFund"}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Available Balance</p>
                <p className='text-sm text-green-500'><span className='text-[8px]'>UGX </span>{account?.accBalance?.toLocaleString() || "--"}</p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Account Type</p>
                <p className='text-sm'>{account?.accType?.replace("_"," ") || "--"}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Commitment Amount</p>
                <p className='text-sm text-gray-500'><span className='text-[8px]'>UGX </span>{account?.commitmentAmount?.toLocaleString() + " /month" || "--"}</p>
              </div>
            </section>
        )}
      />
    </div>
  )
}

export default AccountDetailsPanel
