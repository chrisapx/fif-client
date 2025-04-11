import React from 'react'
import { NavLink } from 'react-router-dom'
import { GiBanknote } from 'react-icons/gi'
import { BiHistory } from 'react-icons/bi'
import { MoneyExchange01Icon } from 'hugeicons-react'

const BottomNavigationTabs: React.FC = () => {
  return (
    <nav className="flex justify-around items-center py-3 border-t border-gray-200 bg-white fixed bottom-0 left-0 right-0 z-50">
      <NavLink to="/home">
        {({ isActive }) => (
          <div className="flex flex-col items-center cursor-pointer transition-colors">
            <GiBanknote className={isActive ? "text-[#115DA9]" : "text-gray-500"} size={24} />
            <span className={`text-xs mt-1 ${isActive ? "text-[#115DA9]" : "text-gray-500"}`}>Accounts</span>
          </div>
        )}
      </NavLink>

      {/* <NavLink to="">
        {({ isActive }) => (
          <div className="flex flex-col items-center cursor-pointer transition-colors">
            <MoneyExchange01Icon className={isActive ? "text-[#115DA9]" : "text-gray-500"} size={24} />
            <span className={`text-xs mt-1 ${isActive ? "text-[#115DA9]" : "text-gray-500"}`}>Loans</span>
          </div>
        )}
      </NavLink>

      <NavLink to="">
        {({ isActive }) => (
          <div className="flex flex-col items-center cursor-pointer transition-colors">
            <BiHistory className={isActive ? "text-[#115DA9]" : "text-gray-500"} size={24} />
            <span className={`text-xs mt-1 ${isActive ? "text-[#115DA9]" : "text-gray-500"}`}>History</span>
          </div>
        )}
      </NavLink> */}
      <div className="flex flex-col items-center cursor-not-allowed opacity-50 transition-colors">
        <MoneyExchange01Icon className="text-gray-500" size={24} />
        <span className="text-xs mt-1 text-gray-500">Loans</span>
      </div>

      <div className="flex flex-col items-center cursor-not-allowed opacity-50 transition-colors">
        <BiHistory className="text-gray-500" size={24} />
        <span className="text-xs mt-1 text-gray-500">History</span>
      </div>
    </nav>
  )
}

export default BottomNavigationTabs