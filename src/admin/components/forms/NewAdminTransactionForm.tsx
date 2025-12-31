import React, { useState } from 'react';
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

const NewAdminTransactionForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const panelStatus = searchParams.get(searchParamsVariables.newAdminTransactionPanelOpen);
  const [message, setMessage] = useState<IMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    accountId: '',
    trxAmount: '',
    trxRef: '',
    trxDescription: '',
    trxGateway: 'CASH',
    transactionType: 'DEPOSIT',
    createdBy: user?.userId ?? '',
  });

  const handleHidePanel = () => {
    searchParams.delete(searchParamsVariables.newAdminTransactionPanelOpen);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';

    const headers = {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
      'Fineract-Platform-TenantId': tenant,
    };

    try {
      // For admin transactions, we post directly (no approval needed)
      const isDeposit = formData.transactionType === 'DEPOSIT';
      const endpoint = isDeposit
        ? api_urls.transactions.deposit(formData.accountId)
        : api_urls.transactions.withdrawal(formData.accountId);

      // Format date as required by Fineract
      const today = new Date();
      const dateFormat = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(today);

      const payload = {
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        transactionDate: dateFormat,
        transactionAmount: Number(formData.trxAmount),
        paymentTypeId: formData.trxGateway === 'CASH' ? 1 : 2,
        note: formData.trxDescription,
        accountNumber: formData.accountId,
        checkNumber: formData.trxRef || '',
        receiptNumber: formData.trxRef || ''
      };

      await axios.post(endpoint, payload, { headers });

      setMessage({
        text: `${isDeposit ? 'Deposit' : 'Withdrawal'} posted successfully!`,
        type: 'success'
      });

      // Reset form
      setFormData({
        accountId: '',
        trxAmount: '',
        trxRef: '',
        trxDescription: '',
        trxGateway: 'CASH',
        transactionType: 'DEPOSIT',
        createdBy: user?.userId ?? '',
      });

      setTimeout(() => {
        handleHidePanel();
      }, 2000);
    } catch (error: any) {
      const fallbackMessage =
        error?.response?.data?.defaultUserMessage ||
        error?.response?.data?.errors?.[0]?.defaultUserMessage ||
        'Failed to submit transaction. Try again.';
      setMessage({ text: fallbackMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <Sidebar
        visible={panelStatus === '1'}
        onHide={handleHidePanel}
        className="w-full"
        content={({ hide }) => (
          <section className="overflow-auto">
            <div className="sticky top-0 bg-[#1a8ca5] text-white flex justify-between items-center px-4 py-3 z-10">
              <i className="pi pi-times text-lg" onClick={hide}></i>
              <p className="text-sm font-semibold">New Transaction</p>
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
                <label htmlFor="trxAmount" className="block text-xs text-gray-500 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  id="accountId"
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleInputChange}
                  placeholder="Enter Account Number"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="trxAmount" className="block text-xs text-gray-500 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  id="trxAmount"
                  name="trxAmount"
                  value={formData.trxAmount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="trxRef" className="block text-xs text-gray-500 mb-1">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  id="trxRef"
                  name="trxRef"
                  value={formData.trxRef}
                  onChange={handleInputChange}
                  placeholder="Enter Transaction ID from Mobile Money"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="trxDescription" className="block text-xs text-gray-500 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="trxDescription"
                  name="trxDescription"
                  value={formData.trxDescription}
                  onChange={handleInputChange}
                  placeholder="Deposit for savings via MTN"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="trxGateway" className="block text-xs text-gray-500 mb-1">
                    Gateway
                  </label>
                  <select
                    id="trxGateway"
                    name="trxGateway"
                    value={formData.trxGateway}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                    required
                    disabled
                  >
                    <option value="">Select gateway</option>
                    <option value="CASH">Cash</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="transactionType" className="block text-xs text-gray-500 mb-1">
                    Transaction Type
                  </label>
                  <select
                    id="transactionType"
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                    required
                    disabled
                  >
                    <option value="">Select type</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAW">Withdraw</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>
              </div>

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
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm bg-[#1a8ca5] text-white rounded hover:bg-[#157582] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <i className="pi pi-spin pi-spinner" style={{ fontSize: '0.875rem' }}></i>
                      Submitting...
                    </>
                  ) : (
                    'Submit Transaction'
                  )}
                </button>
              </div>
            </form>
          </section>
        )}
      />
    </div>
  );
};

export default NewAdminTransactionForm;