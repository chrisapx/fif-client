// import React, { useState, useEffect } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import { Sidebar } from 'primereact/sidebar';
// import { FileDollarIcon, MoneySavingJarIcon, UserListIcon } from 'hugeicons-react';
// import Header from '../components/Header';
// import { searchParamsVariables } from '../utilities/UrlParamVariables';
// import { getAuthUser, getUserToken } from '../utilities/AuthCookieManager';
// import axios from 'axios';
// import { api_urls } from '../utilities/api_urls';
// import { BsFileCheck } from 'react-icons/bs';

// const user = getAuthUser();
// const token = getUserToken();

// interface IMessage {
//   text: string;
//   type: 'error' | 'success' | 'warn';
// }

// const adminOptions = [
//   {
//     name: 'Manage Users',
//     description: 'Create, edit, or delete user accounts.',
//     icon: <UserListIcon size={28} />,
//     action: 'manage-users',
//   },
//   {
//     name: 'Manage Accounts',
//     description: 'Create or modify savings accounts.',
//     icon: <MoneySavingJarIcon size={28} />,
//     action: 'manage-accounts',
//   },
//   {
//     name: 'Manage Loans',
//     description: 'Review and approve loan applications.',
//     icon: <FileDollarIcon size={28} />,
//     action: 'manage-loans',
//   },
//   {
//     name: 'Approve Transactions',
//     description: 'Review and approve pending transactions.',
//     icon: <BsFileCheck size={28} />,
//     action: 'approve-transactions',
//   },
// ];

// const AdminActions: React.FC = () => {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const [users, setUsers] = useState<any[]>([]);
//   const [accounts, setAccounts] = useState<any[]>([]);
//   const [loans, setLoans] = useState<any[]>([]);
//   const [transactions, setTransactions] = useState<any[]>([]);
//   const [message, setMessage] = useState<IMessage | null>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [formData, setFormData] = useState({
//     userId: '',
//     accountId: '',
//     loanId: '',
//     transactionId: '',
//     actionType: '',
//     status: '',
//     name: '',
//     email: '',
//     accName: '',
//     accType: 'SAVINGS',
//     loanAmount: '',
//     loanDuration: '',
//   });

//   const handleOptionClick = (action: string) => {
//     switch (action) {
//       case 'manage-users':
//         searchParams.set(searchParamsVariables.adminUserPanelOpen, '1');
//         break;
//       case 'manage-accounts':
//         searchParams.set(searchParamsVariables.adminAccountPanelOpen, '1');
//         break;
//       case 'manage-loans':
//         searchParams.set(searchParamsVariables.adminLoanPanelOpen, '1');
//         break;
//       case 'approve-transactions':
//         searchParams.set(searchParamsVariables.adminTransactionPanelOpen, '1');
//         break;
//       default:
//         break;
//     }
//     setSearchParams(searchParams);
//   };

//   const handleHidePanel = (panel: string) => {
//     searchParams.delete(panel);
//     setSearchParams(searchParams);
//     setMessage(null);
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent, actionType: string) => {
//     e.preventDefault();
//     setMessage(null);
//     setIsLoading(true);

//     const headers = {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     };

//     try {
//       let response;
//       switch (actionType) {
//         case 'user':
//           response = await axios.post(api_urls.users.create_user, {
//             name: formData.name,
//             email: formData.email,
//             createdBy: user?.userId,
//           }, { headers });
//           setMessage({ text: 'User created successfully.', type: 'success' });
//           break;
//         case 'account':
//           response = await axios.post(api_urls.accounts.create_account, {
//             userId: formData.userId,
//             accName: formData.accName,
//             accType: formData.accType,
//             createdBy: user?.userId,
//           }, { headers });
//           setMessage({ text: 'Account created successfully.', type: 'success' });
//           break;
//         case 'loan':
//           response = await axios.post(api_urls.accounts.update_loan, {
//             loanId: formData.loanId,
//             status: formData.status,
//             updatedBy: user?.userId,
//           }, { headers });
//           setMessage({ text: 'Loan status updated.', type: 'success' });
//           break;
//         case 'transaction':
//           response = await axios.post(api_urls.transactions.update_transaction, {
//             transactionId: formData.transactionId,
//             status: formData.status,
//             updatedBy: user?.userId,
//           }, { headers });
//           setMessage({ text: 'Transaction status updated.', type: 'success' });
//           break;
//       }

//       setTimeout(() => {
//         handleHidePanel(searchParamsVariables[`admin${actionType.charAt(0).toUpperCase() + actionType.slice(1)}PanelOpen`]);
//       }, 2000);
//     } catch (error: any) {
//       const fallbackMessage = error?.response?.data?.message || `Failed to process ${actionType}. Try again.`;
//       setMessage({ text: fallbackMessage, type: 'error' });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     const fetchData = async () => {
//       setIsLoading(true);
//       try {
//         const [usersRes, accountsRes, loansRes, transactionsRes] = await Promise.allSettled([
//           axios.get(api_urls.users.get_users, { headers: { Authorization: `Bearer ${token}` } }),
//           axios.get(api_urls.accounts.get_all_accounts, { headers: { Authorization: `Bearer ${token}` } }),
//           axios.get(api_urls.accounts.get_all_loans, { headers: { Authorization: `Bearer ${token}` } }),
//           axios.get(api_urls.transactions.get_all_transactions, { headers: { Authorization: `Bearer ${token}` } }),
//         ]);

//         if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
//         if (accountsRes.status === 'fulfilled') setAccounts(accountsRes.value.data);
//         if (loansRes.status === 'fulfilled') setLoans(loansRes.value.data);
//         if (transactionsRes.status === 'fulfilled') setTransactions(transactionsRes.value.data);
//       } catch (error) {
//         setMessage({ text: 'Failed to load data.', type: 'error' });
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   return (
//     <div className="flex flex-col min-h-screen bg-white">
//       <Header />
//       {isLoading && (
//         <span className="relative block w-full h-1.5 bg-blue-100 overflow-hidden rounded-full">
//           <span className="absolute top-0 left-0 h-1.5 w-48 bg-blue-600 animate-loaderSlide rounded-full"></span>
//         </span>
//       )}
//       <div className="pt-14 px-4 pb-20 overflow-y-auto">
//         <div className="my-8">
//           <h1 className="text-md font-bold">Admin Actions</h1>
//           <p className="text-sm text-gray-500">Manage users, accounts, loans, and transactions.</p>
//         </div>

//         <div className="grid gap-4">
//           {adminOptions.map((option, idx) => (
//             <div
//               key={idx}
//               className="flex justify-between items-center px-4 py-4 border border-gray-200 rounded-2xl shadow-sm bg-gray-50 hover:shadow-md transition duration-150 cursor-pointer"
//               onClick={() => handleOptionClick(option.action)}
//             >
//               <div className="flex gap-4 items-center">
//                 <div className="text-blue-600 bg-blue-100 p-2 rounded-full">{option.icon}</div>
//                 <div>
//                   <p className="text-sm font-semibold text-gray-700">{option.name}</p>
//                   <p className="text-xs text-gray-500">{option.description}</p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* User Management Panel */}
//       <Sidebar
//         visible={searchParams.get(searchParamsVariables.adminUserPanelOpen) === '1'}
//         onHide={() => handleHidePanel(searchParamsVariables.adminUserPanelOpen)}
//         className="w-full"
//         content={({ hide }) => (
//           <section className="overflow-auto">
//             <div className="sticky top-0 bg-blue-600 text-white flex justify-between items-center px-4 py-3 z-10">
//               <i className="pi pi-times text-lg" onClick={hide}></i>
//               <p className="text-sm font-semibold">Manage Users</p>
//               <div></div>
//             </div>
//             <form onSubmit={(e) => handleSubmit(e, 'user')} className="px-4 pb-10 pt-2">
//               {message && (
//                 <div
//                   className={`mb-4 px-3 py-2 text-sm rounded border ${
//                     message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
//                   }`}
//                 >
//                   {message.text}
//                 </div>
//               )}
//               <div className="mb-4">
//                 <label htmlFor="name" className="block text-xs text-gray-500 mb-1">Name</label>
//                 <input
//                   type="text"
//                   id="name"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleInputChange}
//                   placeholder="Enter full name"
//                   className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
//                   required
//                 />
//               </div>
//               <div className="mb-4">
//                 <label htmlFor="email" className="block text-xs text-gray-500 mb-1">Email</label>
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   placeholder="Enter email"
//                   className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
//                   required
//                 />
//               </div>
//               <div className="flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={() => handleHidePanel(searchParamsVariables.adminUserPanelOpen)}
//                   className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-6 py-2 text-sm bg-[#115DA9] text-white rounded hover:bg-blue-600"
//                 >
//                   Create User
//                 </button>
//               </div>
//             </form>
//           </section>
//         )}
//       />

//       {/* Account Management Panel */}
//       <Sidebar
//         visible={searchParams.get(searchParamsVariables.adminAccountPanelOpen) === '1'}
//         onHide={() => handleHidePanel(searchParamsVariables.adminAccountPanelOpen)}
//         className="w-full"
//         content={({ hide }) => (
//           <section className="overflow-auto">
//             <div className="sticky top-0 bg-blue-600 text-white flex justify-between items-center px-4 py-3 z-10">
//               <i className="pi pi-times text-lg" onClick={hide}></i>
//               <p className="text-sm font-semibold">Manage Accounts</p>
//               <div></div>
//             </div>
//             <form onSubmit={(e) => handleSubmit(e, 'account')} className="px-4 pb-10 pt-2">
//               {message && (
//                 <div
//                   className={`mb-4 px-3 py-2 text-sm rounded border ${
//                     message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
//                   }`}
//                 >
//                   {message.text}
//                 </div>
//               )}
//               <div className="mb-4">
//                 <label htmlFor="userId" className="block text-xs text-gray-500 mb-1">User</label>
//                 <select
//                   id="userId"
//                   name="userId"
//                   value={formData.userId}
//                   onChange={handleInputChange}
//                   className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
//                   required
//                 >
//                   <option value="">Select user</option>
//                   {users.map((u: any) => (
//                     <option key={u.userId} value={u.userId}>{u.name} - {u.email}</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="mb-4">
//                 <label htmlFor="accName" className="block text-xs text-gray-500 mb-1">Account Name</label>
//                 <input
//                   type="text"
//                   id="accName"
//                   name="accName"
//                   value={formData.accName}
//                   onChange={handleInputChange}
//                   placeholder="Enter account name"
//                   className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
//                   required
//                 />
//               </div>
//               <div className="mb-4">
//                 <label htmlFor="accType" className="block text-xs text-gray-500 mb-1">Account Type</label>
//                 <select
//                   id="accType"
//                   name="accType"
//                   value={formData.accType}
//                   onChange={handleInputChange}
//                   className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
//                   required
//                 >
//                   <option value="SAVINGS">Savings</option>
//                   <option value="CHECKING">Checking</option>
//                 </select>
//               </div>
//               <div className="flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={() => handleHidePanel(searchParamsVariables.adminAccountPanelOpen)}
//                   className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-6 py-2 text-sm bg-[#115DA9] text-white rounded hover:bg-blue-600"
//                 >
//                   Create Account
//                 </button>
//               </div>
//             </form>
//           </section>
//         )}
//       />

//       {/* Loan Management Panel */}
//       <Sidebar
//         visible={searchParams.get(searchParamsVariables.adminLoanPanelOpen) === '1'}
//         onHide={() => handleHidePanel(searchParamsVariables.adminLoanPanelOpen)}
//         className="w-full"
//         content={({ hide }) => (
//           <section className="overflow-auto">
//             <div className="sticky top-0 bg-blue-600 text-white flex justify-between items-center px-4 py-3 z-10">
//               <i className="pi pi-times text-lg" onClick={hide}></i>
//               <p className="text-sm font-semibold">Manage Loans</p>
//               <div></div>
//             </div>
//             <form onSubmit={(e) => handleSubmit(e, 'loan')} className="px-4 pb-10 pt-2">
//               {message && (
//                 <div
//                   className={`mb-4 px-3 py-2 text-sm rounded border ${
//                     message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
//                   }`}
//                 >
//                   {message.text}
//                 </div>
//               )}
//               <div className="mb-4">
//                 <label htmlFor="loanId" className="block text-xs text-gray-500 mb-1">Loan</label>
//                 <select
//                   id="loanId"
//                   name="loanId"
//                   value={formData.loanId}
//                   onChange={handleInputChange}
//                   className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
//                   required
//                 >
//                   <option value="">Select loan</option>
//                   {loans.map((ln: any) => (
//                     <option key={ln.loanId} value={ln.loanId}>{ln.loanName} - UGX {ln.amountUnPaid.toLocaleString()}</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="mb-4">
//                 <label htmlFor="status" className="block text-xs text-gray-500 mb-1">Status</label>
//                 <select
//                   id="status"
//                   name="status"
//                   value={formData.status}
//                   onChange={handleInputChange}
//                   className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
//                   required
//                 >
//                   <option value="">Select status</option>
//                   <option value="APPROVED">Approved</option>
//                   <option value="REJECTED">Rejected</option>
//                   <option value="PENDING">Pending</option>
//                 </select>
//               </div>
//               <div className="flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={() => handleHidePanel(searchParamsVariables.adminLoanPanelOpen)}
//                   className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-6 py-2 text-sm bg-[#115DA9] text-white rounded hover:bg-blue-600"
//                 >
//                   Update Loan
//                 </button>
//               </div>
//             </form>
//           </section>
//         )}
//       />

//       {/* Transaction Approval Panel */}
//       <Sidebar
//         visible={searchParams.get(searchParamsVariables.adminTransactionPanelOpen) === '1'}
//         onHide={() => handleHidePanel(searchParamsVariables.adminTransactionPanelOpen)}
//         className="w-full"
//         content={({ hide }) => (
//           <section className="overflow-auto">
//             <div className="sticky top-0 bg-blue-600 text-white flex justify-between items-center px-4 py-3 z-10">
//               <i className="pi pi-times text-lg" onClick={hide}></i>
//               <p className="text-sm font-semibold">Approve Transactions</p>
//               <div></div>
//             </div>
//             <form onSubmit={(e) => handleSubmit(e, 'transaction')} className="px-4 pb-10 pt-2">
//               {message && (
//                 <div
//                   className={`mb-4 px-3 py-2 text-sm rounded border ${
//                     message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
//                   }`}
//                 >
//                   {message.text}
//                 </div>
//               )}
//               <div className="mb-4">
//                 <label htmlFor="transactionId" className="block text-xs text-gray-500 mb-1">Transaction</label>
//                 <select
//                   id="transactionId"
//                   name="transactionId"
//                   value={formData.transactionId}
//                   onChange={handleInputChange}
//                   className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
//                   required
//                 >
//                   <option value="">Select transaction</option>
//                   {transactions.map((trx: any) => (
//                     <option key={trx.transactionId} value={trx.transactionId}>
//                       {trx.trxRef} - UGX {trx.trxAmount.toLocaleString()}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div className="mb-4">
//                 <label htmlFor="status" className="block text-xs text-gray-500 mb-1">Status</label>
//                 <select
//                   id="status"
//                   name="status"
//                   value={formData.status}
//                   onChange={handleInputChange}
//                   className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
//                   required
//                 >
//                   <option value="">Select status</option>
//                   <option value="APPROVED">Approved</option>
//                   <option value="REJECTED">Rejected</option>
//                   <option value="PENDING">Pending</option>
//                 </select>
//               </div>
//               <div className="flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={() => handleHidePanel(searchParamsVariables.adminTransactionPanelOpen)}
//                   className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-6 py-2 text-sm bg-[#115DA9] text-white rounded hover:bg-blue-600"
//                 >
//                   Update Transaction
//                 </button>
//               </div>
//             </form>
//           </section>
//         )}
//       />
//     </div>
//   );
// };

// export default AdminActions;