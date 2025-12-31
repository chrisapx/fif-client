import { Menu03Icon, Notification02Icon } from 'hugeicons-react'
import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { searchParamsVariables } from '../../utilities/UrlParamVariables';
import MenuPanel from './panels/MenuPanel';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleAccountPanelClick = ( selectedAcc: any) => {
      console.log(selectedAcc);
      searchParams.set(searchParamsVariables.menuPanelOpen, '1');
      // searchParams.set(searchParamsVariables.selectedAccount, encryptParams(selectedAcc));
      setSearchParams(searchParams);
    }
  return (
    <>
      <header className="flex justify-between text-white items-center px-2 py-2 bg-[#1a8ca5] z-10 fixed top-0 left-0 right-0">
          <Menu03Icon size={18} onClick={handleAccountPanelClick}/>
          {title ? (
            <h1 className="text-[15px] font-bold tracking-tight">{title}</h1>
          ) : (
            <img src="/logos/fif 3.png" alt="FIF Logo" className="h-8" onClick={() => navigate('/home')} />
          )}
          <div className="flex items-center space-x-3">
            <Notification02Icon className="text-white" size={16} />
          </div>
      </header>
      <MenuPanel/>
    </>
  )
}

export default Header
