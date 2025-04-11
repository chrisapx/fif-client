import { Menu03Icon, Notification02Icon } from 'hugeicons-react'
import React from 'react'

const Header: React.FC = () => {
  return (
    <header className="flex justify-between text-white items-center px-2 py-2 bg-blue-500 z-10 fixed top-0 left-0 right-0">
        <Menu03Icon size={18}/>
        <img src="/logos/fif 3.png" alt="FIF Logo" className="h-8" />
        <div className="flex items-center space-x-3">
          <Notification02Icon className="text-white" size={16} />
        </div>
    </header>
  )
}

export default Header
