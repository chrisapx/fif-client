import React, { useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { useSearchParams } from 'react-router-dom';
import { Logout05Icon } from 'hugeicons-react';
import { searchParamsVariables } from '../../utilities/UrlParamVariables';
import { InputText } from 'primereact/inputtext';

const mockUser = {
  isAdmin: true,
  groups: ['Family Investment Fund'],
  userId: 'user123',
};

const mockAvailableUsers = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Alice Brown' },
];

const LoanRequestForm = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const panelStatus = searchParams.get(searchParamsVariables.loanRequestPanelOpen);

  const user = mockUser;

  const [formData, setFormData] = useState({
    loanName: '',
    loanAmount: '',
    settlementAccountNumber: '',
    settlementAccountName: '',
    settlementBankBranch: '',
    accGroup: user.groups.length === 1 ? user.groups[0] : '',
    applyForUserId: user.isAdmin ? '' : user.userId,
  });

  const handleHideLoanPanel = () => {
    searchParams.delete(searchParamsVariables.loanRequestPanelOpen);
    setSearchParams(searchParams);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Loan Request Submitted:', formData);
    handleHideLoanPanel();
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
              {user.isAdmin && (
                <div className='px-2 py-3'>
                  <label className='text-xs' htmlFor='applyForUserId'>
                    Apply for User
                  </label>
                  <select
                    id='applyForUserId'
                    name='applyForUserId'
                    value={formData.applyForUserId}
                    onChange={handleInputChange}
                    className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                    required
                  >
                    <option value='' disabled>
                      Select a user
                    </option>
                    {mockAvailableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <label className='text-xs' htmlFor='loanName'>
                  Loan Name
                </label>
                <input
                  id='loanName'
                  name='loanName'
                  type='text'
                  value={formData.loanName}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='e.g., Emergency Loan'
                  required
                />
              </div>
              <div className='px-2 py-3'>
                <label className='text-xs' htmlFor='loanAmount'>
                  Loan Amount
                </label>
                <div className='flex items-center'>
                  <InputText
                    id='loanAmount'
                    name='loanAmount'
                    type='number'
                    prefix='UGX'
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                    placeholder='e.g., 340000'
                    min='0'
                    required
                  />
                </div>
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <label className='text-xs' htmlFor='settlementAccountNumber'>
                  Settlement Account Number
                </label>
                <input
                  id='settlementAccountNumber'
                  name='settlementAccountNumber'
                  type='text'
                  value={formData.settlementAccountNumber}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='Either bank account Number or Mobile money'
                  required
                />
              </div>
              <div className='px-2 py-3'>
                <label className='text-xs' htmlFor='settlementAccountName'>
                  Settlement Account Name
                </label>
                <input
                  id='settlementAccountName'
                  name='settlementAccountName'
                  type='text'
                  value={formData.settlementAccountName}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='e.g., John Doe'
                  required
                />
              </div>
              <div className='px-2 py-3'>
                <label className='text-xs' htmlFor='settlementAccountName'>
                  Settlement Bank Branch
                </label>
                <input
                  id='settlementBankBranch'
                  name='settlementBankBranch'
                  type='text'
                  value={formData.settlementBankBranch}
                  onChange={handleInputChange}
                  className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                  placeholder='e.g., Stanbic Kampala or MoMo or Airtel Money'
                  required
                />
              </div>
              <div className='px-2 py-3 border-y border-gray-200 bg-gray-100'>
                <label className='text-xs' htmlFor='accGroup'>
                  Loan Group [SACCO]
                </label>
                {user.groups.length > 1 ? (
                  <select
                    id='accGroup'
                    name='accGroup'
                    value={formData.accGroup}
                    onChange={handleInputChange}
                    className='w-full text-sm px-2 py-3 border border-gray-300 rounded'
                    required
                  >
                    <option value='' disabled>
                      Select a group
                    </option>
                    {user.groups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id='accGroup'
                    name='accGroup'
                    type='text'
                    value={formData.accGroup}
                    className='w-full text-sm px-2 py-3 border border-gray-300 rounded bg-gray-200'
                    disabled
                  />
                )}
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