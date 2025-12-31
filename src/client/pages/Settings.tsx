import { useState, useEffect } from "react";
import Header from "../components/Header";
import BottomNavigationTabs from "../components/BottomNavigationTabs";
import { getAuthUser } from "../../utilities/AuthCookieManager";
import { FingerPrintScanIcon, CheckmarkCircle02Icon, Cancel01Icon } from "hugeicons-react";

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
  const user = getAuthUser();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
    setMessage(null);

    try {
      if (!user?.username) {
        setMessage({ text: 'User information not found. Please login again.', type: 'error' });
        setIsProcessing(false);
        return;
      }

      // Prompt for password for security
      const password = window.prompt('Enter your password to enable biometric login:');
      if (!password) {
        setMessage({ text: 'Password is required to enable biometric login.', type: 'error' });
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
        const encryptedPassword = btoa(password);

        localStorage.setItem('biometric_credentialId', credentialId);
        localStorage.setItem('biometric_username', username);
        localStorage.setItem('biometric_password', encryptedPassword);

        setIsBiometricEnabled(true);
        setMessage({ text: 'Biometric login enabled successfully!', type: 'success' });
      }
    } catch (error: any) {
      console.error('Failed to enable biometric:', error);
      if (error.name === 'NotAllowedError') {
        setMessage({ text: 'Biometric enrollment was cancelled.', type: 'error' });
      } else {
        setMessage({ text: 'Failed to enable biometric login. Please try again.', type: 'error' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const disableBiometric = async () => {
    const confirmed = window.confirm('Are you sure you want to disable biometric login?');
    if (!confirmed) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      // Remove stored biometric credentials
      localStorage.removeItem('biometric_credentialId');
      localStorage.removeItem('biometric_username');
      localStorage.removeItem('biometric_password');

      setIsBiometricEnabled(false);
      setMessage({ text: 'Biometric login disabled successfully.', type: 'success' });
    } catch (error) {
      console.error('Failed to disable biometric:', error);
      setMessage({ text: 'Failed to disable biometric login.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-sm text-gray-600">Manage your account preferences</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Biometric Settings Section */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Security</h2>
          </div>

          <div className="px-4 py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FingerPrintScanIcon className="text-[#115DA9]" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-800">Biometric Login</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isBiometricSupported
                      ? 'Use your fingerprint or Face ID to login quickly and securely'
                      : 'Your device does not support biometric authentication'}
                  </p>

                  {isBiometricEnabled && (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckmarkCircle02Icon className="text-green-600" size={16} />
                      <span className="text-sm text-green-600 font-medium">Enabled</span>
                    </div>
                  )}

                  {!isBiometricEnabled && isBiometricSupported && (
                    <div className="flex items-center gap-2 mt-2">
                      <Cancel01Icon className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-500 font-medium">Disabled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isBiometricSupported && (
              <div className="mt-4">
                {!isBiometricEnabled ? (
                  <button
                    onClick={enableBiometric}
                    disabled={isProcessing}
                    className="w-full py-3 bg-[#115DA9] text-white font-semibold rounded-md hover:bg-[#0d4a87] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <i className="pi pi-spin pi-spinner"></i>
                        Setting up...
                      </>
                    ) : (
                      <>
                        <FingerPrintScanIcon size={20} />
                        Enable Biometric Login
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={disableBiometric}
                    disabled={isProcessing}
                    className="w-full py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <i className="pi pi-spin pi-spinner"></i>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Cancel01Icon size={20} />
                        Disable Biometric Login
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {!isBiometricSupported && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-600">
                  Biometric authentication requires a device with fingerprint scanner, Face ID, or Windows Hello support.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Account Information</h2>
          </div>

          <div className="px-4 py-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500">Username</p>
              <p className="text-sm font-medium text-gray-800">{user?.username || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-sm font-medium text-gray-800">{user?.firstName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-800">{user?.email || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigationTabs />
    </div>
  );
};

export default Settings;
