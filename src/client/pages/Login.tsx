import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button'
import { BankIcon, FingerPrintScanIcon } from 'hugeicons-react';
import { api_urls } from '../utilities/api_urls';
import { setAuthUser, setUserToken } from '../utilities/AuthCookieManager';

const Login: React.FC = () => {
  const [accessCode, setAccessCode] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPin, setShowPin] = useState(false);
  
  const toggleVisibility = () => setShowPin((prev) => !prev);
  
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/create-account')
  }

  useEffect(() => {
    setIsBiometricSupported(false);
  },[])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    // navigate('/home');
    setIsBiometricSupported(false);

    if (!username || !accessCode) {
      setErrorMessage('Please enter both username and pin code.');
      return;
    }

    try {
      const response = await fetch(api_urls.users.login, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key' : '',
        },
        body: JSON.stringify({ username, password: accessCode }),
      });

      if (!response.ok) {
        setErrorMessage(await response.text());
      }
      
      const data = await response.json();
      const token = data.token;

      setUserToken(token);
      setAuthUser(data.user)
      navigate('/home');
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMessage('Login failed. Please check your credentials and try again.');
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
            Hello Boss!
            <h2 className="font-normal mt-2">Welcome to FIFund</h2>
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
            />
          <div className="relative w-full">
            <InputText
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="\d*"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ''))}
                className="text-sm w-full px-4 py-4 pr-12 border-2 border-blue-300 rounded-b-md focus:outline-none focus:border-blue-500"
                placeholder="Pin Code"
            />
            <Button
                type="button"
                icon={showPin ? 'pi pi-eye-slash' : 'pi pi-eye'}
                className="absolute top-1/2 right-2 -translate-y-1/2 p-button-text text-blue-600"
                onClick={toggleVisibility}
            />
            </div>
            {errorMessage && (
              <div className="w-full text-center text-red-500 text-sm pt-4">{errorMessage}</div>
            )}
        </div>

        <div className="flex items-center w-full space-x-4">
          <button
            onClick={handleLogin}
            className="py-4 flex-1 bg-[#115DA9] text-white font-bold rounded-md hover:bg-[#115DA9] transition-colors"
          >
            LOGIN
          </button>
          {isBiometricSupported && (
            <button
              className="flex items-center justify-center p-3 border border-[#115DA9] rounded-md hover:bg-[#115DA9] transition-colors"
            >
              <FingerPrintScanIcon className="text-[#115DA9]" size={28} />
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
    </div>
  );
};

export default Login;