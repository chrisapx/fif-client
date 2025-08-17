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

const NewTransactionForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const panelStatus = searchParams.get(searchParamsVariables.newTransactionPanelOpen);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [message, setMessage] = useState<IMessage | null>(null);

  const [formData, setFormData] = useState({
    accountId: '',
    trxAmount: '',
    trxRef: '',
    trxDescription: '',
    trxGateway: 'CASH',
    transactionType: 'DEPOSIT',
    createdBy: user?.userId || '',
  });

  const handleHidePanel = () => {
    searchParams.delete(searchParamsVariables.newTransactionPanelOpen);
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

    const payload = {
      accountId: formData.accountId,
      trxAmount: Number(formData.trxAmount),
      trxRef: formData.trxRef,
      trxDescription: formData.trxDescription,
      trxGateway: formData.trxGateway,
      transactionType: formData.transactionType,
      metaData: [],
      createdBy: formData.createdBy
    };

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.post(api_urls.transactions.create_transaction, payload, { headers });
      console.log(response?.data);

      setMessage({ text: 'Transaction submitted successfully. Await approval', type: 'success' });

      setTimeout(() => {
        handleHidePanel();
      }, 2000);
    } catch (error: any) {
      const fallbackMessage =
        error?.response?.data?.message || 'Failed to submit transaction. Try again.';
      setMessage({ text: fallbackMessage, type: 'error' });
    }
  };

  useEffect(() => {
    // Fetch accounts for dropdown
    axios.get(api_urls.accounts.get_current_user_accounts).then(res => setAccounts(res.data));
  }, []);

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
            <div className="sticky top-0 bg-blue-600 text-white flex justify-between items-center px-4 py-3 z-10">
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
                <label htmlFor="accountId" className="block text-xs text-gray-500 mb-1">
                  Account
                </label>
                <select
                  id="accountId"
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleInputChange}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((acc: any) => (
                    <option key={acc.accountId} value={acc.accNumber}>
                      {acc.accName} - {acc.accNumber}
                    </option>
                  ))}
                </select>
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
                  placeholder="My March Savings"
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm bg-[#115DA9] text-white rounded hover:bg-blue-600"
                >
                  Submit Transaction
                </button>
              </div>
            </form>
          </section>
        )}
      />
    </div>
  );
};

export default NewTransactionForm;