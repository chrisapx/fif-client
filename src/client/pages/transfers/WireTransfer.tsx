import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigationTabs from '../../components/BottomNavigationTabs';
import Header from '../../components/Header';
import { ArrowRight01Icon } from 'hugeicons-react';
import { api_urls } from '../../../utilities/api_urls';
import { getUserToken, isAuthenticated } from '../../../utilities/AuthCookieManager';
import axios from 'axios';
import { useToast } from '../../../contexts/ToastContext';

type Step = 'institution' | 'details' | 'from' | 'amount' | 'when';

interface Beneficiary {
  id: number;
  name: string;
  accountNumber: string;
  accountType: number;
  officeName: string;
  transferLimit: number;
}

const WireTransfer: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('institution');
  const [selectedInstitution, setSelectedInstitution] = useState<Beneficiary | null>(null);
  const [financialInstitutions, setFinancialInstitutions] = useState<Beneficiary[]>([]);
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

        const beneficiariesData = response.data || [];
        setFinancialInstitutions(beneficiariesData);
      } catch (error: any) {
        console.error('Error fetching beneficiaries:', error);
        showError(error.response?.data?.defaultUserMessage || 'Failed to load beneficiaries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBeneficiaries();
  }, [navigate, showError]);

  const handleInstitutionSelect = (institution: Beneficiary) => {
    setSelectedInstitution(institution);
    setCurrentStep('details');
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header title="Wire Transfer" />

      {/* Breadcrumb Stepper */}
      <div className="flex items-stretch w-full bg-[#f2f4f8] h-[44px] overflow-hidden text-[11px] mt-12">
        {/* Institution */}
        <div className={`flex-1 flex items-center justify-center ${currentStep === 'institution' ? 'bg-[#1e2a4a] text-white' : 'bg-[#f2f4f8] text-[#666]'} relative`}>
          <span className={`${currentStep === 'institution' ? 'font-bold' : 'font-medium'} relative z-10 pl-1`}>Institution</span>
          <div className={`absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] ${currentStep === 'institution' ? 'border-l-[#1e2a4a] z-40' : 'border-l-[#f2f4f8] z-40'}`}></div>
        </div>

        {/* Details */}
        <div className={`flex-1 flex items-center justify-center ${currentStep === 'details' ? 'bg-[#1e2a4a] text-white' : (selectedInstitution ? 'bg-[#1a8ca5] text-white' : 'bg-[#f2f4f8] text-[#666]')} relative pl-3`}>
          <span className={`${currentStep === 'details' || selectedInstitution ? 'font-bold' : 'font-medium'} relative z-10`}>Details</span>
          <div className={`absolute right-[-14px] top-0 bottom-0 w-0 h-0 border-t-[22px] border-t-transparent border-b-[22px] border-b-transparent border-l-[14px] ${currentStep === 'details' ? 'border-l-[#1e2a4a] z-30' : (selectedInstitution ? 'border-l-[#1a8ca5] z-30' : 'border-l-[#f2f4f8] z-30')}`}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white z-30"></div>
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

      {/* Institution List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a8ca5] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading institutions...</p>
            </div>
          </div>
        ) : financialInstitutions.length === 0 ? (
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
          <>
            <div className="flex flex-col">
              {financialInstitutions.map((institution) => (
                <div
                  key={institution.id}
                  onClick={() => handleInstitutionSelect(institution)}
                  className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                >
                  <div className="shrink-0 w-10 h-10 bg-black rounded flex items-center justify-center relative overflow-hidden">
                    <div className="w-[3px] h-4 bg-[#0099eb] absolute top-2 left-3 transform -skew-x-12"></div>
                    <div className="w-[3px] h-4 bg-[#00a651] absolute bottom-2 right-3 transform -skew-x-12"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#0d121b] text-[15px] font-bold">{institution.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[#666] text-[13px]">{institution.accountNumber}</span>
                    </div>
                    <p className="text-[#888] text-[11px] font-medium mt-0.5 uppercase tracking-wide">
                      {institution.officeName}
                    </p>
                  </div>
                  <ArrowRight01Icon size={28} className="text-gray-300" />
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="px-4 mt-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-1">Wire Transfer Information</h3>
                <p className="text-xs text-gray-700">
                  Wire transfers may take 1-3 business days to process. Additional fees may apply for international transfers.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default WireTransfer;
