import { useNavigate } from 'react-router-dom';
// import { MoneySavingJarIcon, UserListIcon } from 'hugeicons-react';
import Header from '../../client/components/Header';
import { GrTransaction } from 'react-icons/gr';

const adminOptions = [
  // {
  //   name: 'Manage Users',
  //   description: 'Create, edit, or delete user accounts.',
  //   icon: <UserListIcon size={28} />,
  //   url: 'view-users',
  // },
  // {
  //   name: 'Manage Accounts',
  //   description: 'Create or modify savings accounts.',
  //   icon: <MoneySavingJarIcon size={28} />,
  //   url: 'view-accounts',
  // },
  // {
  //   name: 'Manage Loans',
  //   description: 'Review and approve loan applications.',
  //   icon: <FileDollarIcon size={28} />,
  //   url: 'view-loans',
  // },
  {
    name: 'Manage Transactions',
    description: 'Review and track transactions.',
    icon: <GrTransaction size={28} />,
    url: 'view-transactions',
  },
];

const AdminActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <div className="pt-14 px-4 pb-20 overflow-y-auto">
        <div className="my-8">
          <h1 className="text-md font-bold">Admin Actions</h1>
          <p className="text-sm text-gray-500">Manage users, accounts, loans, and transactions.</p>
        </div>

        <div className="grid gap-4">
          {adminOptions.map((option, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center px-4 py-4 border border-gray-200 rounded-2xl shadow-sm bg-gray-50 hover:shadow-md transition duration-150 cursor-pointer"
              onClick={() => navigate(`/${option.url}`)}
            >
              <div className="flex gap-4 items-center">
                <div className="text-[#1a8ca5] bg-teal-100 p-2 rounded-full">{option.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{option.name}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminActions;