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

const NewAdminCreateAccountForm: React.FC = () => {
    const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const panelStatus = searchParams.get(searchParamsVariables.newCreateAccountByAdminPanelOpen);

  const isAdmin = user?.roles?.includes('ADMIN');

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [accountTypes, setAccountTypes] = useState<any[]>([]);

  const [message, setMessage] = useState<IMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    accName: '',
    commitmentAmount: '',
    userId: user?.userId || '',
    accEmail: user?.email || '',
    accPhone: user?.phone || '',
    accBranch: '',
    accType: '',
    createdBy: user?.userId ?? '',
    approvedBy: user?.userId ?? '',
  });

  const handleHidePanel = () => {
    searchParams.delete(searchParamsVariables.newCreateAccountByAdminPanelOpen);
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

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedUser = availableUsers.find(u => u.userId === selectedId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        userId: selectedId,
        accEmail: selectedUser.email,
        accPhone: selectedUser.phone,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await axios.post(api_urls.accounts.create_bank_account, formData, { headers });
      console.log(response?.data)

      setMessage({
        text: 'Account being set up. You may refresh later to check status.',
        type: 'success',
      });

      setTimeout(() => {
        handleHidePanel();
      }, 2000);
    } catch (error: any) {
      const fallbackMessage =
        error?.response?.data?.message || 'Failed to create account. Try again.';
      setMessage({ text: fallbackMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      axios.get(api_urls.users.get_users).then(res => setAvailableUsers(res.data));
    }
    axios.get(api_urls.templates.get_account_branches).then(res => setBranches(res.data));
    setAccountTypes(['IL_SAVINGS', 'IL_INVESTMENTS']);
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

              {isAdmin && (
                <div className="mb-4">
                  <label htmlFor="userId" className="block text-xs text-gray-500 mb-1">
                    Select User
                  </label>
                  <select
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={handleUserChange}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                    required
                  >
                    <option value="">Choose a user</option>
                    {availableUsers.map(u => (
                      <option key={u.userId} value={u.userId}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
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
                  disabled={isSubmitting}
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
                    'Submit Application'
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

export default NewAdminCreateAccountForm;