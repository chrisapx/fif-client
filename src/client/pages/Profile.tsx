import Header from "../components/Header";
import BottomNavigationTabs from "../components/BottomNavigationTabs";
import { getAuthUser, getUserToken, getAvailableAccounts } from "../../utilities/AuthCookieManager";
import { useState, useEffect } from "react";
import axios from "axios";
import { api_urls } from "../../utilities/api_urls";

const Profile = () => {
  const user = getAuthUser();
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [accounts, setAccounts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const availableAccounts = getAvailableAccounts();

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!user?.userId) return;

      setIsLoading(true);
      try {
        // Fetch client details
        const clientResponse = await axios.get(
          api_urls.clients.get_client_by_id(user.userId),
          { headers }
        );
        setClientDetails(clientResponse.data);

        // Fetch accounts
        const accountsResponse = await axios.get(
          api_urls.clients.get_client_accounts(user.userId),
          { headers }
        );
        setAccounts(accountsResponse.data);
      } catch (error) {
        console.error('Error fetching client details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientDetails();
  }, [user?.userId]);

  const formatDate = (dateArray: number[]) => {
    if (!dateArray || !Array.isArray(dateArray)) return '—';
    const date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="pt-14 flex-1 flex items-center justify-center text-gray-500">
          No profile information found.
        </div>
        <BottomNavigationTabs />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="pt-14 px-3 flex-1 bg-gray-50 pb-16">
        {isLoading && (
          <div className="text-center py-8 text-gray-500">Loading profile...</div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
              {(clientDetails?.displayName || user.firstName)?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">
                {clientDetails?.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'}
              </p>
              <p className="text-sm text-gray-500">{clientDetails?.accountNo || user.email || '—'}</p>
              <p className={`text-xs font-semibold mt-1 ${clientDetails?.status?.active ? 'text-green-600' : 'text-gray-500'}`}>
                {clientDetails?.status?.value || 'Status Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Savings</p>
              <p className="text-lg font-bold text-blue-600">{accounts?.savingsAccounts?.length || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Loans</p>
              <p className="text-lg font-bold text-green-600">{accounts?.loanAccounts?.length || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Shares</p>
              <p className="text-lg font-bold text-purple-600">{accounts?.shareAccounts?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="font-medium text-gray-800">{clientDetails?.displayName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Client ID</p>
              <p className="font-medium text-gray-800">{clientDetails?.id || user.userId || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Account Number</p>
              <p className="font-medium text-gray-800">{clientDetails?.accountNo || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Office</p>
              <p className="font-medium text-gray-800">{clientDetails?.officeName || user.officeName || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email Address</p>
              <p className="font-medium text-gray-800">{clientDetails?.emailAddress || user.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Mobile Number</p>
              <p className="font-medium text-gray-800">{clientDetails?.mobileNo || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gender</p>
              <p className="font-medium text-gray-800">{clientDetails?.gender?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date of Birth</p>
              <p className="font-medium text-gray-800">{formatDate(clientDetails?.dateOfBirth) || '—'}</p>
            </div>
            {clientDetails?.externalId && (
              <div>
                <p className="text-xs text-gray-500">External ID</p>
                <p className="font-medium text-gray-800">{clientDetails.externalId}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Client Type</p>
              <p className="font-medium text-gray-800">{clientDetails?.clientType?.name || 'Individual'}</p>
            </div>
          </div>
        </div>

        {/* Account Access Information */}
        {availableAccounts.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Linked Accounts</h3>
            <p className="text-xs text-gray-600 mb-3">You have access to {availableAccounts.length} client accounts</p>
            {availableAccounts.map((acc: any, index: number) => (
              <div key={index} className={`p-3 mb-2 rounded-lg ${user.selectedAccountIndex === index ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                <p className="text-sm font-medium">{acc.displayName}</p>
                <p className="text-xs text-gray-500">{acc.accountNo}</p>
                {user.selectedAccountIndex === index && (
                  <span className="text-xs text-blue-600 font-semibold">Currently Active</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timeline Information */}
        {clientDetails?.timeline && (
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Submitted On</span>
                <span className="text-xs font-medium">{formatDate(clientDetails.timeline.submittedOnDate)}</span>
              </div>
              {clientDetails.timeline.activatedOnDate && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Activated On</span>
                  <span className="text-xs font-medium">{formatDate(clientDetails.timeline.activatedOnDate)}</span>
                </div>
              )}
              {clientDetails.timeline.activatedByUsername && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Activated By</span>
                  <span className="text-xs font-medium">{clientDetails.timeline.activatedByUsername}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default Profile;