import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PiggyBankIcon, Wallet03Icon, File01Icon, PlusSignCircleIcon, CloudSavingDone02Icon } from 'hugeicons-react';
import Header from '../components/Header';
import { searchParamsVariables } from '../utilities/UrlParamVariables';

const productOptions = [
  {
    name: 'Open New Savings Account',
    description: 'Start saving with high interest and flexible withdrawals.',
    icon: <CloudSavingDone02Icon size={28} />,
    route: '/apply-products/savings',
  },
  {
    name: 'Apply for a Fixed Deposit',
    description: 'Lock funds for a period and earn fixed returns.',
    icon: <PiggyBankIcon size={28} />,
    route: '/apply-products/fixed-deposit',
  },
  {
    name: 'Apply for a Loan',
    description: 'Get loans tailored to your needs with flexible terms.',
    icon: <File01Icon size={28} />,
    route: '/apply-products/loan',
  },
  {
    name: 'Activate Mobile Wallet',
    description: 'Link and manage your mobile money wallet securely.',
    icon: <Wallet03Icon size={28} />,
    route: '/apply-products/mobile-wallet',
  },
  {
    name: 'Request a Debit or Credit Card',
    description: 'Enjoy seamless transactions with secure card services.',
    icon: <PlusSignCircleIcon size={28} />,
    route: '/apply-products/card',
  },
];

const ApplyForProducts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleApplyClick = (route: string) => {
    searchParams.set(searchParamsVariables.menuPanelOpen, '1');
    setSearchParams(searchParams);
    console.log(route);
    // navigate(route);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <div className="pt-14 px-4 pb-20 overflow-y-auto">
        <div className="my-8">
          <h1 className="text-md font-bold">Apply for Products</h1>
          <p className="text-sm text-gray-500">Select a product to start your application.</p>
        </div>

        <div className="grid gap-4">
          {productOptions.map((product, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center px-4 py-4 border border-gray-200 rounded-2xl shadow-sm bg-gray-50 hover:shadow-md transition duration-150 cursor-pointer"
              onClick={() => handleApplyClick(product.route)}
            >
              <div className="flex gap-4 items-center">
                <div className="text-blue-600 bg-blue-100 p-2 rounded-full">
                  {product.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.description}</p>
                </div>
              </div>
              <PlusSignCircleIcon size={20} className="text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApplyForProducts;
