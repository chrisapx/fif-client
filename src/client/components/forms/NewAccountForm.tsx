import React, { useEffect, useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Logout05Icon } from 'hugeicons-react';
import { searchParamsVariables } from '../../../utilities/UrlParamVariables';
import { getAuthUser, getUserToken, logout } from '../../../utilities/AuthCookieManager';
import axios from 'axios';
import { api_urls } from '../../../utilities/api_urls';

const user = getAuthUser();
const token = getUserToken();

interface IMessage {
  text: string;
  type: 'error' | 'success' | 'warn';
}

const NewAccountForm: React.FC = () => {
    const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const panelStatus = searchParams.get(searchParamsVariables.newAccountPanelOpen);

  const [savingsProducts, setSavingsProducts] = useState<any[]>([]);
  const [message, setMessage] = useState<IMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [formData, setFormData] = useState({
    productId: '',
    userId: user?.userId || '',
  });

  const handleHidePanel = () => {
    searchParams.delete(searchParamsVariables.newAccountPanelOpen);
    setSearchParams(searchParams);
    setMessage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // When product changes, store the selected product details
    if (name === 'productId') {
      const product = savingsProducts.find((p: any) => p.id === Number(value));
      setSelectedProduct(product);
    }
  };

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';

  const headers = {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      'Fineract-Platform-TenantId': tenant,
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (!selectedProduct) {
        setMessage({ text: 'Please select a savings product', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Format date as required by Fineract
      const today = new Date();
      const dateFormat = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(today);

      // Fineract savings account payload
      const payload: any = {
        clientId: Number(formData.userId),
        productId: Number(formData.productId),
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        submittedOnDate: dateFormat,
      };

      // Add product details from selected product
      payload.nominalAnnualInterestRate = selectedProduct.nominalAnnualInterestRate || 5;
      payload.interestCompoundingPeriodType = selectedProduct.interestCompoundingPeriodType?.id || 1;
      payload.interestPostingPeriodType = selectedProduct.interestPostingPeriodType?.id || 4;
      payload.interestCalculationType = selectedProduct.interestCalculationType?.id || 1;
      payload.interestCalculationDaysInYearType = selectedProduct.interestCalculationDaysInYearType?.id || 365;
      payload.withdrawalFeeForTransfers = false;
      payload.allowOverdraft = false;
      payload.enforceMinRequiredBalance = false;
      payload.withHoldTax = false;

      const response = await axios.post(
        api_urls.savingsAccounts.create_savings_account,
        payload,
        { headers }
      );

      console.log('Savings account application submitted:', response?.data);

      setMessage({
        text: 'Savings account application submitted successfully! Awaiting approval from admin.',
        type: 'success',
      });

      // Reset form
      setFormData({
        productId: '',
        userId: user?.userId || '',
      });
      setSelectedProduct(null);

      setTimeout(() => {
        handleHidePanel();
        // Optionally reload to show new account
        window.location.reload();
      }, 2500);
    } catch (error: any) {
      console.error('Account creation error:', error);
      const fallbackMessage =
        error?.response?.data?.defaultUserMessage ||
        error?.response?.data?.errors?.[0]?.defaultUserMessage ||
        error?.message ||
        'Failed to create account. Please check your inputs and try again.';
      setMessage({ text: fallbackMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchSavingsProducts = async () => {
      if (panelStatus !== '1' || !formData.userId) return;

      try {
        // Fetch savings products with clientId parameter
        const url = formData.userId
          ? `${api_urls.templates.savings_products}?clientId=${formData.userId}`
          : api_urls.templates.savings_products;

        const response = await axios.get(url, { headers });

        // The response should be an array of savings products
        const products = Array.isArray(response.data) ? response.data : [];
        setSavingsProducts(products);

        if (products.length === 0) {
          setMessage({
            text: 'No savings products available. Please contact admin.',
            type: 'warn'
          });
        }
      } catch (error) {
        console.error('Error fetching savings products:', error);
        setMessage({
          text: 'Failed to load savings products. Please try again.',
          type: 'error'
        });
      }
    };

    fetchSavingsProducts();
  }, [panelStatus, formData.userId]);

  const handleLogout = () => {
    logout();
    navigate('/login')
  }

  return (
    <div>
      <Sidebar
        visible={panelStatus === '1'}
        onHide={handleHidePanel}
        className="w-full"
        content={({ hide }) => (
          <section className="overflow-auto">
            <div className="sticky top-0 bg-blue-600 text-white flex justify-between items-center px-4 py-3 z-10">
              <i className="pi pi-times text-lg" onClick={hide}></i>
              <p className="text-sm font-semibold">New Account Application</p>
              <Logout05Icon size={18} onClick={handleLogout} />
            </div>

            <form onSubmit={handleSubmit} className="px-4 pb-10 pt-2">
              {message && (
                <div
                  className={`mb-4 px-3 py-2 text-sm rounded border ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : message.type === 'warn'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="productId" className="block text-xs text-gray-500 mb-1">
                  Savings Product
                </label>
                <select
                  id="productId"
                  name="productId"
                  value={formData.productId}
                  onChange={handleInputChange}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  required
                  disabled={isSubmitting || savingsProducts.length === 0}
                >
                  <option value="">Select savings product</option>
                  {savingsProducts.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className='mt-2 p-3 bg-blue-50 rounded text-xs space-y-1'>
                    <p className='text-gray-700'>
                      <span className='font-semibold'>Interest Rate:</span> {selectedProduct.nominalAnnualInterestRate || 0}% per annum
                    </p>
                    {selectedProduct.description && (
                      <p className='text-gray-600 text-xs'>
                        {selectedProduct.description}
                      </p>
                    )}
                    {selectedProduct.minRequiredOpeningBalance && (
                      <p className='text-gray-700'>
                        <span className='font-semibold'>Min. Opening Balance:</span> {selectedProduct.currency?.displaySymbol || ''}{selectedProduct.minRequiredOpeningBalance}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-6">
                <p className="text-xs text-gray-600 mb-2 font-semibold">Note:</p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Your application will be reviewed by an administrator</li>
                  <li>You will be notified once your account is approved and activated</li>
                  <li>Once activated, you can start making deposits to your account</li>
                </ul>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                By submitting, you agree to the terms and conditions of Family Investment Fund.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleHidePanel}
                  className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm bg-[#115DA9] text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !formData.productId}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </section>
        )}
      />
    </div>
  );
};

export default NewAccountForm;