import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button'
import { BankIcon, FingerPrintScanIcon } from 'hugeicons-react';
import { api_urls } from '../../utilities/api_urls';
import { getAuthUser, setAuthUser, setUserToken } from '../../utilities/AuthCookieManager';

// Helper to convert string to ArrayBuffer
const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
};

// Helper to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper to convert base64 to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};


const Login: React.FC = () => {
  const [accessCode, setAccessCode] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  
  const toggleVisibility = () => setShowPin((prev) => !prev);
  
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/create-account')
  }

  useEffect(() => {
    // Check if WebAuthn is supported and credentials are stored
    const checkBiometricSupport = async () => {
      const isWebAuthnSupported = window.PublicKeyCredential !== undefined;
      const hasStoredCredentials = localStorage.getItem('biometric_credentialId') !== null;
      setIsBiometricSupported(isWebAuthnSupported && hasStoredCredentials);
    };
    checkBiometricSupport();
  },[])

  const enableBiometricAuth = async () => {
    setIsLoading(true);
    setShowBiometricPrompt(false);

    try {
      const userId = stringToArrayBuffer(username);
      const challenge = stringToArrayBuffer(Math.random().toString(36));

      // Create WebAuthn credential - THIS PROMPTS FOR BIOMETRIC ENROLLMENT
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
            displayName: pendingUserData?.firstName || username
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
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
        // Store credential ID and encrypted password
        const credentialId = arrayBufferToBase64(credential.rawId);
        const encryptedPassword = btoa(accessCode);

        localStorage.setItem('biometric_credentialId', credentialId);
        localStorage.setItem('biometric_username', username);
        localStorage.setItem('biometric_password', encryptedPassword);
      }

      // Navigate to home
      if (pendingUserData.accounts && pendingUserData.accounts.length > 1) {
        navigate('/select-account');
      } else {
        navigate('/home');
      }
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to enable biometric:', error);
      // Continue to home even if biometric fails
      if (pendingUserData.accounts && pendingUserData.accounts.length > 1) {
        navigate('/select-account');
      } else {
        navigate('/home');
      }
      window.location.reload();
    }
  };

  const declineBiometricAuth = () => {
    setShowBiometricPrompt(false);
    setIsLoading(false);

    // Navigate to home without biometric
    if (pendingUserData.accounts && pendingUserData.accounts.length > 1) {
      navigate('/select-account');
    } else {
      navigate('/home');
    }
    window.location.reload();
  };

  const handleBiometricLogin = async () => {
    setErrorMessage('');
    setIsLoading(true);
    setIsBiometricSupported(false);

    try {
      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        setErrorMessage('Biometric authentication is not supported on this device.');
        setIsLoading(false);
        setIsBiometricSupported(true);
        return;
      }

      // Get stored credential info
      const credentialIdBase64 = localStorage.getItem('biometric_credentialId');
      const storedUsername = localStorage.getItem('biometric_username');
      const encryptedPassword = localStorage.getItem('biometric_password');

      if (!credentialIdBase64 || !storedUsername || !encryptedPassword) {
        setErrorMessage('No biometric credentials found. Please login with username and password first.');
        setIsLoading(false);
        setIsBiometricSupported(true);
        return;
      }

      // Prepare WebAuthn authentication request
      const credentialId = base64ToArrayBuffer(credentialIdBase64);
      const challenge = stringToArrayBuffer(Math.random().toString(36));

      // Request biometric authentication - THIS TRIGGERS THE ACTUAL FINGERPRINT/FACE ID PROMPT
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          allowCredentials: [{
            id: credentialId,
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: 'required', // This ensures biometric verification
          timeout: 60000
        }
      });

      if (!assertion) {
        setErrorMessage('Biometric authentication cancelled.');
        setIsLoading(false);
        setIsBiometricSupported(true);
        return;
      }

      // Biometric authentication successful! Login directly without filling form
      const decodedUsername = storedUsername;
      const decodedPassword = atob(encryptedPassword);

      // Authenticate directly with API
      const credentials = btoa(`${decodedUsername}:${decodedPassword}`);
      const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';

      const response = await fetch(api_urls.authentication.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Fineract-Platform-TenantId': tenant,
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({ username: decodedUsername, password: decodedPassword }),
      });

      if (!response.ok) {
        setErrorMessage('Login failed. Please try manual login.');
        setIsLoading(false);
        setIsBiometricSupported(true);
        return;
      }

      const data = await response.json();
      setUserToken(credentials);

      // Process user data (same logic as handleLogin)
      if (data.authenticated && data.clients?.length > 0) {
        const clientDetailsPromises = data.clients.map(async (clientId: number) => {
          try {
            const response = await fetch(`${api_urls.authentication.self.replace('/self/user', '')}/self/clients/${clientId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Fineract-Platform-TenantId': tenant,
                'Authorization': `Basic ${credentials}`
              }
            });
            return response.ok ? await response.json() : null;
          } catch (error) {
            return null;
          }
        });

        const clientsData = await Promise.all(clientDetailsPromises);
        const validClients = clientsData.filter(client => client !== null);

        const accounts = validClients.map((client: any) => ({
          clientId: client.id?.toString(),
          displayName: client.displayName || client.firstname || decodedUsername,
          email: client.emailAddress || '',
          accountNo: client.accountNo || '',
          officeId: client.officeId,
          officeName: client.officeName,
          status: client.status?.value || 'Active'
        }));

        const userData = {
          username: decodedUsername,
          officeId: data.officeId,
          officeName: data.officeName,
          roles: data.roles || ['CLIENT'],
          permissions: data.permissions || [],
          accounts: accounts,
          selectedAccountIndex: accounts.length === 1 ? 0 : null,
          userId: accounts.length === 1 ? accounts[0].clientId : undefined,
          email: accounts.length === 1 ? accounts[0].email : '',
          firstName: accounts.length === 1 ? accounts[0].displayName : decodedUsername
        };

        setAuthUser(userData);

        // Navigate
        if (userData.accounts && userData.accounts.length > 1) {
          navigate('/select-account');
        } else {
          navigate('/home');
        }
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Biometric login failed:', error);
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Biometric authentication was cancelled or failed.');
      } else {
        setErrorMessage('Biometric authentication failed. Please try manual login.');
      }
      setIsLoading(false);
      setIsBiometricSupported(true);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsBiometricSupported(false);
    setIsLoading(true);

    if (!username || !accessCode) {
      setErrorMessage('Please enter both username and password.');
      setIsLoading(false);
      setIsBiometricSupported(true);
      return;
    }

    try {
      // Fineract self-service authentication
      const credentials = btoa(`${username}:${accessCode}`);
      const tenant = import.meta.env.VITE_FINERACT_TENANT || 'default';

      // For self-service, we authenticate and then fetch client details
      const response = await fetch(api_urls.authentication.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Fineract-Platform-TenantId': tenant,
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({ username, password: accessCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'Authentication failed';

        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.defaultUserMessage || errorData.developerMessage || errorMsg;
        } catch (e) {
          errorMsg = errorText || errorMsg;
        }

        setErrorMessage(errorMsg);
        setIsBiometricSupported(true);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      // Store the base64 encoded credentials as token
      setUserToken(credentials);

      // For self-service users, get client details
      let userData;

      if (data.authenticated) {
        // Self-service authentication successful
        // The response contains an array of client IDs
        const clientIds = data.clients || [];

        if (clientIds.length === 0) {
          setErrorMessage('No accounts found for this user.');
          setIsBiometricSupported(true);
          setIsLoading(false);
          return;
        }

        // Fetch details for all client accounts
        const clientDetailsPromises = clientIds.map(async (clientId: number) => {
          try {
            const response = await fetch(`${api_urls.authentication.self.replace('/self/user', '')}/self/clients/${clientId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Fineract-Platform-TenantId': tenant,
                'Authorization': `Basic ${credentials}`
              }
            });
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch (error) {
            console.error(`Error fetching client ${clientId}:`, error);
            return null;
          }
        });

        const clientsData = await Promise.all(clientDetailsPromises);
        const validClients = clientsData.filter(client => client !== null);

        // Store all available accounts
        const accounts = validClients.map((client: any) => ({
          clientId: client.id?.toString(),
          displayName: client.displayName || client.firstname || username,
          email: client.emailAddress || '',
          accountNo: client.accountNo || '',
          officeId: client.officeId,
          officeName: client.officeName,
          status: client.status?.value || 'Active'
        }));

        userData = {
          username: username,
          officeId: data.officeId,
          officeName: data.officeName,
          roles: data.roles || ['CLIENT'],
          permissions: data.permissions || [],
          accounts: accounts,
          // If only one account, auto-select it
          selectedAccountIndex: accounts.length === 1 ? 0 : null,
          userId: accounts.length === 1 ? accounts[0].clientId : undefined,
          email: accounts.length === 1 ? accounts[0].email : '',
          firstName: accounts.length === 1 ? accounts[0].displayName : username
        };
      } else {
        setErrorMessage('Authentication failed. Invalid credentials.');
        setIsBiometricSupported(true);
        setIsLoading(false);
        return;
      }

      setAuthUser(userData);

      // Check if biometric is already enabled
      const biometricAlreadyEnabled = localStorage.getItem('biometric_credentialId') !== null;

      // If biometric not enabled and device supports it, ask user if they want to enable it
      if (!biometricAlreadyEnabled && window.PublicKeyCredential) {
        setPendingUserData(userData);
        setShowBiometricPrompt(true);
        setIsLoading(false);
        return; // Don't navigate yet, wait for user response
      }

      // Navigate to home
      if (userData.accounts && userData.accounts.length > 1) {
        navigate('/select-account');
      } else {
        navigate('/home');
      }
      window.location.reload();
    } catch (error: any) {
      console.error('Login failed:', error);
      setErrorMessage(error.message || 'Login failed. Please check your credentials and try again.');
      setIsBiometricSupported(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 flex flex-col justify-between h-screen bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-3/7">
        <svg
          className="absolute top-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#115DA9"
            fillOpacity="0.9"
            d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,213.3C840,224,960,224,1080,213.3C1200,203,1320,181,1380,170.7L1440,160L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
          />
        </svg>
      </div>

      <section className='z-30 mt-3'>
        <div className='flex justify-center items-center'>
            <img src="/logos/fif 3.png" alt="" className='h-10'/>
        </div>
        <h1 className="text-white mt-8 text-left text-lg font-bold">
            Hello {getAuthUser()?.lastName ?? "there"}!
            <p className="font-normal mt-2">Welcome to FIFund</p>
        </h1>

      </section>

      <div className="flex flex-col z-30 justify-center items-center space-y-8 w-full">
        <div className="w-full">
          <InputText
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-sm w-full px-4 py-4 border-2 border-blue-300 rounded-t-md focus:outline-none focus:border-blue-500"
            placeholder="Username or A/C"
            disabled={isLoading}
            />
          <div className="relative w-full">
            <InputText
                type={showPin ? 'text' : 'password'}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="text-sm w-full px-4 py-4 pr-12 border-2 border-blue-300 rounded-b-md focus:outline-none focus:border-blue-500"
                placeholder="Password"
                disabled={isLoading}
            />
            <Button
                type="button"
                icon={showPin ? 'pi pi-eye-slash' : 'pi pi-eye'}
                className="absolute top-1/2 right-2 -translate-y-1/2 p-button-text text-blue-600"
                onClick={toggleVisibility}
                disabled={isLoading}
            />
            </div>
            {errorMessage && (
              <div className="w-full text-center text-red-500 text-sm pt-4">{errorMessage}</div>
            )}
        </div>

        <div className="flex items-center w-full space-x-4">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="py-4 flex-1 bg-[#115DA9] text-white font-bold rounded-md hover:bg-[#0d4a87] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '1rem' }}></i>
                Logging in...
              </>
            ) : (
              'LOGIN'
            )}
          </button>
          {isBiometricSupported && !isLoading && (
            <button
              onClick={handleBiometricLogin}
              className="flex items-center justify-center p-3 border border-[#115DA9] rounded-md hover:bg-[#115DA9] hover:text-white transition-colors group"
              title="Login with fingerprint or Face ID"
              aria-label="Login with biometric authentication"
            >
              <FingerPrintScanIcon className="text-[#115DA9] group-hover:text-white" size={28} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1 w-full">
          <button
            onClick={handleCreateAccount}
            className="px-2 py-6 font-thin bg-gray-200 border-b-2 rounded border-[#115DA9] text-xs flex justify-between items-center"
          >
            Create an account <BankIcon size={16} className="text-[#115DA9]" />
          </button>
          <button className="px-2 py-6 font-thin bg-gray-200 border-b-2 rounded border-[#115DA9] text-xs flex justify-center items-center opacity-50">
            ?
          </button>
        </div>
      </div>

      <div className="flex justify-center items-center border-t pt-4 border-gray-300">
        <p className="text-sm text-gray-400">Family Investment Fund © FIF Inc</p>
      </div>

      {/* Biometric Enrollment Prompt Modal */}
      {showBiometricPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FingerPrintScanIcon className="text-[#115DA9]" size={32} />
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Enable Biometric Login?
              </h2>

              <p className="text-sm text-gray-600 mb-6">
                Would you like to use your fingerprint or Face ID to login next time? This makes logging in faster and more secure.
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={enableBiometricAuth}
                  disabled={isLoading}
                  className="w-full py-3 bg-[#115DA9] text-white font-semibold rounded-md hover:bg-[#0d4a87] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <i className="pi pi-spin pi-spinner"></i>
                      Setting up...
                    </>
                  ) : (
                    <>
                      <FingerPrintScanIcon size={20} />
                      Yes, Enable Biometric Login
                    </>
                  )}
                </button>

                <button
                  onClick={declineBiometricAuth}
                  disabled={isLoading}
                  className="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Not Now
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                You can always enable this later in settings
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;