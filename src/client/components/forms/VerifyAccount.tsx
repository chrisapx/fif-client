// PhoneVerificationPanel.tsx
import React, { useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { useSearchParams } from 'react-router-dom';
import { searchParamsVariables } from '../../utilities/UrlParamVariables';
import axios from 'axios';
import { api_urls } from '../../utilities/api_urls';

interface IMessage {
  text: string;
  type: 'success' | 'error';
}

const PhoneVerificationPanel: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const panelStatus = searchParams.get(searchParamsVariables.phoneVerificationPanelOpen);
  const phone = searchParams.get('phone') || '';

  const [code, setCode] = useState('');
  const [message, setMessage] = useState<IMessage | null>(null);
  const [loading, setLoading] = useState(false);

  const handleHidePanel = () => {
    searchParams.delete(searchParamsVariables.phoneVerificationPanelOpen);
    searchParams.delete('phone');
    setSearchParams(searchParams);
    setMessage(null);
    setCode('');
  };

  const handleVerify = async () => {
    if (!code) return;
    setLoading(true);
    try {
      await axios.post(api_urls.users.verify_otp, { phone, code });
      setMessage({ text: 'Phone verified successfully!', type: 'success' });
      setTimeout(() => {
        handleHidePanel();
      }, 2000);
    } catch (err: any) {
      const fallback = err?.response?.data?.message || 'Verification failed. Try again.';
      setMessage({ text: fallback, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sidebar
      visible={panelStatus === '1'}
      onHide={handleHidePanel}
      className="w-full"
      position="right"
      content={({ hide }) => (
        <div className="px-4 py-6">
          <h3 className="text-lg font-semibold mb-2">Verify Your Phone</h3>
          <p className="text-sm text-gray-500 mb-4">Enter the OTP sent to {phone}</p>

          {message && (
            <div
              className={`mb-4 px-4 py-2 text-sm rounded border ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="w-full border px-3 py-2 rounded text-sm mb-4"
          />

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-[#115DA9] text-white py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            Verify Phone
          </button>
        </div>
      )}
    />
  );
};

export default PhoneVerificationPanel;