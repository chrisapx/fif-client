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
  const [depositProof, setDepositProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    accountId: '',
    trxAmount: '',
    trxRef: '',
    trxDescription: '',
    trxGateway: 'MOBILE_MONEY',
    transactionType: 'DEPOSIT',
    createdBy: user?.userId || '',
  });

  const handleHidePanel = () => {
    searchParams.delete(searchParamsVariables.newTransactionPanelOpen);
    setSearchParams(searchParams);
    setMessage(null);
    setDepositProof(null);
    setProofPreview(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: 'File size must be less than 5MB', type: 'error' });
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setMessage({ text: 'Only images (JPEG, PNG, WebP) and PDF files are allowed', type: 'error' });
        return;
      }

      setDepositProof(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProofPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setProofPreview(null);
      }
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
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Get the selected account details
      const selectedAccount = accounts.find(acc => acc.accountId === formData.accountId);

      if (!selectedAccount) {
        setMessage({ text: 'Please select a valid account', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Require deposit proof for deposits
      if (formData.transactionType === 'DEPOSIT' && !depositProof) {
        setMessage({ text: 'Please upload deposit proof (receipt or screenshot)', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      // Format date as required by Fineract (dd MMMM yyyy)
      const today = new Date();
      const dateFormat = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(today);

      // Determine the endpoint based on transaction type
      const isDeposit = formData.transactionType === 'DEPOSIT';
      const endpoint = isDeposit
        ? api_urls.transactions.deposit(selectedAccount.accountId)
        : api_urls.transactions.withdrawal(selectedAccount.accountId);

      // Map gateway to payment type
      let paymentTypeId = 1; // Default to CASH
      if (formData.trxGateway === 'MOBILE_MONEY') paymentTypeId = 2;
      else if (formData.trxGateway === 'BANK_TRANSFER') paymentTypeId = 3;

      // Build note with all transaction details
      const detailedNote = `
Self-Reported Transaction
Gateway: ${formData.trxGateway}
Reference: ${formData.trxRef}
Description: ${formData.trxDescription}
${depositProof ? `Proof: ${depositProof.name}` : ''}
      `.trim();

      // Fineract transaction payload
      const payload = {
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        transactionDate: dateFormat,
        transactionAmount: Number(formData.trxAmount),
        paymentTypeId: paymentTypeId,
        note: detailedNote,
        accountNumber: selectedAccount.accNumber,
        checkNumber: formData.trxRef || '',
        routingCode: '',
        receiptNumber: formData.trxRef || '',
        bankNumber: ''
      };

      console.log('Submitting transaction:', payload);

      const response = await axios.post(endpoint, payload, { headers });
      console.log('Transaction response:', response?.data);

      // TODO: Upload deposit proof as document/attachment if API supports it
      // This would require additional Fineract document upload endpoint
      if (depositProof) {
        console.log('Deposit proof to upload:', depositProof.name);
        // Future: Upload to document storage or Fineract documents endpoint
      }

      setMessage({
        text: isDeposit
          ? 'Deposit submitted successfully! Awaiting admin verification.'
          : 'Withdrawal request submitted successfully!',
        type: 'success'
      });

      // Reset form
      setFormData({
        accountId: '',
        trxAmount: '',
        trxRef: '',
        trxDescription: '',
        trxGateway: 'MOBILE_MONEY',
        transactionType: 'DEPOSIT',
        createdBy: user?.userId || '',
      });
      setDepositProof(null);
      setProofPreview(null);

      setTimeout(() => {
        handleHidePanel();
        window.location.reload(); // Refresh to show updated transactions
      }, 2500);
    } catch (error: any) {
      console.error('Transaction error:', error);
      const fallbackMessage =
        error?.response?.data?.defaultUserMessage ||
        error?.response?.data?.errors?.[0]?.defaultUserMessage ||
        error?.message ||
        'Failed to submit transaction. Please try again.';
      setMessage({ text: fallbackMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Fetch accounts for dropdown
    const fetchAccounts = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('authUser') || '{}');
        const clientId = userData.userId;

        if (!clientId) return;

        const response = await axios.get(
          api_urls.clients.get_client_accounts(clientId),
          { headers }
        );

        const accountsData = response.data || {};

        // Extract savings accounts
        if (accountsData.savingsAccounts && Array.isArray(accountsData.savingsAccounts)) {
          const savingsAccounts = accountsData.savingsAccounts
            .filter((acc: any) => acc.status?.active) // Only show active accounts
            .map((acc: any) => ({
              accountId: acc.id.toString(), // Convert to string to match form value type
              accNumber: acc.accountNo,
              accName: acc.productName || acc.savingsProductName,
              accBalance: acc.accountBalance || 0,
              accStatus: acc.status?.value || 'Unknown'
            }));
          setAccounts(savingsAccounts);
        } else {
          setAccounts([]);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setAccounts([]);
      }
    };

    fetchAccounts();
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
                    <option key={acc.accountId} value={acc.accountId}>
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

              {/* Deposit Proof Upload */}
              {formData.transactionType === 'DEPOSIT' && (
                <div className="mb-4">
                  <label htmlFor="depositProof" className="block text-xs text-gray-500 mb-1">
                    Deposit Proof (Required) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="depositProof"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Upload receipt or screenshot (Max 5MB, JPEG/PNG/PDF)
                  </p>

                  {proofPreview && (
                    <div className="mt-2">
                      <img
                        src={proofPreview}
                        alt="Deposit proof preview"
                        className="max-w-full h-auto max-h-40 rounded border border-gray-200"
                      />
                    </div>
                  )}

                  {depositProof && !proofPreview && (
                    <div className="mt-2 text-xs text-green-600">
                      ✓ {depositProof.name} selected
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="trxGateway" className="block text-xs text-gray-500 mb-1">
                    Payment Gateway
                  </label>
                  <select
                    id="trxGateway"
                    name="trxGateway"
                    value={formData.trxGateway}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                    required
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
                  >
                    <option value="">Select type</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAW">Withdrawal</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-xs text-blue-700">
                <p className="font-semibold mb-1">ℹ️ Self-Reported Transaction</p>
                <p>
                  This transaction will be submitted for admin verification.
                  {formData.transactionType === 'DEPOSIT' && ' Please ensure you upload valid deposit proof.'}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleHidePanel}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm bg-[#115DA9] text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

export default NewTransactionForm;
// username: ${MAIL_USERNAME:idmdatacorp@gmail.com} 17 -      password: ${MAIL_PASSWORD:vkqpzpbrkcixonjf}