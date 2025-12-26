import React, { useState, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { useSearchParams } from 'react-router-dom';
import { Logout05Icon } from 'hugeicons-react';
import { searchParamsVariables } from '../../../utilities/UrlParamVariables';
import { getAuthUser, getUserToken } from '../../../utilities/AuthCookieManager';
import axios from 'axios';
import { api_urls } from '../../../utilities/api_urls';

interface IMessage {
  text: string;
  type: 'error' | 'success' | 'warn';
}

const LoanRequestForm = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const panelStatus = searchParams.get(searchParamsVariables.loanRequestPanelOpen);

  const user = getAuthUser();

  const [loanProducts, setLoanProducts] = useState<any[]>([]);
  const [message, setMessage] = useState<IMessage | null>(null);

  const [formData, setFormData] = useState({
    loanProductId: '',
    loanAmount: '',
    numberOfRepayments: '4',
    repaymentEvery: '1',
    clientId: user?.userId || '',
  });

  const handleHideLoanPanel = () => {
    searchParams.delete(searchParamsVariables.loanRequestPanelOpen);
    setSearchParams(searchParams);
    setMessage(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };

  useEffect(() => {
    const fetchLoanProducts = async () => {
      try {
        const response = await axios.get(
          api_urls.templates.loan_products_template(formData.clientId),
          { headers }
        );
        // The template endpoint returns productOptions
        setLoanProducts(response.data?.productOptions || []);
      } catch (error) {
        console.error('Error fetching loan products:', error);
        setMessage({ text: 'Failed to load loan products. Please try again.', type: 'error' });
      }
    };

    if (panelStatus === '1' && formData.clientId) {
      fetchLoanProducts();
    }
  }, [panelStatus, formData.clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const today = new Date();
      const dateFormat = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(today);

      const payload = {
        clientId: Number(formData.clientId),
        productId: Number(formData.loanProductId),
        principal: Number(formData.loanAmount),
        loanTermFrequency: Number(formData.numberOfRepayments),
        loanTermFrequencyType: 2, // Months
        numberOfRepayments: Number(formData.numberOfRepayments),
        repaymentEvery: Number(formData.repaymentEvery),
        repaymentFrequencyType: 2, // Months
        interestRatePerPeriod: 5, // Default 5%
        amortizationType: 1, // Equal installments
        interestType: 0, // Declining balance
        interestCalculationPeriodType: 1, // Same as repayment period
        transactionProcessingStrategyId: 1,
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        submittedOnDate: dateFormat,
        expectedDisbursementDate: dateFormat,
      };

      const response = await axios.post(
        api_urls.loans.create_loan,
        payload,
        { headers }
      );

      console.log('Loan created:', response.data);

      setMessage({
        text: 'Loan application submitted successfully! Awaiting approval.',
        type: 'success',
      });

      setTimeout(() => {
        handleHideLoanPanel();
      }, 2000);
    } catch (error: any) {
      console.error('Loan application error:', error);
      const fallbackMessage =
        error?.response?.data?.defaultUserMessage ||
        error?.response?.data?.errors?.[0]?.defaultUserMessage ||
        error?.message ||
        'Failed to submit loan application.';
      setMessage({ text: fallbackMessage, type: 'error' });
    }
  };

  return (
    <div>
      <Sidebar
        visible={panelStatus === '1'}
        onHide={handleHideLoanPanel}
        className='w-full'
        content={({ hide }) => (
          <section className='overflow-auto'>
            <div className='sticky w-full top-0 flex justify-between items-center px-2 py-3 bg-blue-500 text-white'>
              <i className='pi pi-times' onClick={hide} />
              <p>Loan Request Form</p>
              <Logout05Icon />
            </div>
            <form onSubmit={handleSubmit} className=''>
              {message && (
                <div
                  className={`mx-2 mt-2 px-3 py-2 text-sm rounded border ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <label className='text-xs' htmlFor='loanProductId'>
                  Loan Product
                </label>
                <select
                  id='loanProductId'
                  name='loanProductId'
                  value={formData.loanProductId}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  required
                >
                  <option value=''>Select loan product</option>
                  {loanProducts.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='px-2 py-3'>
                <label className='text-xs' htmlFor='loanAmount'>
                  Loan Amount (Principal)
                </label>
                <div className='flex items-center'>
                  <input
                    id='loanAmount'
                    name='loanAmount'
                    type='number'
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                    placeholder='e.g., 1000000'
                    min='0'
                    required
                  />
                </div>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <label className='text-xs' htmlFor='numberOfRepayments'>
                  Number of Repayments (Months)
                </label>
                <input
                  id='numberOfRepayments'
                  name='numberOfRepayments'
                  type='number'
                  value={formData.numberOfRepayments}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='e.g., 4'
                  min='1'
                  required
                />
              </div>
              <div className='px-2 py-3'>
                <label className='text-xs' htmlFor='repaymentEvery'>
                  Repayment Every (Months)
                </label>
                <input
                  id='repaymentEvery'
                  name='repaymentEvery'
                  type='number'
                  value={formData.repaymentEvery}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='e.g., 1'
                  min='1'
                  required
                />
              </div>
              <p className='px-2 py-4 text-sm'>By Clicking 'Submit, you agree to FiFund's terms and conditions</p>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100 flex justify-end gap-2'>
                <button
                  type='button'
                  onClick={handleHideLoanPanel}
                  className='px-6 py-3 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-6 py-3 text-sm bg-[#115DA9] text-white rounded hover:bg-blue-600'
                >
                  Submit
                </button>
              </div>
            </form>
          </section>
        )}
      />
    </div>
  );
};

export default LoanRequestForm;