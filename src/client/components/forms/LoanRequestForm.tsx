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
  const editLoanId = searchParams.get(searchParamsVariables.editLoanId);

  const user = getAuthUser();

  const [loanProducts, setLoanProducts] = useState<any[]>([]);
  const [message, setMessage] = useState<IMessage | null>(null);

  const [formData, setFormData] = useState({
    loanProductId: '',
    loanAmount: '',
    numberOfRepayments: '4',
    repaymentEvery: '1',
    accountName: '',
    expectedDisbursementDate: '',
    loanType: 'individual',
    clientId: user?.userId || '',
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleHideLoanPanel = () => {
    searchParams.delete(searchParamsVariables.loanRequestPanelOpen);
    searchParams.delete(searchParamsVariables.editLoanId);
    setSearchParams(searchParams);
    setMessage(null);
    setIsEditMode(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // When product changes, store the selected product details
    if (name === 'loanProductId') {
      const product = loanProducts.find((p: any) => p.id === Number(value));
      setSelectedProduct(product);
    }
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
          api_urls.templates.loan_products(formData.clientId),
          { headers }
        );
        // The loanproducts endpoint returns array of products
        setLoanProducts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching loan products:', error);
        setMessage({ text: 'Failed to load loan products. Please try again.', type: 'error' });
      }
    };

    const fetchLoanForEdit = async () => {
      if (!editLoanId) return;

      try {
        const response = await axios.get(
          api_urls.loans.get_loan_with_details(editLoanId),
          { headers }
        );

        const loanData = response.data;

        // Convert expected disbursement date to YYYY-MM-DD format
        let expectedDate = '';
        if (loanData.timeline?.expectedDisbursementDate) {
          const dateArray = loanData.timeline.expectedDisbursementDate;
          if (Array.isArray(dateArray)) {
            const [year, month, day] = dateArray;
            expectedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        }

        setFormData({
          loanProductId: loanData.loanProductId?.toString() || '',
          loanAmount: loanData.principal?.toString() || '',
          numberOfRepayments: loanData.numberOfRepayments?.toString() || '4',
          repaymentEvery: loanData.repaymentEvery?.toString() || '1',
          accountName: loanData.externalId || '',
          expectedDisbursementDate: expectedDate,
          loanType: loanData.loanType?.value?.toLowerCase() || 'individual',
          clientId: user?.userId || '',
        });

        // Find and set the selected product
        const product = loanProducts.find((p: any) => p.id === loanData.loanProductId);
        if (product) {
          setSelectedProduct(product);
        }

        setIsEditMode(true);
      } catch (error) {
        console.error('Error fetching loan for edit:', error);
        setMessage({ text: 'Failed to load loan details for editing.', type: 'error' });
      }
    };

    if (panelStatus === '1' && formData.clientId) {
      fetchLoanProducts().then(() => {
        if (editLoanId) {
          fetchLoanForEdit();
        }
      });
    }
  }, [panelStatus, formData.clientId, editLoanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (!selectedProduct) {
        setMessage({ text: 'Please select a loan product', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      const today = new Date();
      const dateFormat = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(today);

      // Format expected disbursement date if provided
      let expectedDisbursementDateFormatted = dateFormat; // Default to today
      if (formData.expectedDisbursementDate) {
        const expectedDate = new Date(formData.expectedDisbursementDate);
        expectedDisbursementDateFormatted = new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }).format(expectedDate);
      }

      // Use product defaults or fallback values
      const payload = {
        loanType: formData.loanType,
        clientId: Number(formData.clientId),
        productId: Number(formData.loanProductId),
        principal: Number(formData.loanAmount),
        loanTermFrequency: Number(formData.numberOfRepayments),
        loanTermFrequencyType: selectedProduct.repaymentFrequencyType?.id || 2,
        numberOfRepayments: Number(formData.numberOfRepayments),
        repaymentEvery: Number(formData.repaymentEvery),
        repaymentFrequencyType: selectedProduct.repaymentFrequencyType?.id || 2,
        interestRatePerPeriod: selectedProduct.interestRatePerPeriod || 5,
        amortizationType: selectedProduct.amortizationType?.id || 1,
        interestType: selectedProduct.interestType?.id || 0,
        interestCalculationPeriodType: selectedProduct.interestCalculationPeriodType?.id || 1,
        transactionProcessingStrategyCode: selectedProduct.transactionProcessingStrategyCode || 'creocore-strategy',
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        submittedOnDate: dateFormat,
        expectedDisbursementDate: expectedDisbursementDateFormatted,
        // Use externalId for custom loan identification if provided
        ...(formData.accountName && { externalId: formData.accountName }),
      };

      let response;
      if (isEditMode && editLoanId) {
        // Update existing loan
        response = await axios.put(
          api_urls.loans.get_loan(editLoanId),
          payload,
          { headers }
        );
        setMessage({
          text: 'Loan application updated successfully!',
          type: 'success',
        });
      } else {
        // Create new loan
        response = await axios.post(
          api_urls.loans.create_loan,
          payload,
          { headers }
        );
        setMessage({
          text: 'Loan application submitted successfully! Awaiting approval from admin.',
          type: 'success',
        });
      }

      console.log('Loan application response:', response.data);

      // Reset form
      setFormData({
        loanProductId: '',
        loanAmount: '',
        numberOfRepayments: '4',
        repaymentEvery: '1',
        accountName: '',
        expectedDisbursementDate: '',
        loanType: 'individual',
        clientId: user?.userId || '',
      });
      setSelectedProduct(null);
      setIsEditMode(false);

      setTimeout(() => {
        handleHideLoanPanel();
        // Optionally reload the page to show new loan
        window.location.reload();
      }, 2500);
    } catch (error: any) {
      console.error('Loan application error:', error);
      const fallbackMessage =
        error?.response?.data?.defaultUserMessage ||
        error?.response?.data?.errors?.[0]?.defaultUserMessage ||
        error?.message ||
        'Failed to submit loan application. Please check your inputs and try again.';
      setMessage({ text: fallbackMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
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
              <p>{isEditMode ? 'Edit Loan Application' : 'Loan Request Form'}</p>
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
                  disabled={isSubmitting}
                >
                  <option value=''>Select loan product</option>
                  {loanProducts.map((product: any) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <div className='mt-3 p-3 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg text-xs'>
                    <p className='font-bold text-blue-900 mb-2 text-sm'>{selectedProduct.name}</p>

                    {/* Currency */}
                    <div className='mb-3 pb-2 border-b border-blue-200'>
                      <p className='text-gray-600 mb-1'>Currency</p>
                      <p className='font-semibold text-blue-800'>
                        {selectedProduct.currency?.displayLabel || selectedProduct.currency?.name || 'N/A'}
                      </p>
                    </div>

                    {/* Principal Amount Limits */}
                    <div className='mb-3 pb-2 border-b border-blue-200'>
                      <p className='text-gray-600 mb-1'>Principal Amount Range</p>
                      <div className='grid grid-cols-3 gap-2'>
                        <div>
                          <p className='text-[10px] text-gray-500'>Minimum</p>
                          <p className='font-semibold text-green-700'>
                            {selectedProduct.currency?.displaySymbol} {selectedProduct.minPrincipal?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-[10px] text-gray-500'>Default</p>
                          <p className='font-semibold text-blue-700'>
                            {selectedProduct.currency?.displaySymbol} {selectedProduct.principal?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className='text-[10px] text-gray-500'>Maximum</p>
                          <p className='font-semibold text-red-700'>
                            {selectedProduct.currency?.displaySymbol} {selectedProduct.maxPrincipal?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Repayment Terms */}
                    <div className='mb-3 pb-2 border-b border-blue-200'>
                      <p className='text-gray-600 mb-1'>Number of Repayments ({selectedProduct.repaymentFrequencyType?.value || 'Months'})</p>
                      <div className='grid grid-cols-3 gap-2'>
                        <div>
                          <p className='text-[10px] text-gray-500'>Minimum</p>
                          <p className='font-semibold text-green-700'>{selectedProduct.minNumberOfRepayments || 'N/A'}</p>
                        </div>
                        <div>
                          <p className='text-[10px] text-gray-500'>Default</p>
                          <p className='font-semibold text-blue-700'>{selectedProduct.numberOfRepayments || 'N/A'}</p>
                        </div>
                        <div>
                          <p className='text-[10px] text-gray-500'>Maximum</p>
                          <p className='font-semibold text-red-700'>{selectedProduct.maxNumberOfRepayments || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Interest Rates */}
                    <div className='mb-3 pb-2 border-b border-blue-200'>
                      <p className='text-gray-600 mb-1'>Interest Rates</p>
                      <div className='space-y-1'>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Per Period ({selectedProduct.interestRateFrequencyType?.value || 'Month'})</span>
                          <span className='font-bold text-orange-600'>{selectedProduct.interestRatePerPeriod}%</span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Annual Rate</span>
                          <span className='font-bold text-red-600'>{selectedProduct.annualInterestRate}%</span>
                        </div>
                        {selectedProduct.minInterestRatePerPeriod !== selectedProduct.maxInterestRatePerPeriod && (
                          <div className='text-[10px] text-gray-500 mt-1'>
                            Range: {selectedProduct.minInterestRatePerPeriod}% - {selectedProduct.maxInterestRatePerPeriod}% per period
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Repayment Details */}
                    <div className='mb-3 pb-2 border-b border-blue-200'>
                      <p className='text-gray-600 mb-1'>Repayment Details</p>
                      <div className='space-y-1'>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Frequency</span>
                          <span className='font-semibold text-blue-700'>
                            Every {selectedProduct.repaymentEvery} {selectedProduct.repaymentFrequencyType?.value || 'Month(s)'}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Amortization</span>
                          <span className='font-semibold text-blue-700'>{selectedProduct.amortizationType?.value || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Interest Calculation */}
                    <div className='mb-2'>
                      <p className='text-gray-600 mb-1'>Interest Calculation</p>
                      <div className='space-y-1'>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Type</span>
                          <span className='font-semibold text-blue-700'>{selectedProduct.interestType?.value || 'N/A'}</span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Period</span>
                          <span className='font-semibold text-blue-700 text-[10px]'>{selectedProduct.interestCalculationPeriodType?.value || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {selectedProduct.status && (
                      <div className='mt-3 pt-2 border-t border-blue-200'>
                        <span className='inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-[10px] font-semibold'>
                          ✓ Active Product
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Loan Type Field */}
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <label className='text-xs' htmlFor='loanType'>
                  Loan Type
                </label>
                <select
                  id='loanType'
                  name='loanType'
                  value={formData.loanType}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  required
                  disabled={isSubmitting}
                >
                  <option value='individual'>Individual</option>
                  <option value='group'>Group</option>
                  <option value='jlg'>Joint Liability Group (JLG)</option>
                </select>
                <p className='text-[10px] text-gray-500 mt-1'>
                  Select the type of loan you are applying for
                </p>
              </div>

              {/* Custom Product Name Field */}
              <div className='px-2 py-3'>
                <label className='text-xs' htmlFor='accountName'>
                  Custom Product Name (Optional)
                </label>
                <input
                  id='accountName'
                  name='accountName'
                  type='text'
                  value={formData.accountName}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='e.g., Business Expansion Loan, Personal Car Loan'
                  maxLength={100}
                  disabled={isSubmitting}
                />
                <p className='text-[10px] text-gray-500 mt-1'>
                  Give your loan a custom name for easy identification (if not provided, system will use default loan product name)
                </p>
              </div>

              {/* Expected Disbursement Date Field */}
              <div className='px-2 py-3'>
                <label className='text-xs' htmlFor='expectedDisbursementDate'>
                  Expected Disbursement Date
                </label>
                <input
                  id='expectedDisbursementDate'
                  name='expectedDisbursementDate'
                  type='date'
                  value={formData.expectedDisbursementDate}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  min={new Date().toISOString().split('T')[0]}
                  required
                  disabled={isSubmitting}
                />
                <p className='text-[10px] text-gray-500 mt-1'>
                  Select the date when you expect to receive the loan funds
                </p>
              </div>

              <div className='px-2 py-3'>
                <label className='text-xs' htmlFor='loanAmount'>
                  Loan Amount (Principal)
                  {selectedProduct && (
                    <span className='text-gray-500 ml-1'>
                      ({selectedProduct.currency?.displaySymbol} {selectedProduct.minPrincipal?.toLocaleString()} - {selectedProduct.maxPrincipal?.toLocaleString()})
                    </span>
                  )}
                </label>
                <div className='flex items-center'>
                  <input
                    id='loanAmount'
                    name='loanAmount'
                    type='number'
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                    placeholder={selectedProduct ? `Default: ${selectedProduct.principal}` : 'e.g., 100000'}
                    min={selectedProduct?.minPrincipal || 0}
                    max={selectedProduct?.maxPrincipal || undefined}
                    step='1000'
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {selectedProduct && (
                  <div className='mt-2 flex justify-between text-[10px] text-gray-600'>
                    <span className='flex items-center gap-1'>
                      <span className='text-green-600 font-semibold'>Min:</span>
                      {selectedProduct.currency?.displaySymbol} {selectedProduct.minPrincipal?.toLocaleString()}
                    </span>
                    <span className='flex items-center gap-1'>
                      <span className='text-red-600 font-semibold'>Max:</span>
                      {selectedProduct.currency?.displaySymbol} {selectedProduct.maxPrincipal?.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <label className='text-xs' htmlFor='numberOfRepayments'>
                  Number of Repayments
                  {selectedProduct && (
                    <span className='text-gray-500 ml-1'>
                      ({selectedProduct.minNumberOfRepayments} - {selectedProduct.maxNumberOfRepayments} {selectedProduct.repaymentFrequencyType?.value})
                    </span>
                  )}
                </label>
                <input
                  id='numberOfRepayments'
                  name='numberOfRepayments'
                  type='number'
                  value={formData.numberOfRepayments}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder={selectedProduct ? `Default: ${selectedProduct.numberOfRepayments}` : 'e.g., 4'}
                  min={selectedProduct?.minNumberOfRepayments || 1}
                  max={selectedProduct?.maxNumberOfRepayments || undefined}
                  required
                  disabled={isSubmitting}
                />
                {selectedProduct && (
                  <div className='mt-2 flex justify-between text-[10px] text-gray-600'>
                    <span className='flex items-center gap-1'>
                      <span className='text-green-600 font-semibold'>Min:</span>
                      {selectedProduct.minNumberOfRepayments}
                    </span>
                    <span className='flex items-center gap-1'>
                      <span className='text-red-600 font-semibold'>Max:</span>
                      {selectedProduct.maxNumberOfRepayments}
                    </span>
                  </div>
                )}
              </div>
              <p className='px-2 py-4 text-sm'>By clicking 'Submit', you agree to FiFund's terms and conditions</p>
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
                  disabled={isSubmitting}
                  className='px-6 py-3 text-sm bg-[#115DA9] text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isSubmitting
                    ? (isEditMode ? 'Updating...' : 'Submitting...')
                    : (isEditMode ? 'Update Application' : 'Submit Application')
                  }
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