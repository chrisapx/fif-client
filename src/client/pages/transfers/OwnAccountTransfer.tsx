import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationTabs from '../../components/BottomNavigationTabs';
import Header from '../../components/Header';
import { ArrowRight01Icon } from 'hugeicons-react';
import { api_urls } from '../../../utilities/api_urls';
import { getUserToken, getAuthUser, isAuthenticated } from '../../../utilities/AuthCookieManager';
import axios from 'axios';
import { useToast } from '../../../contexts/ToastContext';

type Step = 'from' | 'to' | 'amount' | 'when' | 'confirm';

interface Account {
  id: string;
  accountId: number;
  accountNo: string;
  accountName: string;
  balance: number;
  currency: string;
  type: string;
  accountType: number; // 1 = Loan, 2 = Savings
}

const OwnAccountTransfer: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('from');
  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]); // Pre-filled to today
  const [transferReason, setTransferReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Transfer reasons dropdown options
  const transferReasons = [
    { value: 'savings', label: 'Savings' },
    { value: 'bill_payment', label: 'Bill Payment' },
    { value: 'loan_repayment', label: 'Loan Repayment' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'investment', label: 'Investment' },
    { value: 'family_support', label: 'Family Support' },
    { value: 'business', label: 'Business' },
    { value: 'other', label: 'Other' },
  ];

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };

  // Fetch available accounts on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const user = getAuthUser();
        const clientId = user?.userId;

        if (!clientId) {
          showError('Client ID not found');
          setIsLoading(false);
          return;
        }

        // Fetch client accounts
        const response = await axios.get(
          api_urls.clients.get_client_accounts(clientId),
          { headers }
        );

        const accountsData = response.data || {};
        const accounts: Account[] = [];

        // Add savings accounts (accountType = 2)
        if (accountsData.savingsAccounts) {
          const activeSavings = accountsData.savingsAccounts.filter((acc: any) => {
            const status = acc.status?.value?.toLowerCase() || '';
            return status === 'active';
          });

          activeSavings.forEach((acc: any) => {
            accounts.push({
              id: `savings-${acc.id}`,
              accountId: acc.id,
              accountNo: acc.accountNo,
              accountName: acc.productName || acc.savingsProductName || 'Savings Account',
              balance: acc.accountBalance || 0,
              currency: acc.currency?.code || 'UGX',
              type: 'Savings',
              accountType: 2,
            });
          });
        }

        setUserAccounts(accounts);
      } catch (error: any) {
        console.error('Error fetching accounts:', error);
        showError(error.response?.data?.defaultUserMessage || 'Failed to load accounts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [navigate, showError]);

  const handleAccountSelect = (account: Account) => {
    if (currentStep === 'from') {
      setFromAccount(account);
      setCurrentStep('to');
    } else if (currentStep === 'to') {
      if (account.id === fromAccount?.id) {
        showError('Cannot transfer to the same account');
        return;
      }
      setToAccount(account);
      setCurrentStep('amount');
    }
  };

  const handleAmountSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }
    if (fromAccount && numAmount > fromAccount.balance) {
      showError('Insufficient balance');
      return;
    }
    setCurrentStep('when');
  };

  const handleWhenSubmit = () => {
    if (!transferDate) {
      showError('Please select a transfer date');
      return;
    }
    if (!transferReason) {
      showError('Please select a transfer reason');
      return;
    }
    setCurrentStep('confirm');
  };

  const handleTransferSubmit = async () => {
    setIsSubmitting(true);
    try {
      const user = getAuthUser();

      // Convert date from yyyy-mm-dd to dd MMMM yyyy format
      const date = new Date(transferDate);
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Build transfer description from reason and narration
      const transferDescription = description
        ? `${transferReasons.find(r => r.value === transferReason)?.label || transferReason} - ${description}`
        : transferReasons.find(r => r.value === transferReason)?.label || 'Account transfer';

      const requestBody = {
        fromOfficeId: 1,
        fromClientId: user?.userId,
        fromAccountType: fromAccount?.accountType,
        fromAccountId: fromAccount?.accountId,
        toOfficeId: 1,
        toClientId: user?.userId,
        toAccountType: toAccount?.accountType,
        toAccountId: toAccount?.accountId,
        transferDate: formattedDate, // e.g., "01 January 2025"
        transferAmount: parseFloat(amount),
        transferDescription: transferDescription,
        dateFormat: 'dd MMMM yyyy',
        locale: 'en'
      };

      await axios.post(
        api_urls.transfers.create_transfer,
        requestBody,
        { headers }
      );

      showSuccess('Transfer completed successfully!');
      navigate('/home');
    } catch (error: any) {
      console.error('Transfer error:', error);
      showError(error.response?.data?.defaultUserMessage || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepClick = (step: Step) => {
    // Allow navigation to completed steps
    if (step === 'from') {
      setCurrentStep('from');
    } else if (step === 'to' && fromAccount) {
      setCurrentStep('to');
    } else if (step === 'amount' && fromAccount && toAccount) {
      setCurrentStep('amount');
    } else if (step === 'when' && fromAccount && toAccount && amount) {
      setCurrentStep('when');
    } else if (step === 'confirm' && fromAccount && toAccount && amount && transferDate && transferReason) {
      setCurrentStep('confirm');
    }
  };

  const availableAccounts = currentStep === 'to'
    ? userAccounts.filter(acc => acc.id !== fromAccount?.id)
    : userAccounts;

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header title="Transfer Between Accounts" />

      {/* Breadcrumb Stepper */}
      <div className="flex items-stretch w-full bg-[#f2f4f8] h-[44px] overflow-hidden text-[11px] mt-12">
        {/* From */}
        <div
          onClick={() => handleStepClick('from')}
          className={`flex-1 flex items-center justify-center ${currentStep === 'from' ? 'bg-[#1e2a4a] text-white' : (fromAccount ? 'bg-[#1a8ca5] text-white' : 'bg-[#f2f4f8] text-[#666]')} relative cursor-pointer`}
        >
          <span className={`${currentStep === 'from' || fromAccount ? 'font-bold' : 'font-medium'} relative z-10 pl-1`}>From</span>
          <div className={`absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] ${currentStep === 'from' ? 'border-l-[#1e2a4a] z-40' : (fromAccount ? 'border-l-[#1a8ca5] z-40' : 'border-l-[#f2f4f8] z-40')}`}></div>
        </div>

        {/* To */}
        <div
          onClick={() => handleStepClick('to')}
          className={`flex-1 flex items-center justify-center ${currentStep === 'to' ? 'bg-[#1e2a4a] text-white' : (toAccount ? 'bg-[#1a8ca5] text-white' : 'bg-[#f2f4f8] text-[#666]')} relative pl-3 ${fromAccount ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        >
          <span className={`${currentStep === 'to' || toAccount ? 'font-bold' : 'font-medium'} relative z-10`}>To</span>
          <div className={`absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] ${currentStep === 'to' ? 'border-l-[#1e2a4a] z-30' : (toAccount ? 'border-l-[#1a8ca5] z-30' : 'border-l-[#f2f4f8] z-30')}`}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-20"></div>
        </div>

        {/* Amount */}
        <div
          onClick={() => handleStepClick('amount')}
          className={`flex-1 flex items-center justify-center ${currentStep === 'amount' ? 'bg-[#1e2a4a] text-white' : (amount ? 'bg-[#1a8ca5] text-white' : 'bg-[#f2f4f8] text-[#666]')} relative pl-3 ${fromAccount && toAccount ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        >
          <span className={`${currentStep === 'amount' || amount ? 'font-bold' : 'font-medium'} relative z-10`}>Amount</span>
          <div className={`absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] ${currentStep === 'amount' ? 'border-l-[#1e2a4a] z-20' : (amount ? 'border-l-[#1a8ca5] z-20' : 'border-l-[#f2f4f8] z-20')}`}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-20"></div>
        </div>

        {/* When */}
        <div
          onClick={() => handleStepClick('when')}
          className={`flex-1 flex items-center justify-center ${currentStep === 'when' ? 'bg-[#1e2a4a] text-white' : (transferDate ? 'bg-[#1a8ca5] text-white' : 'bg-[#f2f4f8] text-[#666]')} relative pl-3 ${amount ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        >
          <span className={`${currentStep === 'when' || transferDate ? 'font-bold' : 'font-medium'} relative z-10`}>When</span>
          <div className={`absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] ${currentStep === 'when' ? 'border-l-[#1e2a4a] z-10' : (transferDate ? 'border-l-[#1a8ca5] z-10' : 'border-l-[#f2f4f8] z-10')}`}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-20"></div>
        </div>

        {/* Confirm */}
        <div
          onClick={() => handleStepClick('confirm')}
          className={`flex-1 flex items-center justify-center ${currentStep === 'confirm' ? 'bg-[#1e2a4a] text-white' : 'bg-[#f2f4f8] text-[#666]'} relative pl-3 ${transferDate && transferReason ? 'cursor-pointer' : 'cursor-not-allowed'}`}
        >
          <span className={`${currentStep === 'confirm' ? 'font-bold' : 'font-medium'} relative z-10`}>Confirm</span>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-20"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a8ca5] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading accounts...</p>
            </div>
          </div>
        ) : (currentStep === 'from' || currentStep === 'to') && availableAccounts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">No accounts available</p>
          </div>
        ) : currentStep === 'from' || currentStep === 'to' ? (
          <div className="flex flex-col">
            {availableAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => handleAccountSelect(account)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
              >
                <div className="shrink-0 w-9 h-9 bg-gradient-to-br from-[#1a8ca5] to-[#044f5f] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {account.accountName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-[#0d121b] text-[13px] font-bold">{account.accountName}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[#666] text-[11px]">{account.accountNo}</span>
                    <span className="text-[#666] text-[11px] font-medium">{account.currency}</span>
                  </div>
                  <p className="text-[#888] text-[10px] font-medium mt-0.5">
                    Balance: {account.currency} {account.balance.toLocaleString()}
                  </p>
                </div>
                <ArrowRight01Icon size={24} className="text-gray-300" />
              </div>
            ))}
          </div>
        ) : currentStep === 'amount' ? (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Enter Amount</h2>
              <p className="text-sm text-gray-600">
                Available balance: {fromAccount?.currency} {fromAccount?.balance.toLocaleString()}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ({fromAccount?.currency})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent text-lg"
                  min="0"
                  max={fromAccount?.balance}
                  step="0.01"
                />
                {amount && parseFloat(amount) > (fromAccount?.balance || 0) && (
                  <p className="mt-2 text-sm text-red-600">Amount exceeds available balance</p>
                )}
              </div>


              <button
                onClick={handleAmountSubmit}
                className="w-full py-3 bg-[#1a8ca5] text-white font-semibold rounded-lg hover:bg-[#157582] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        ) : currentStep === 'when' ? (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Transfer Details</h2>
              <p className="text-sm text-gray-600">
                Specify when and why you want to make this transfer
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Date
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  min={today}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Default is today, but you can schedule for a future date</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent"
                >
                  <option value="">Select a reason</option>
                  {transferReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Narration (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add additional details about this transfer..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">Additional notes or reference information</p>
              </div>

              <button
                onClick={handleWhenSubmit}
                className="w-full py-3 bg-[#1a8ca5] text-white font-semibold rounded-lg hover:bg-[#157582] transition-colors"
              >
                Continue to Review
              </button>
            </div>
          </div>
        ) : currentStep === 'confirm' ? (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">Confirm Transfer</h2>
              <p className="text-sm text-gray-600">
                Please review the details before confirming
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-600 mb-1">From</p>
                  <p className="text-sm font-bold text-gray-800">{fromAccount?.accountName}</p>
                  <p className="text-xs text-gray-600">{fromAccount?.accountNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-1">Balance</p>
                  <p className="text-sm font-medium text-gray-800">
                    {fromAccount?.currency} {fromAccount?.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">To</p>
                    <p className="text-sm font-bold text-gray-800">{toAccount?.accountName}</p>
                    <p className="text-xs text-gray-600">{toAccount?.accountNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 mb-1">Balance</p>
                    <p className="text-sm font-medium text-gray-800">
                      {toAccount?.currency} {toAccount?.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">Amount</p>
                  <p className="text-lg font-bold text-[#1a8ca5]">
                    {fromAccount?.currency} {parseFloat(amount).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">Transfer Date</p>
                  <p className="text-sm text-gray-800">
                    {new Date(transferDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">Reason</p>
                  <p className="text-sm text-gray-800">
                    {transferReasons.find(r => r.value === transferReason)?.label || transferReason}
                  </p>
                </div>
              </div>

              {description && (
                <div className="border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Narration</p>
                    <p className="text-sm text-gray-800">{description}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleTransferSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-[#1a8ca5] text-white font-semibold rounded-lg hover:bg-[#157582] transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Transfer'}
            </button>
          </div>
        ) : null}
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default OwnAccountTransfer;
