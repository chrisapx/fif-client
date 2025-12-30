import { Sidebar } from 'primereact/sidebar';
import { useSearchParams } from 'react-router-dom';
import { searchParamsVariables } from '../../../utilities/UrlParamVariables';
import { decryptParams } from '../../../utilities/EncryptionHelper';
import { Logout05Icon } from 'hugeicons-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { api_urls } from '../../../utilities/api_urls';
import { getUserToken } from '../../../utilities/AuthCookieManager';
import LoanRequestForm from '../forms/LoanRequestForm';

const LoanDetailsPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const panelStatus = searchParams.get(searchParamsVariables.loanDetailsPanelOpen);
  const loan: any = searchParams.get(searchParamsVariables.selectedLoan) !== null && decryptParams(searchParams.get(searchParamsVariables.selectedLoan));

  const [loanDetails, setLoanDetails] = useState<any>(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null);

  // Modal states
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Form states
  const [documentData, setDocumentData] = useState({ name: '', description: '', file: null as File | null });
  const [collateralData, setCollateralData] = useState({ type: '', value: '', description: '' });
  const [noteData, setNoteData] = useState({ note: '' });

  const handleHideLoanPanel = () => {
    searchParams.delete(searchParamsVariables.loanDetailsPanelOpen);
    searchParams.delete(searchParamsVariables.selectedLoan);
    setSearchParams(searchParams);
  };

  const handleOpenLoanRequestForm = () => {
    searchParams.set(searchParamsVariables.loanRequestPanelOpen, '1');
    setSearchParams(searchParams);
  };

  const handleEditLoanApplication = () => {
    searchParams.set(searchParamsVariables.loanRequestPanelOpen, '1');
    searchParams.set(searchParamsVariables.editLoanId, loan.loanId);
    setSearchParams(searchParams);
  };

  const handleWithdrawApplication = async () => {
    if (!window.confirm('Are you sure you want to withdraw this loan application? This action cannot be undone.')) {
      return;
    }

    try {
      const today = new Date();
      const dateFormat = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(today);

      const payload = {
        withdrawnOnDate: dateFormat,
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
      };

      await axios.post(
        api_urls.loans.withdraw_loan(loan.loanId),
        payload,
        { headers }
      );

      setActionMessage({ text: 'Loan application withdrawn successfully', type: 'success' });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error withdrawing loan:', error);
      setActionMessage({
        text: error?.response?.data?.defaultUserMessage || 'Failed to withdraw loan application',
        type: 'error'
      });
    }
  };

  const isPendingLoan = loanDetails?.status?.value?.toLowerCase().includes('pending') ||
                        loanDetails?.status?.value?.toLowerCase().includes('submitted') ||
                        loan?.loanStatus?.toLowerCase().includes('pending') ||
                        loan?.loanStatus?.toLowerCase().includes('submitted');

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('name', documentData.name);
      formData.append('description', documentData.description);
      if (documentData.file) {
        formData.append('file', documentData.file);
      }

      // Note: Fineract document upload requires multipart/form-data
      await axios.post(
        `${api_urls.loans.get_loan(loan.loanId)}/documents`,
        formData,
        {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      setActionMessage({ text: 'Document uploaded successfully', type: 'success' });
      setShowDocumentsModal(false);
      setDocumentData({ name: '', description: '', file: null });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      setActionMessage({
        text: error?.response?.data?.defaultUserMessage || 'Failed to upload document',
        type: 'error'
      });
    }
  };

  const handleAddCollateral = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        type: collateralData.type,
        value: Number(collateralData.value),
        description: collateralData.description,
      };

      await axios.post(
        `${api_urls.loans.get_loan(loan.loanId)}/collaterals`,
        payload,
        { headers }
      );

      setActionMessage({ text: 'Collateral added successfully', type: 'success' });
      setShowCollateralModal(false);
      setCollateralData({ type: '', value: '', description: '' });
    } catch (error: any) {
      console.error('Error adding collateral:', error);
      setActionMessage({
        text: error?.response?.data?.defaultUserMessage || 'Failed to add collateral',
        type: 'error'
      });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        note: noteData.note,
      };

      await axios.post(
        `${api_urls.loans.get_loan(loan.loanId)}/notes`,
        payload,
        { headers }
      );

      setActionMessage({ text: 'Note added successfully', type: 'success' });
      setShowNotesModal(false);
      setNoteData({ note: '' });
    } catch (error: any) {
      console.error('Error adding note:', error);
      setActionMessage({
        text: error?.response?.data?.defaultUserMessage || 'Failed to add note',
        type: 'error'
      });
    }
  };

  const formatDate = (date: Date | number[]) => {
    if (!date) return '--';

    // Handle array format [2025, 12, 26]
    if (Array.isArray(date)) {
      const dateObj = new Date(date[0], date[1] - 1, date[2]);
      return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };

  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (!loan?.loanId || panelStatus !== '1') return;

      setIsLoading(true);
      try {
        const response = await axios.get(
          api_urls.loans.get_loan_with_details(loan.loanId),
          { headers }
        );

        setLoanDetails(response.data);
        setRepaymentSchedule(response.data.repaymentSchedule?.periods || []);
        setRecentTransactions((response.data.transactions || []).slice(0, 5));
      } catch (error) {
        console.error('Error fetching loan details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoanDetails();
  }, [loan?.loanId, panelStatus]);

  return (
    <div>
      <Sidebar
        visible={panelStatus === '1'}
        onHide={handleHideLoanPanel}
        className='w-full'
        content={({ hide }) => (
          <section className='overflow-y-auto'>
            <div className='fixed w-full top-0 right-0 left-0 flex justify-between items-center px-2 py-3 bg-blue-500 text-white'>
              <i className='pi pi-times' onClick={hide} />
              <p>Loan Details</p>
              <Logout05Icon />
            </div>

            <section className='mt-12 mb-16'>
              {isLoading && (
                <div className="p-4 text-center text-gray-500">Loading loan details...</div>
              )}

              {actionMessage && (
                <div
                  className={`mx-2 mt-2 px-3 py-2 text-sm rounded border ${
                    actionMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {actionMessage.text}
                </div>
              )}

              {/* Basic Loan Information */}
              <div className='px-2 py-3'>
                <p className='text-xs'>Loan Name</p>
                <p className='text-sm'>{loan?.loanName || loanDetails?.accountNo || loanDetails?.loanProductName || '--'}</p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Account Number</p>
                <p className='text-sm font-mono'>{loan?.accountNo || loanDetails?.accountNo || '--'}</p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Loan Amount {isPendingLoan ? '(Principal)' : '(Outstanding Balance)'}</p>
                <p className='text-sm'>
                  <span className='text-[8px]'>{loanDetails?.currency?.displaySymbol || 'UGX'} </span>
                  {isPendingLoan
                    ? (loanDetails?.principal || loan?.totalAmount || 0).toLocaleString()
                    : (loanDetails?.loanBalance || loan?.amountUnPaid || 0).toLocaleString()
                  }
                </p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Interest Rate</p>
                <p className='text-sm'>
                  {loanDetails?.interestRatePerPeriod
                    ? `${loanDetails.interestRatePerPeriod}% ${loanDetails?.interestRateFrequencyType?.value || 'per month'}`
                    : '--'}
                </p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Amount Paid</p>
                <p className='text-sm text-green-500'>
                  <span className='text-[8px]'>{loanDetails?.currency?.displaySymbol || 'UGX'} </span>
                  {(loan?.amountPaid || 0).toLocaleString()}
                </p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Outstanding Balance</p>
                <p className='text-sm text-red-500'>
                  <span className='text-[8px]'>{loanDetails?.currency?.displaySymbol || 'UGX'} </span>
                  {(loan?.amountUnPaid || loanDetails?.loanBalance || 0).toLocaleString()}
                </p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Loan Status</p>
                <p className='text-sm underline font-bold'>
                  {loan?.loanStatus?.replace("_", " ") || loanDetails?.status?.value || '--'}
                </p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Disbursed On</p>
                <p className='text-sm'>
                  {formatDate(loanDetails?.timeline?.actualDisbursementDate || loan?.dateDispatched)}
                </p>
              </div>
              <div className='px-2 py-3'>
                <p className='text-xs'>Maturity Date</p>
                <p className='text-sm'>
                  {formatDate(loanDetails?.timeline?.actualMaturityDate || loanDetails?.timeline?.expectedMaturityDate || loan?.maturityDate)}
                </p>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <p className='text-xs'>Number of Repayments</p>
                <p className='text-sm'>
                  {loanDetails?.numberOfRepayments || loanDetails?.termFrequency || '--'}
                </p>
              </div>
              {loanDetails?.inArrears && (
                <div className='px-2 py-3 bg-red-50 border border-red-200'>
                  <p className='text-xs text-red-600'>⚠️ Loan in Arrears</p>
                  <p className='text-sm text-red-700 font-semibold'>Please contact support</p>
                </div>
              )}

              {/* Pending Loan Actions */}
              {isPendingLoan && (
                <div className='mt-4'>
                  <div className='px-2 py-3 bg-orange-50 border border-orange-200'>
                    <p className='text-xs text-orange-600 font-semibold mb-2'>Application Pending Approval</p>
                    <p className='text-xs text-gray-600'>Your loan application is awaiting review. You can manage it below.</p>
                  </div>

                  {/* Action Buttons */}
                  <div className='px-2 py-3 space-y-2'>
                    <button
                      onClick={handleEditLoanApplication}
                      className='w-full px-4 py-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2'
                    >
                      <i className='pi pi-pencil' />
                      Edit Application
                    </button>
                    <button
                      onClick={handleWithdrawApplication}
                      className='w-full px-4 py-3 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-2'
                    >
                      <i className='pi pi-times-circle' />
                      Withdraw Application
                    </button>
                  </div>

                  {/* Additional Actions */}
                  <div className='mt-4'>
                    <div className='px-2 py-2 bg-gray-100 border-b border-gray-300'>
                      <p className='text-sm font-semibold text-gray-700'>Additional Actions</p>
                    </div>

                    <div className='border-b border-gray-200'>
                      <button
                        onClick={() => setShowDocumentsModal(true)}
                        className='w-full px-2 py-3 text-sm text-left hover:bg-gray-50 flex items-center justify-between'
                      >
                        <span className='flex items-center gap-2'>
                          <i className='pi pi-file' />
                          Add Loan Documents
                        </span>
                        <i className='pi pi-angle-right text-gray-400' />
                      </button>
                    </div>

                    <div className='border-b border-gray-200'>
                      <button
                        onClick={() => setShowCollateralModal(true)}
                        className='w-full px-2 py-3 text-sm text-left hover:bg-gray-50 flex items-center justify-between'
                      >
                        <span className='flex items-center gap-2'>
                          <i className='pi pi-shield' />
                          Add Collateral
                        </span>
                        <i className='pi pi-angle-right text-gray-400' />
                      </button>
                    </div>

                    <div className='border-b border-gray-200'>
                      <button
                        onClick={() => setShowNotesModal(true)}
                        className='w-full px-2 py-3 text-sm text-left hover:bg-gray-50 flex items-center justify-between'
                      >
                        <span className='flex items-center gap-2'>
                          <i className='pi pi-comment' />
                          Add Notes
                        </span>
                        <i className='pi pi-angle-right text-gray-400' />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              {recentTransactions.length > 0 && (
                <div className='mt-4'>
                  <div className='px-2 py-3 bg-blue-600 text-white'>
                    <p className='font-semibold'>Recent Transactions (Last 5)</p>
                  </div>
                  {recentTransactions.map((trx: any, index: number) => (
                    <div key={index} className='px-2 py-3 border-b border-gray-100 flex justify-between items-center'>
                      <div>
                        <p className='text-sm font-medium'>
                          {trx.type?.value || '—'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {formatDate(trx.date || trx.submittedOnDate)}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className={`text-sm font-semibold ${trx.type?.disbursement ? 'text-blue-600' : 'text-green-600'}`}>
                          {loanDetails?.currency?.displaySymbol || 'UGX'} {(trx.amount || 0).toLocaleString()}
                        </p>
                        {trx.reversed && (
                          <p className='text-xs text-orange-600'>Reversed</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Repayment Schedule */}
              {repaymentSchedule.length > 0 && (
                <div className='mt-6'>
                  <div className='px-2 py-3 bg-blue-600 text-white'>
                    <p className='font-semibold'>Repayment Schedule</p>
                  </div>
                  <div className='overflow-x-auto'>
                    <table className='w-full text-xs'>
                      <thead className='bg-gray-100'>
                        <tr>
                          <th className='px-2 py-2 text-left'>Period</th>
                          <th className='px-2 py-2 text-left'>Due Date</th>
                          <th className='px-2 py-2 text-right'>Principal</th>
                          <th className='px-2 py-2 text-right'>Interest</th>
                          <th className='px-2 py-2 text-right'>Total</th>
                          <th className='px-2 py-2 text-center'>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repaymentSchedule
                          .filter((period: any) => period.period > 0) // Skip period 0 (disbursement)
                          .map((period: any, index: number) => (
                          <tr key={index} className='border-b border-gray-200'>
                            <td className='px-2 py-2'>{period.period}</td>
                            <td className='px-2 py-2'>{formatDate(period.dueDate)}</td>
                            <td className='px-2 py-2 text-right'>
                              {(period.principalDue || 0).toLocaleString()}
                            </td>
                            <td className='px-2 py-2 text-right'>
                              {(period.interestDue || 0).toLocaleString()}
                            </td>
                            <td className='px-2 py-2 text-right font-semibold'>
                              {(period.totalDueForPeriod || 0).toLocaleString()}
                            </td>
                            <td className='px-2 py-2 text-center'>
                              {period.complete ? (
                                <span className='text-green-600 text-xs'>✓ Paid</span>
                              ) : (
                                <span className='text-orange-600 text-xs'>Pending</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
            <div onClick={handleOpenLoanRequestForm} className='border-t border-gray-200 px-2 py-3 fixed bottom-0 left-0 right-0 w-full pb-4 bg-white'>
              <button className='text-[#115DA9] border-2 border-[#115DA9] px-4 py-2 rounded w-full'>+ Request New Loan</button>
            </div>
          </section>
        )}
      />

      {/* Document Upload Modal */}
      <Sidebar
        visible={showDocumentsModal}
        onHide={() => setShowDocumentsModal(false)}
        className='w-full'
        position='right'
        content={({ hide }) => (
          <div className='h-full flex flex-col'>
            <div className='sticky w-full top-0 flex justify-between items-center px-2 py-3 bg-blue-500 text-white'>
              <i className='pi pi-times cursor-pointer' onClick={hide} />
              <p>Add Loan Documents</p>
              <i className='pi pi-file' />
            </div>
            <form onSubmit={handleAddDocument} className='flex-1 overflow-auto'>
              <div className='px-2 py-3'>
                <label className='text-xs font-semibold mb-2 block'>Document Name</label>
                <input
                  type='text'
                  value={documentData.name}
                  onChange={(e) => setDocumentData({ ...documentData, name: e.target.value })}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='e.g., ID Card, Proof of Income'
                  required
                />
              </div>
              <div className='px-2 py-3 bg-gray-50'>
                <label className='text-xs font-semibold mb-2 block'>Description</label>
                <textarea
                  value={documentData.description}
                  onChange={(e) => setDocumentData({ ...documentData, description: e.target.value })}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='Brief description of the document'
                  rows={3}
                />
              </div>
              <div className='px-2 py-3'>
                <label className='text-xs font-semibold mb-2 block'>Upload File</label>
                <input
                  type='file'
                  onChange={(e) => setDocumentData({ ...documentData, file: e.target.files?.[0] || null })}
                  className='w-full text-sm px-2 py-2 border border-gray-300 rounded'
                  required
                />
                <p className='text-[10px] text-gray-500 mt-1'>Supported formats: PDF, JPG, PNG (Max 5MB)</p>
              </div>
              <div className='px-2 py-3 flex gap-2'>
                <button
                  type='button'
                  onClick={() => setShowDocumentsModal(false)}
                  className='flex-1 px-4 py-3 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 px-4 py-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700'
                >
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        )}
      />

      {/* Collateral Modal */}
      <Sidebar
        visible={showCollateralModal}
        onHide={() => setShowCollateralModal(false)}
        className='w-full'
        position='right'
        content={({ hide }) => (
          <div className='h-full flex flex-col'>
            <div className='sticky w-full top-0 flex justify-between items-center px-2 py-3 bg-blue-500 text-white'>
              <i className='pi pi-times cursor-pointer' onClick={hide} />
              <p>Add Collateral</p>
              <i className='pi pi-shield' />
            </div>
            <form onSubmit={handleAddCollateral} className='flex-1 overflow-auto'>
              <div className='px-2 py-3'>
                <label className='text-xs font-semibold mb-2 block'>Collateral Type</label>
                <select
                  value={collateralData.type}
                  onChange={(e) => setCollateralData({ ...collateralData, type: e.target.value })}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  required
                >
                  <option value=''>Select type</option>
                  <option value='Real Estate'>Real Estate</option>
                  <option value='Vehicle'>Vehicle</option>
                  <option value='Equipment'>Equipment</option>
                  <option value='Inventory'>Inventory</option>
                  <option value='Other'>Other</option>
                </select>
              </div>
              <div className='px-2 py-3 bg-gray-50'>
                <label className='text-xs font-semibold mb-2 block'>Estimated Value (UGX)</label>
                <input
                  type='number'
                  value={collateralData.value}
                  onChange={(e) => setCollateralData({ ...collateralData, value: e.target.value })}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='e.g., 10000000'
                  min='0'
                  required
                />
              </div>
              <div className='px-2 py-3'>
                <label className='text-xs font-semibold mb-2 block'>Description</label>
                <textarea
                  value={collateralData.description}
                  onChange={(e) => setCollateralData({ ...collateralData, description: e.target.value })}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='Provide details about the collateral'
                  rows={4}
                  required
                />
              </div>
              <div className='px-2 py-3 flex gap-2'>
                <button
                  type='button'
                  onClick={() => setShowCollateralModal(false)}
                  className='flex-1 px-4 py-3 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 px-4 py-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700'
                >
                  Add Collateral
                </button>
              </div>
            </form>
          </div>
        )}
      />

      {/* Notes Modal */}
      <Sidebar
        visible={showNotesModal}
        onHide={() => setShowNotesModal(false)}
        className='w-full'
        position='right'
        content={({ hide }) => (
          <div className='h-full flex flex-col'>
            <div className='sticky w-full top-0 flex justify-between items-center px-2 py-3 bg-blue-500 text-white'>
              <i className='pi pi-times cursor-pointer' onClick={hide} />
              <p>Add Note</p>
              <i className='pi pi-comment' />
            </div>
            <form onSubmit={handleAddNote} className='flex-1 overflow-auto'>
              <div className='px-2 py-3'>
                <label className='text-xs font-semibold mb-2 block'>Note</label>
                <textarea
                  value={noteData.note}
                  onChange={(e) => setNoteData({ note: e.target.value })}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='Add any additional information or comments about this loan application'
                  rows={8}
                  required
                />
                <p className='text-[10px] text-gray-500 mt-1'>This note will be visible to loan administrators</p>
              </div>
              <div className='px-2 py-3 flex gap-2'>
                <button
                  type='button'
                  onClick={() => setShowNotesModal(false)}
                  className='flex-1 px-4 py-3 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 px-4 py-3 text-sm bg-blue-600 text-white rounded hover:bg-blue-700'
                >
                  Add Note
                </button>
              </div>
            </form>
          </div>
        )}
      />

      <LoanRequestForm />
    </div>
  );
};

export default LoanDetailsPanel;