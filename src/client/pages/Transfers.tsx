import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNavigationTabs from '../components/BottomNavigationTabs';
import {
  ArrowDataTransferVerticalIcon,
  ArrowRight01Icon,
  MoneyExchange01Icon,
  Building03Icon,
  BankIcon
} from 'hugeicons-react';

const Transfers: React.FC = () => {
  const navigate = useNavigate();

  const transferOptions = [
    {
      title: 'Savings Transactions',
      description: 'View and manage your savings transactions',
      icon: <MoneyExchange01Icon size={24} className="text-[#1a8ca5]" />,
      path: '/transfers/savings-transactions'
    },
    {
      title: 'Loan Transactions',
      description: 'View and manage your loan transactions',
      icon: <Building03Icon size={24} className="text-[#1a8ca5]" />,
      path: '/transfers/loan-transactions'
    },
    {
      title: 'Between Own Accounts',
      description: 'Transfer money between your own accounts',
      icon: <ArrowDataTransferVerticalIcon size={24} className="text-[#1a8ca5]" />,
      path: '/transfers/own-accounts'
    },
    {
      title: 'To Another Account',
      description: 'Transfer to saved beneficiaries',
      icon: <BankIcon size={24} className="text-[#1a8ca5]" />,
      path: '/transfers/beneficiary'
    },
    {
      title: 'Wire to Another FSP',
      description: 'Wire transfer to other financial institutions',
      icon: <Building03Icon size={24} className="text-[#1a8ca5]" />,
      path: '/transfers/wire-transfer'
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 overflow-y-auto pb-20 pt-16">
        {/* Page Header */}
        <div className="bg-white px-4 py-6 mb-2 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
          <p className="text-sm text-gray-600 mt-1">Choose a transfer option</p>
        </div>

        {/* Transfer Options */}
        <div className="px-4 py-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            {transferOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => navigate(option.path)}
                className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="shrink-0 w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 text-base font-semibold">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-0.5">
                    {option.description}
                  </p>
                </div>
                <ArrowRight01Icon size={24} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default Transfers;
