import { Sidebar } from 'primereact/sidebar'
import { useSearchParams } from 'react-router-dom'
import { searchParamsVariables } from '../../utilities/UrlParamVariables';
import { decryptParams } from '../../utilities/EncryptionHelper';

const AccountDetailsPanel = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const panelStatus = searchParams.get(searchParamsVariables.accountPanelOpen);
    const account: any = decryptParams(searchParams.get(searchParamsVariables.selectedAccount));
    
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
        content={({ hide }) => (
            <section>
                
                <i className='pi pi-times' onClick={hide}/>
                Account panel open
                {account?.accNumber}
            </section>
        )}
      />
    </div>
  )
}

export default AccountDetailsPanel
