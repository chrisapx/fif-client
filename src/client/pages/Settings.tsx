import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigationTabs from "../components/BottomNavigationTabs";
import { getAuthUser } from "../../utilities/AuthCookieManager";
import { useToast } from "../../contexts/ToastContext";
import {
  FingerPrintScanIcon,
  ArrowLeft01Icon,
  Logout05Icon,
  LockPasswordIcon,
  UserCircle02Icon,
  Notification03Icon,
  Globe02Icon,
  Moon02Icon,
  InformationCircleIcon,
  FileValidationIcon
} from "hugeicons-react";

// Helper functions from Login.tsx
const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const Settings = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const user = getAuthUser();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    const isSupported = window.PublicKeyCredential !== undefined;
    setIsBiometricSupported(isSupported);

    // Check if biometric is currently enabled
    const credentialId = localStorage.getItem('biometric_credentialId');
    setIsBiometricEnabled(credentialId !== null);
  }, []);

  const enableBiometric = async () => {
    setIsProcessing(true);

    try {
      if (!user?.username) {
        showError('User information not found. Please login again.');
        setIsProcessing(false);
        return;
      }

      const username = user.username;
      const userId = stringToArrayBuffer(username);
      const challenge = stringToArrayBuffer(Math.random().toString(36));

      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: {
            name: 'FIFund',
            id: window.location.hostname
          },
          user: {
            id: userId,
            name: username,
            displayName: user.firstName || username
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false
          },
          timeout: 60000,
          attestation: 'none'
        }
      }) as PublicKeyCredential;

      if (credential) {
        const credentialId = arrayBufferToBase64(credential.rawId);

        // Extract password from current auth token (Basic Auth: base64(username:password))
        const authToken = localStorage.getItem('mc_user_tkn');
        if (!authToken) {
          showError('Session expired. Please login again.');
          setIsProcessing(false);
          return;
        }

        // Decode the Basic Auth token to get username:password
        const decodedAuth = atob(authToken);
        const [, password] = decodedAuth.split(':');

        if (!password) {
          showError('Failed to retrieve credentials. Please login again.');
          setIsProcessing(false);
          return;
        }

        localStorage.setItem('biometric_credentialId', credentialId);
        localStorage.setItem('biometric_username', username);
        localStorage.setItem('biometric_password', btoa(password));

        setIsBiometricEnabled(true);
        showSuccess('Biometric login enabled successfully!');
      }
    } catch (error: any) {
      console.error('Failed to enable biometric:', error);
      if (error.name === 'NotAllowedError') {
        showError('Biometric enrollment was cancelled.');
      } else {
        showError('Failed to enable biometric login. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const disableBiometric = async () => {
    const confirmed = window.confirm('Are you sure you want to disable biometric login?');
    if (!confirmed) return;

    setIsProcessing(true);

    try {
      // Remove stored biometric credentials
      localStorage.removeItem('biometric_credentialId');
      localStorage.removeItem('biometric_username');
      localStorage.removeItem('biometric_password');

      setIsBiometricEnabled(false);
      showSuccess('Biometric login disabled successfully.');
    } catch (error) {
      console.error('Failed to disable biometric:', error);
      showError('Failed to disable biometric login.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleBiometric = async () => {
    if (isBiometricEnabled) {
      await disableBiometric();
    } else {
      await enableBiometric();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top App Bar */}
      <header className="bg-[#1a8ca5] pt-12 pb-4 px-4 shadow-md shrink-0 z-20">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 rounded-full p-2 transition-colors -ml-2"
          >
            <ArrowLeft01Icon size={24} />
          </button>
          <h1 className="text-white text-lg font-bold tracking-tight">Settings</h1>
          <button
            onClick={() => navigate('/login')}
            className="text-white hover:bg-white/10 rounded-full p-2 transition-colors -mr-2"
          >
            <Logout05Icon size={24} />
          </button>
        </div>
      </header>

      {/* Main Content (Scrollable) */}
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Profile Card */}
        <div className="bg-white px-6 py-6 mb-2 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center overflow-hidden border-2 border-teal-200">
                <img src="/logos/fif 3.png" alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col justify-center flex-1">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {user?.firstName || 'User'}
              </h2>
              <p className="text-gray-600 text-sm font-medium">ID: {user?.username || 'N/A'}</p>
              <span className="text-xs text-[#1a8ca5] font-bold mt-1 bg-teal-50 w-fit px-2 py-0.5 rounded-full">
                VERIFIED
              </span>
            </div>
            <button className="text-[#1a8ca5] hover:bg-teal-50 p-2 rounded-full transition-colors">
              <UserCircle02Icon size={24} />
            </button>
          </div>
        </div>

        {/* Section: Profile & Security */}
        <div className="px-4 pt-6 pb-2">
          <h3 className="text-gray-600 text-xs font-bold tracking-wider uppercase pl-2">
            Profile & Security
          </h3>
        </div>
        <div className="bg-white mx-4 rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {/* Change Password */}
          <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-0 group">
            <div className="flex items-center justify-center rounded-lg bg-teal-50 text-[#1a8ca5] shrink-0 w-10 h-10 group-hover:bg-[#1a8ca5] group-hover:text-white transition-colors">
              <LockPasswordIcon size={20} />
            </div>
            <div className="flex flex-col items-start flex-1">
              <p className="text-base font-medium text-gray-900">Change Password</p>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <ArrowLeft01Icon size={20} className="text-gray-400 rotate-180" />
          </button>

          {/* Biometric Login (Toggle) */}
          {isBiometricSupported && (
            <div className="w-full flex items-center gap-4 px-4 py-4 border-b border-gray-200 last:border-0">
              <div className="flex items-center justify-center rounded-lg bg-teal-50 text-[#1a8ca5] shrink-0 w-10 h-10">
                <FingerPrintScanIcon size={20} />
              </div>
              <div className="flex flex-col items-start flex-1">
                <p className="text-base font-medium text-gray-900">Biometric Login</p>
                <p className="text-sm text-gray-600">
                  {isBiometricEnabled ? 'Enabled for faster login' : 'Enable for faster login'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isBiometricEnabled}
                  onChange={toggleBiometric}
                  disabled={isProcessing}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a8ca5]"></div>
              </label>
            </div>
          )}
        </div>

        {/* Section: App Preferences */}
        <div className="px-4 pt-6 pb-2">
          <h3 className="text-gray-600 text-xs font-bold tracking-wider uppercase pl-2">
            App Preferences
          </h3>
        </div>
        <div className="bg-white mx-4 rounded-xl shadow-sm overflow-hidden border border-gray-200">
          {/* Notifications */}
          <div className="w-full flex items-center gap-4 px-4 py-4 border-b border-gray-200 last:border-0">
            <div className="flex items-center justify-center rounded-lg bg-teal-50 text-[#1a8ca5] shrink-0 w-10 h-10">
              <Notification03Icon size={20} />
            </div>
            <div className="flex flex-col items-start flex-1">
              <p className="text-base font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-600">Transaction alerts & offers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a8ca5]"></div>
            </label>
          </div>

          {/* Language */}
          <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-0 group">
            <div className="flex items-center justify-center rounded-lg bg-teal-50 text-[#1a8ca5] shrink-0 w-10 h-10 group-hover:bg-[#1a8ca5] group-hover:text-white transition-colors">
              <Globe02Icon size={20} />
            </div>
            <div className="flex flex-col items-start flex-1">
              <p className="text-base font-medium text-gray-900">Language</p>
              <p className="text-sm text-gray-600">English (UK)</p>
            </div>
            <ArrowLeft01Icon size={20} className="text-gray-400 rotate-180" />
          </button>

          {/* Theme */}
          <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors group">
            <div className="flex items-center justify-center rounded-lg bg-teal-50 text-[#1a8ca5] shrink-0 w-10 h-10 group-hover:bg-[#1a8ca5] group-hover:text-white transition-colors">
              <Moon02Icon size={20} />
            </div>
            <div className="flex flex-col items-start flex-1">
              <p className="text-base font-medium text-gray-900">Theme</p>
              <p className="text-sm text-gray-600">System Default</p>
            </div>
            <ArrowLeft01Icon size={20} className="text-gray-400 rotate-180" />
          </button>
        </div>

        {/* Section: Support & Legal */}
        <div className="px-4 pt-6 pb-2">
          <h3 className="text-gray-600 text-xs font-bold tracking-wider uppercase pl-2">
            Support & Legal
          </h3>
        </div>
        <div className="bg-white mx-4 rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
          {/* Help Center */}
          <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-0 group">
            <div className="flex items-center justify-center rounded-lg bg-teal-50 text-[#1a8ca5] shrink-0 w-10 h-10 group-hover:bg-[#1a8ca5] group-hover:text-white transition-colors">
              <InformationCircleIcon size={20} />
            </div>
            <div className="flex flex-col items-start flex-1">
              <p className="text-base font-medium text-gray-900">Help Center</p>
              <p className="text-sm text-gray-600">FAQs & Contact Support</p>
            </div>
            <ArrowLeft01Icon size={20} className="text-gray-400 rotate-180" />
          </button>

          {/* Terms & Conditions */}
          <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors group">
            <div className="flex items-center justify-center rounded-lg bg-teal-50 text-[#1a8ca5] shrink-0 w-10 h-10 group-hover:bg-[#1a8ca5] group-hover:text-white transition-colors">
              <FileValidationIcon size={20} />
            </div>
            <div className="flex flex-col items-start flex-1">
              <p className="text-base font-medium text-gray-900">Terms & Conditions</p>
            </div>
            <ArrowLeft01Icon size={20} className="text-gray-400 rotate-180" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pb-8 pt-2">
          <p className="text-xs text-gray-500 opacity-70">App Version 1.0.0</p>
          <p className="text-xs text-gray-500 opacity-70 mt-1">© 2025 FIFund. All rights reserved.</p>
        </div>
      </main>

      <BottomNavigationTabs />
    </div>
  );
};

export default Settings;
