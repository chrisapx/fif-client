import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationTabs from '../../components/BottomNavigationTabs';
import Header from '../../components/Header';
import { ArrowRight01Icon } from 'hugeicons-react';
import { api_urls } from '../../../utilities/api_urls';
import { getUserToken, isAuthenticated } from '../../../utilities/AuthCookieManager';
import axios from 'axios';
import { useToast } from '../../../contexts/ToastContext';

interface Beneficiary {
  id: number;
  name: string;
  accountNumber: string;
  accountType: number;
  officeName: string;
  transferLimit: number;
}

const BeneficiaryTransfer: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [savedBeneficiaries, setSavedBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';
  const token = getUserToken();

  const headers = {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': tenant,
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchBeneficiaries = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          api_urls.beneficiaries.list,
          { headers }
        );

        // Fineract returns an array of beneficiaries
        const beneficiariesData = response.data || [];
        setSavedBeneficiaries(beneficiariesData);
      } catch (error: any) {
        console.error('Error fetching beneficiaries:', error);
        showError(error.response?.data?.defaultUserMessage || 'Failed to load beneficiaries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBeneficiaries();
  }, [navigate, showError]);

  const handleBeneficiarySelect = (beneficiary: Beneficiary) => {
    // TODO: Navigate to next step with selected beneficiary
    console.log('Selected beneficiary:', beneficiary);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header title="Transfer to Beneficiary" />

      {/* Breadcrumb Stepper */}
      <div className="flex items-stretch w-full bg-[#f2f4f8] h-[44px] overflow-hidden text-[11px] mt-12">
        {/* To */}
        <div className="flex-1 flex items-center justify-center bg-[#1e2a4a] text-white relative">
          <span className="font-bold relative z-10 pl-2">To</span>
          <div className="absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] border-l-[#1e2a4a] z-30"></div>
        </div>

        {/* From */}
        <div className="flex-1 flex items-center justify-center bg-[#f2f4f8] text-[#666] relative pl-3">
          <span className="font-medium relative z-10">From</span>
          <div className="absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] border-l-[#f2f4f8] z-20"></div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-20"></div>
        </div>

        {/* Amount */}
        <div className="flex-1 flex items-center justify-center bg-[#f2f4f8] text-[#666] relative pl-3">
          <span className="font-medium relative z-10">Amount</span>
          <div className="absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] border-l-[#f2f4f8] z-10"></div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-20"></div>
        </div>

        {/* When */}
        <div className="flex-1 flex items-center justify-center bg-[#f2f4f8] text-[#666] relative pl-3">
          <span className="font-medium relative z-10">When</span>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-20"></div>
        </div>
      </div>

      {/* Beneficiary List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a8ca5] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading beneficiaries...</p>
            </div>
          </div>
        ) : savedBeneficiaries.length === 0 ? (
          <div className="flex items-center justify-center h-64 flex-col gap-4">
            <p className="text-gray-600">No beneficiaries found</p>
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-2 bg-[#1a8ca5] text-white text-sm font-medium rounded-lg hover:bg-[#157582] transition-colors"
            >
              Add Beneficiary
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {savedBeneficiaries.map((beneficiary) => (
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
                  </div>
                  <p className="text-[#888] text-[11px] font-medium mt-0.5 uppercase tracking-wide">
                    {beneficiary.officeName}
                  </p>
                </div>
                <ArrowRight01Icon size={28} className="text-gray-300" />
              </div>
            ))}
          </div>
        )}

        {/* Promo Section */}
        <div className="bg-[#fff7e0] p-4 mt-2 mb-6">
          <h3 className="text-[#007ba8] text-[16px] font-bold leading-tight mb-1">
            We've Got You Covered With FIFund Plus!
          </h3>
          <p className="text-[#555] text-[13px] mb-4">Sign up now to enjoy exclusive benefits.</p>
          <div className="w-full bg-gradient-to-r from-[#00bfff] to-[#1a8ca5] rounded-lg p-4 relative overflow-hidden flex items-center justify-between shadow-sm min-h-[140px]">
            <div className="absolute -right-6 -bottom-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
            <div className="absolute -right-2 -top-10 w-24 h-24 bg-white opacity-10 rounded-full"></div>
            <div className="flex flex-col text-white relative z-10 w-full pl-2">
              <div className="bg-white text-[#0099eb] text-[10px] font-black px-2 py-0.5 mb-1 rounded-sm w-fit uppercase tracking-wider">
                Guaranteed
              </div>
              <div className="text-5xl font-black italic tracking-tighter leading-none mb-1 drop-shadow-md">
                200%
              </div>
              <div className="bg-[#00a651] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm w-fit uppercase tracking-wide">
                Of Sum Assured
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-start">
            <a className="text-[#bfa05f] text-sm font-bold underline decoration-2 underline-offset-2" href="#">
              Apply Now!
            </a>
          </div>
        </div>
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default BeneficiaryTransfer;
