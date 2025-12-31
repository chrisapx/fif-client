import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationTabs from '../../components/BottomNavigationTabs';
import Header from '../../components/Header';
import { ArrowRight01Icon } from 'hugeicons-react';
import { api_urls } from '../../../utilities/api_urls';
import { getUserToken, isAuthenticated, getAuthUser } from '../../../utilities/AuthCookieManager';
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
  accountType: number;
}

interface DestinationAccount {
  accountId: number;
  accountNo: string;
  clientId: number;
  clientName: string;
  productName: string;
  accountType: number;
  currency: string;
  status: string;
}

interface Beneficiary {
  id: number;
  name: string;
  officeName: string;
  accountNumber: string;
  accountType: {
    id: number;
    code: string;
    value: string;
  };
  transferLimit: number;
}

const BeneficiaryTransfer: React.FC = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('from');
  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [destinationAccount, setDestinationAccount] = useState<DestinationAccount | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transferReason, setTransferReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRetrieving, setIsRetrieving] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAddBeneficiary, setShowAddBeneficiary] = useState<boolean>(false);
  const [newBeneficiary, setNewBeneficiary] = useState({
    accountNumber: '',
    accountType: '2',
    name: '',
    transferLimit: ''
  });

  // Transfer reasons dropdown options
  const transferReasons = [
    { value: 'payment', label: 'Payment' },
    { value: 'bill_payment', label: 'Bill Payment' },
    { value: 'family_support', label: 'Family Support' },
    { value: 'business', label: 'Business' },
    { value: 'gift', label: 'Gift' },
    { value: 'loan', label: 'Loan' },
    { value: 'refund', label: 'Refund' },
    { value: 'other', label: 'Other' },
  ];

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };

  // Fetch user's accounts and beneficiaries on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const user = getAuthUser();
        const clientId = user?.userId;

        if (!clientId) {
          showError('Client ID not found');
          return;
        }

        // Fetch user accounts
        const accountsResponse = await axios.get(
          api_urls.clients.get_client_accounts(clientId),
          { headers }
        );

        const accountsData = accountsResponse.data || {};
        const accounts: Account[] = [];

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

        // Fetch existing beneficiaries
        try {
          const beneficiariesResponse = await axios.get(
            api_urls.beneficiaries.list,
            { headers }
          );
          setBeneficiaries(beneficiariesResponse.data || []);
        } catch (beneficiaryError) {
          console.warn('No beneficiaries found or error fetching beneficiaries');
          setBeneficiaries([]);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        showError(error.response?.data?.defaultUserMessage || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, showError]);

  const handleAccountSelect = (account: Account) => {
    setFromAccount(account);
    setCurrentStep('to');
  };

  const handleBeneficiarySelect = (beneficiary: Beneficiary) => {
    // Set destination account from selected beneficiary
    setDestinationAccount({
      accountId: 0, // Beneficiary doesn't have accountId directly
      accountNo: beneficiary.accountNumber,
      clientId: 0, // Will be resolved by the API
      clientName: beneficiary.name,
      productName: beneficiary.accountType.value,
      accountType: beneficiary.accountType.id,
      currency: 'UGX',
      status: 'Active'
    });
    setCurrentStep('amount');
  };

  const handleAddNewBeneficiary = async () => {
    if (!newBeneficiary.accountNumber || !newBeneficiary.name) {
      showError('Please provide account number and beneficiary name');
      return;
    }

    if (!newBeneficiary.transferLimit || parseFloat(newBeneficiary.transferLimit) <= 0) {
      showError('Please provide a valid transfer limit');
      return;
    }

    setIsRetrieving(true);
    try {
      // First, fetch the beneficiary template to get account details and officeName
      const templateResponse = await axios.get(
        api_urls.beneficiaries.template,
        { headers }
      );

      const templateData = templateResponse.data;
      let accountDetails = null;

      // Search for the account in accountTypeOptions
      if (templateData.accountTypeOptions) {
        for (const accountTypeOption of templateData.accountTypeOptions) {
          if (accountTypeOption.accountOptions) {
            accountDetails = accountTypeOption.accountOptions.find(
              (acc: any) => acc.accountNo === newBeneficiary.accountNumber
            );
            if (accountDetails) {
              break;
            }
          }
        }
      }

      if (!accountDetails) {
        showError('Account not found. Please verify the account number.');
        setIsRetrieving(false);
        return;
      }

      const beneficiaryPayload = {
        accountNumber: newBeneficiary.accountNumber,
        accountType: parseInt(newBeneficiary.accountType),
        name: newBeneficiary.name,
        officeName: accountDetails.officeName,
        transferLimit: parseFloat(newBeneficiary.transferLimit),
        locale: 'en'
      };

      await axios.post(
        api_urls.beneficiaries.create,
        beneficiaryPayload,
        { headers }
      );

      showSuccess('Beneficiary added successfully');

      // Refresh beneficiaries list
      const beneficiariesResponse = await axios.get(
        api_urls.beneficiaries.list,
        { headers }
      );
      setBeneficiaries(beneficiariesResponse.data || []);

      // Set as destination account
      setDestinationAccount({
        accountId: 0,
        accountNo: newBeneficiary.accountNumber,
        clientId: 0,
        clientName: newBeneficiary.name,
        productName: newBeneficiary.accountType === '2' ? 'Savings Account' : 'Loan Account',
        accountType: parseInt(newBeneficiary.accountType),
        currency: 'UGX',
        status: 'Active'
      });

      // Reset form and hide
      setNewBeneficiary({
        accountNumber: '',
        accountType: '2',
        name: '',
        transferLimit: ''
      });
      setShowAddBeneficiary(false);
      setCurrentStep('amount');
    } catch (error: any) {
      console.error('Error adding beneficiary:', error);
      showError(error.response?.data?.defaultUserMessage || 'Failed to add beneficiary');
    } finally {
      setIsRetrieving(false);
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

      const date = new Date(transferDate);
      const formattedDate = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const transferDescription = description
        ? `${transferReasons.find(r => r.value === transferReason)?.label || transferReason} - ${description}`
        : transferReasons.find(r => r.value === transferReason)?.label || 'Transfer';

      const requestBody = {
        fromOfficeId: 1,
        fromClientId: user?.userId,
        fromAccountType: fromAccount?.accountType,
        fromAccountId: fromAccount?.accountId,
        toOfficeId: 1,
        toClientId: destinationAccount?.clientId,
        toAccountType: destinationAccount?.accountType,
        toAccountId: destinationAccount?.accountId,
        transferDate: formattedDate,
        transferAmount: parseFloat(amount),
        transferDescription: transferDescription,
        dateFormat: 'dd MMMM yyyy',
        locale: 'en'
      };

      // Use TPT transfer endpoint for third-party transfers
      await axios.post(
        api_urls.transfers.create_tpt_transfer,
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
    if (step === 'from') {
      setCurrentStep('from');
    } else if (step === 'to' && fromAccount) {
      setCurrentStep('to');
    } else if (step === 'amount' && fromAccount && destinationAccount) {
      setCurrentStep('amount');
    } else if (step === 'when' && fromAccount && destinationAccount && amount) {
      setCurrentStep('when');
    } else if (step === 'confirm' && fromAccount && destinationAccount && amount && transferDate && transferReason) {
      setCurrentStep('confirm');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header title="Local Transfer" />

      {/* Breadcrumb Stepper */}
      <div className="flex items-stretch w-full bg-[#f2f4f8] h-[44px] overflow-hidden text-[11px] mt-12">
        {/* From */}
        <div
          onClick={() => handleStepClick('from')}
          className={`flex-1 flex items-center justify-center ${currentStep === 'from' ? 'bg-[#1e2a4a] text-white' : (fromAccount ? 'bg-[#1a8ca5] text-white' : 'bg-[#f2f4f8] text-[#666]')} relative cursor-pointer`}
        >
          <span className={`${currentStep === 'from' || fromAccount ? 'font-bold' : 'font-medium'} relative z-10 pl-2`}>From</span>
          <div className={`absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] ${currentStep === 'from' ? 'border-l-[#1e2a4a] z-40' : (fromAccount ? 'border-l-[#1a8ca5] z-40' : 'border-l-[#f2f4f8] z-40')}`}></div>
        </div>

        {/* To */}
        <div
          onClick={() => handleStepClick('to')}
          className={`flex-1 flex items-center justify-center ${currentStep === 'to' ? 'bg-[#1e2a4a] text-white' : (destinationAccount ? 'bg-[#1a8ca5] text-white' : 'bg-[#f2f4f8] text-[#666]')} relative pl-3 cursor-pointer`}
        >
          <span className={`${currentStep === 'to' || destinationAccount ? 'font-bold' : 'font-medium'} relative z-10`}>To</span>
          <div className={`absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] ${currentStep === 'to' ? 'border-l-[#1e2a4a] z-30' : (destinationAccount ? 'border-l-[#1a8ca5] z-30' : 'border-l-[#f2f4f8] z-30')}`}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-30"></div>
        </div>

        {/* Amount */}
        <div
          onClick={() => handleStepClick('amount')}
          className={`flex-1 flex items-center justify-center ${currentStep === 'amount' ? 'bg-[#1e2a4a] text-white' : (amount ? 'bg-[#1a8ca5] text-white' : 'bg-[#f2f4f8] text-[#666]')} relative pl-3 cursor-pointer`}
        >
          <span className={`${currentStep === 'amount' || amount ? 'font-bold' : 'font-medium'} relative z-10`}>Amount</span>
          <div className={`absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] ${currentStep === 'amount' ? 'border-l-[#1e2a4a] z-20' : (amount ? 'border-l-[#1a8ca5] z-20' : 'border-l-[#f2f4f8] z-20')}`}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-20"></div>
        </div>

        {/* When */}
        <div
          onClick={() => handleStepClick('when')}
          className={`flex-1 flex items-center justify-center ${currentStep === 'when' ? 'bg-[#1e2a4a] text-white' : (transferDate && transferReason ? 'bg-[#1a8ca5] text-white' : 'bg-[#f2f4f8] text-[#666]')} relative pl-3 cursor-pointer`}
        >
          <span className={`${currentStep === 'when' || (transferDate && transferReason) ? 'font-bold' : 'font-medium'} relative z-10`}>When</span>
          <div className={`absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] ${currentStep === 'when' ? 'border-l-[#1e2a4a] z-10' : (transferDate && transferReason ? 'border-l-[#1a8ca5] z-10' : 'border-l-[#f2f4f8] z-10')}`}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-20"></div>
        </div>

        {/* Confirm */}
        <div
          onClick={() => handleStepClick('confirm')}
          className={`flex-1 flex items-center justify-center ${currentStep === 'confirm' ? 'bg-[#1e2a4a] text-white' : 'bg-[#f2f4f8] text-[#666]'} relative pl-3 cursor-pointer`}
        >
          <span className={`${currentStep === 'confirm' ? 'font-bold' : 'font-medium'} relative z-10`}>Confirm</span>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-20"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* FROM STAGE */}
        {currentStep === 'from' && (
          <div className="flex flex-col">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="text-sm font-semibold text-gray-700">Select source account</h2>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a8ca5] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading accounts...</p>
                </div>
              </div>
            ) : userAccounts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-600">No active accounts available</p>
              </div>
            ) : (
              userAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => handleAccountSelect(account)}
                  className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                >
                  <div className="shrink-0 w-10 h-10 bg-black rounded flex items-center justify-center relative overflow-hidden">
                    <div className="w-[3px] h-4 bg-[#0099eb] absolute top-2 left-3 transform -skew-x-12"></div>
                    <div className="w-[3px] h-4 bg-[#00a651] absolute bottom-2 right-3 transform -skew-x-12"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#0d121b] text-[15px] font-bold">{account.accountName}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[#666] text-[13px]">{account.accountNo}</span>
                      <span className="text-green-600 text-[10px] font-semibold px-1.5 py-0.5 bg-green-50 rounded-full uppercase tracking-wide">
                        {account.type}
                      </span>
                    </div>
                    <p className="text-[#888] text-[11px] font-medium mt-0.5 uppercase tracking-wide">
                      Balance: {account.currency} {account.balance.toLocaleString()}
                    </p>
                  </div>
                  <ArrowRight01Icon size={28} className="text-gray-300" />
                </div>
              ))
            )}
          </div>
        )}

        {/* TO STAGE */}
        {currentStep === 'to' && (
          <div className="flex flex-col">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                {showAddBeneficiary ? 'Add New Beneficiary' : 'Select Beneficiary'}
              </h2>
              {!showAddBeneficiary && (
                <button
                  onClick={() => setShowAddBeneficiary(true)}
                  className="text-xs text-[#1a8ca5] font-semibold hover:underline"
                >
                  + Add New
                </button>
              )}
            </div>

            {showAddBeneficiary ? (
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={newBeneficiary.accountNumber}
                      onChange={(e) => setNewBeneficiary({...newBeneficiary, accountNumber: e.target.value})}
                      placeholder="Enter account number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Account Type</label>
                    <select
                      value={newBeneficiary.accountType}
                      onChange={(e) => setNewBeneficiary({...newBeneficiary, accountType: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent text-sm"
                    >
                      <option value="2">Savings Account</option>
                      <option value="1">Loan Account</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Beneficiary Name</label>
                    <input
                      type="text"
                      value={newBeneficiary.name}
                      onChange={(e) => setNewBeneficiary({...newBeneficiary, name: e.target.value})}
                      placeholder="Enter beneficiary name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Transfer Limit (UGX)</label>
                    <input
                      type="number"
                      value={newBeneficiary.transferLimit}
                      onChange={(e) => setNewBeneficiary({...newBeneficiary, transferLimit: e.target.value})}
                      placeholder="Enter transfer limit"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent text-sm"
                      step="1000"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowAddBeneficiary(false);
                      setNewBeneficiary({
                        accountNumber: '',
                        accountType: '2',
                        name: '',
                        transferLimit: ''
                      });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNewBeneficiary}
                    disabled={isRetrieving}
                    className="flex-1 bg-[#1a8ca5] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#157582] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRetrieving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      'Add Beneficiary'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                {beneficiaries.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">No beneficiaries found</p>
                      <button
                        onClick={() => setShowAddBeneficiary(true)}
                        className="px-6 py-2 bg-[#1a8ca5] text-white text-sm font-medium rounded-lg hover:bg-[#157582] transition-colors"
                      >
                        Add Your First Beneficiary
                      </button>
                    </div>
                  </div>
                ) : (
                  beneficiaries.map((beneficiary) => (
                    <div
                      key={beneficiary.id}
                      onClick={() => handleBeneficiarySelect(beneficiary)}
                      className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                    >
                      <div className="shrink-0 w-10 h-10 bg-black rounded flex items-center justify-center relative overflow-hidden">
                        <div className="w-[3px] h-4 bg-[#0099eb] absolute top-2 left-3 transform -skew-x-12"></div>
                        <div className="w-[3px] h-4 bg-[#00a651] absolute bottom-2 right-3 transform -skew-x-12"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[#0d121b] text-[15px] font-bold">{beneficiary.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[#666] text-[13px]">{beneficiary.accountNumber}</span>
                          <span className="text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 bg-blue-50 rounded-full uppercase tracking-wide">
                            {beneficiary.accountType.value}
                          </span>
                        </div>
                        <p className="text-[#888] text-[11px] font-medium mt-0.5 uppercase tracking-wide">
                          Limit: UGX {beneficiary.transferLimit.toLocaleString()}
                        </p>
                      </div>
                      <ArrowRight01Icon size={28} className="text-gray-300" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* AMOUNT STAGE */}
        {currentStep === 'amount' && (
          <div className="flex flex-col">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="text-sm font-semibold text-gray-700">Enter transfer amount</h2>
            </div>

            <div className="p-4">
              {/* From Account Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 mb-1">From: <span className="font-bold text-gray-900">{fromAccount?.accountName}</span></p>
                <p className="text-xs text-gray-600">Available Balance: <span className="font-bold text-gray-900">{fromAccount?.currency} {fromAccount?.balance.toLocaleString()}</span></p>
              </div>

              {/* To Account Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 mb-1">To: <span className="font-bold text-gray-900">{destinationAccount?.clientName}</span></p>
                <p className="text-xs text-gray-600">Account: <span className="font-bold text-gray-900">{destinationAccount?.accountNo}</span></p>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Amount ({fromAccount?.currency})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent text-base"
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {fromAccount?.currency} {fromAccount?.balance.toLocaleString()}
                </p>
              </div>

              <button
                onClick={handleAmountSubmit}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full bg-[#1a8ca5] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#157582] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* WHEN STAGE */}
        {currentStep === 'when' && (
          <div className="flex flex-col">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="text-sm font-semibold text-gray-700">Transfer details</h2>
            </div>

            <div className="p-4">
              {/* Transfer Date */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Transfer Date</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  min={today}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent text-sm"
                />
              </div>

              {/* Transfer Reason */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Transfer Reason</label>
                <select
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent text-sm"
                >
                  <option value="">Select a reason</option>
                  {transferReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description/Narration */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a note about this transfer..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a8ca5] focus:border-transparent text-sm resize-none"
                />
              </div>

              <button
                onClick={handleWhenSubmit}
                disabled={!transferDate || !transferReason}
                className="w-full bg-[#1a8ca5] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#157582] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {/* CONFIRM STAGE */}
        {currentStep === 'confirm' && (
          <div className="flex flex-col">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="text-sm font-semibold text-gray-700">Review and confirm</h2>
            </div>

            <div className="p-4">
              {/* Transfer Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex justify-between items-start pb-3 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">From</p>
                    <p className="text-sm font-bold text-gray-900">{fromAccount?.accountName}</p>
                    <p className="text-xs text-gray-600">{fromAccount?.accountNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Balance</p>
                    <p className="text-sm font-bold text-gray-900">{fromAccount?.currency} {fromAccount?.balance.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex justify-between items-start pb-3 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">To</p>
                    <p className="text-sm font-bold text-gray-900">{destinationAccount?.clientName}</p>
                    <p className="text-xs text-gray-600">{destinationAccount?.accountNo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{destinationAccount?.productName}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-bold text-[#1a8ca5]">
                    {fromAccount?.currency} {parseFloat(amount).toLocaleString()}
                  </p>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500">Transfer Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(transferDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500">Reason</p>
                  <p className="text-sm font-medium text-gray-900">
                    {transferReasons.find(r => r.value === transferReason)?.label}
                  </p>
                </div>

                {description && (
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="text-sm text-gray-700 text-right max-w-[60%]">{description}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleTransferSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#1a8ca5] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#157582] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'Confirm Transfer'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default BeneficiaryTransfer;
