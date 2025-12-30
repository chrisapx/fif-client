import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MoneySavingJarIcon, PlusSignIcon } from 'hugeicons-react';
import Header from '../components/Header';
import BottomNavigationTabs from '../components/BottomNavigationTabs';
import { api_urls } from '../../utilities/api_urls';
import axios from 'axios';
import { getUserToken, isAuthenticated, getAuthUser } from '../../utilities/AuthCookieManager';
import { searchParamsVariables } from '../../utilities/UrlParamVariables';
import NewAccountForm from '../components/forms/NewAccountForm';

const SavingsProducts: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [savingsProducts, setSavingsProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchSavingsProducts = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const user = getAuthUser();
        const clientId = user?.userId;

        // Fetch savings products with clientId parameter
        const url = clientId
          ? `${api_urls.templates.savings_products}?clientId=${clientId}`
          : api_urls.templates.savings_products;

        const response = await axios.get(url, { headers });

        console.log('Savings products response:', response.data);

        const products = Array.isArray(response.data) ? response.data : [];
        setSavingsProducts(products);

        if (products.length === 0) {
          setErrorMessage('No savings products available at the moment.');
        }
      } catch (err: any) {
        console.error('Error fetching savings products:', err);
        setErrorMessage(
          err.response?.data?.defaultUserMessage ||
          err.message ||
          'Failed to load savings products.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavingsProducts();
  }, [navigate]);

  const handleApplyClick = (productId: number) => {
    // Pre-select the product and open the form
    searchParams.set(searchParamsVariables.newAccountPanelOpen, '1');
    searchParams.set('selectedProductId', productId.toString());
    setSearchParams(searchParams);
  };

  const handleApplyForSavings = () => {
    searchParams.set(searchParamsVariables.newAccountPanelOpen, '1');
    setSearchParams(searchParams);
  };

  return (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden">
      <Header />
      {isLoading && (
        <span className="relative block w-full h-1.5 bg-blue-100 overflow-hidden rounded-full">
          <span className="absolute top-0 left-0 h-1.5 w-48 bg-blue-600 animate-loaderSlide rounded-full"></span>
        </span>
      )}

      <section className="overflow-y-auto mt-12 mb-12">
        {errorMessage && (
          <div className="mx-2 my-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-between items-center px-2 py-4 bg-[#012951]">
          <p className="text-sm text-white flex gap-2 items-center">
            Savings Products
          </p>
          <button
            onClick={handleApplyForSavings}
            className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-900 rounded-full text-xs font-semibold hover:bg-blue-50 transition"
          >
            <PlusSignIcon size={14} />
            Apply
          </button>
        </div>

        <div className="px-2 py-3">
          {savingsProducts.length === 0 && !isLoading && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No savings products found.
            </div>
          )}

          <div className="space-y-3">
            {savingsProducts.map((product, index) => (
              <article
                key={product.id || index}
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <MoneySavingJarIcon size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {product.description}
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-green-50 rounded px-3 py-2">
                        <p className="text-[10px] text-gray-500">Interest Rate</p>
                        <p className="text-sm font-semibold text-green-700">
                          {product.nominalAnnualInterestRate || 0}% p.a.
                        </p>
                      </div>

                      {product.currency && (
                        <div className="bg-blue-50 rounded px-3 py-2">
                          <p className="text-[10px] text-gray-500">Currency</p>
                          <p className="text-sm font-semibold text-blue-700">
                            {product.currency.displaySymbol || product.currency.code}
                          </p>
                        </div>
                      )}
                    </div>

                    {product.minRequiredOpeningBalance && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">Min. Opening Balance:</span>{' '}
                        {product.currency?.displaySymbol || ''}{' '}
                        {product.minRequiredOpeningBalance.toLocaleString()}
                      </div>
                    )}

                    <button
                      onClick={() => handleApplyClick(product.id)}
                      className="mt-3 w-full py-2 px-4 bg-[#115DA9] text-white text-xs font-semibold rounded hover:bg-blue-700 transition"
                    >
                      Apply for this Product
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <BottomNavigationTabs />
      <NewAccountForm />
    </div>
  );
};

export default SavingsProducts;
