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

  const [branches, setBranches] = useState<any[]>([]);
  const [accountTypes, setAccountTypes] = useState<any[]>([]);

  const [message, setMessage] = useState<IMessage | null>(null);

  const [formData, setFormData] = useState({
    accName: '',
    commitmentAmount: '',
    userId: user?.userId || '',
    accEmail: user?.email || '',
    accPhone: user?.phone || '',
    accBranch: '',
    accType: '',
    createdBy: user?.userId || '',
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
  };

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';

  const headers = {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      'Fineract-Platform-TenantId': tenant,
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Get savings products first to find matching product
      let savingsProducts = [];
      try {
        const productsResponse = await axios.get(api_urls.templates.savings_products, { headers });
        savingsProducts = productsResponse.data?.savingsProductOptions || productsResponse.data || [];
      } catch (productError) {
        console.warn('Could not fetch savings products. Using defaults.');
        // If we can't fetch products, we'll create a basic account request
      }

      // Use the first available savings product or match by type
      let selectedProduct = null;
      if (savingsProducts.length > 0) {
        selectedProduct = savingsProducts.find((p: any) =>
          p.name?.toLowerCase().includes('savings')
        ) || savingsProducts[0];
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
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        submittedOnDate: dateFormat,
      };

      // Add product details if available
      if (selectedProduct) {
        payload.productId = selectedProduct.id;
        payload.nominalAnnualInterestRate = selectedProduct.nominalAnnualInterestRate || 5;
        payload.interestCompoundingPeriodType = selectedProduct.interestCompoundingPeriodType || 1;
        payload.interestPostingPeriodType = selectedProduct.interestPostingPeriodType || 4;
        payload.interestCalculationType = selectedProduct.interestCalculationType || 1;
        payload.interestCalculationDaysInYearType = selectedProduct.interestCalculationDaysInYearType || 365;
      } else {
        // Fallback: provide reasonable defaults
        setMessage({ text: 'Using default savings product configuration.', type: 'warn' });
      }

      payload.withdrawalFeeForTransfers = false;
      payload.allowOverdraft = false;
      payload.enforceMinRequiredBalance = false;
      payload.withHoldTax = false;

      const response = await axios.post(
        api_urls.savingsAccounts.create_savings_account,
        payload,
        { headers }
      );

      console.log('Account created:', response?.data);

      // Note: Self-service users cannot approve/activate accounts
      // These must be done by staff/admin through the admin panel
      setMessage({
        text: 'Savings account application submitted! It will be activated by admin.',
        type: 'success',
      });

      // Reset form
      setFormData({
        accName: '',
        commitmentAmount: '',
        userId: user?.userId || '',
        accEmail: user?.email || '',
        accPhone: user?.phone || '',
        accBranch: '',
        accType: '',
        createdBy: user?.userId || '',
      });

      setTimeout(() => {
        handleHidePanel();
      }, 3000);
    } catch (error: any) {
      console.error('Account creation error:', error);
      const fallbackMessage =
        error?.response?.data?.defaultUserMessage ||
        error?.response?.data?.errors?.[0]?.defaultUserMessage ||
        error?.message ||
        'Failed to create account. Try again.';
      setMessage({ text: fallbackMessage, type: 'error' });
    }
  };

  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        // Try to fetch offices (may not be accessible for self-service users)
        // try {
        //   const officesResponse = await axios.get(api_urls.templates.offices, { headers });
        //   if (officesResponse.data && Array.isArray(officesResponse.data)) {
        //     setBranches(officesResponse.data.map((office: any) => office.name));
        //   } else {
        //     // Fallback to default branch
        //     setBranches(['Head Office']);
        //   }
        // } catch (officesError) {
        //   console.warn('Could not fetch offices (self-service users may not have access). Using default branch.');
        //   // Fallback: Use default branch
        //   setBranches(['Head Office']);
        // }
        setBranches(['Head Office']); // Temporarily disable office fetching

        // Set account types (hardcoded as self-service may not have access to account type templates)
        setAccountTypes(['SAVINGS', 'INVESTMENTS']);
      } catch (error) {
        console.error('Error fetching template data:', error);
        // Ensure we have fallback values even if everything fails
        setBranches(['Head Office']);
        setAccountTypes(['SAVINGS', 'INVESTMENTS']);
      }
    };

    fetchTemplateData();
  }, []);

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
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="accName" className="block text-xs text-gray-500 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  id="accName"
                  name="accName"
                  placeholder='E.g. Annual savings for car'
                  value={formData.accName}
                  onChange={handleInputChange}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="commitmentAmount" className="block text-xs text-gray-500 mb-1">
                  Monthly Commitment Amount
                </label>
                <input
                  type="number"
                  id="commitmentAmount"
                  name="commitmentAmount"
                  placeholder='Monthly commitnent amount e.g. 450,000'
                  value={formData.commitmentAmount}
                  onChange={handleInputChange}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="accEmail" className="block text-xs text-gray-500 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="accEmail"
                    name="accEmail"
                    value={formData.accEmail}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="accPhone" className="block text-xs text-gray-500 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="accPhone"
                    name="accPhone"
                    value={formData.accPhone}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="accBranch" className="block text-xs text-gray-500 mb-1">
                  Branch
                </label>
                <select
                  id="accBranch"
                  name="accBranch"
                  value={formData.accBranch}
                  onChange={handleInputChange}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map((branch: any, i) => (
                    <option key={i} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="accType" className="block text-xs text-gray-500 mb-1">
                  Account Type
                </label>
                <select
                  id="accType"
                  name="accType"
                  value={formData.accType}
                  onChange={handleInputChange}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select type</option>
                  {accountTypes.map((type: any, i) => (
                    <option key={i} value={type}>
                      {type.replace(/^IL_/, '').replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                By submitting, you agree to the terms and conditions of Family Investment Fund.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleHidePanel}
                  className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm bg-[#115DA9] text-white rounded hover:bg-blue-600"
                >
                  Submit Application
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