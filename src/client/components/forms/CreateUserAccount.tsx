import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { api_urls } from '../../utilities/api_urls';
import { getAuthUser, getUserToken, logout } from '../../utilities/AuthCookieManager';

const user = getAuthUser();
const token = getUserToken();

interface IMessage {
  text: string;
  type: 'error' | 'success';
}

const CreateUserAccount: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [message, setMessage] = useState<IMessage | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    pin: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    nin: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{5}$/.test(formData.pin)) {
      return setMessage({ text: 'PIN must be exactly 5 digits', type: 'error' });
    }

    const payload = new FormData();
    payload.append('user', JSON.stringify(formData));

    try {
      const response = await axios.post(api_urls.users.create_user_account, payload, {
        headers: {
          ...(isAdmin && { Authorization: `Bearer ${token}` }),
        },
      });

      setMessage({
        text: 'Account created successfully. Please verify via phone.',
        type: 'success',
      });

      if(isAdmin){
        navigate('/home');
      } else {
        navigate('/login')
      }
      // Navigate to phone verification step (optional)
      // navigate(`/verify-phone?phone=${formData.phone}`);

    } catch (err: any) {
      const fallback = err?.response?.data?.message || 'Account creation failed. Try again.';
      setMessage({ text: fallback, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#115DA9]">Create Your User Account</h2>
          {isAdmin && (
            <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
              Logout
            </button>
          )}
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded text-sm"
          />
          <input
            name="pin"
            type="password"
            placeholder="5-digit PIN"
            value={formData.pin}
            onChange={handleChange}
            required
            maxLength={5}
            pattern="\d{5}"
            className="w-full border px-3 py-2 rounded text-sm"
          />
          <div className="flex gap-2">
            <input
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded text-sm"
            />
            <input
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded text-sm"
            />
          </div>
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded text-sm"
          />
          <input
            name="phone"
            placeholder="Phone (e.g., 2567XXXXXXXX)"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded text-sm"
          />
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded text-sm"
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <input
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded text-sm"
          />
          <input
            name="nin"
            placeholder="National ID Number (NIN)"
            value={formData.nin}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded text-sm"
          />

          <button
            type="submit"
            className="w-full bg-[#115DA9] text-white py-2 rounded hover:bg-blue-700 text-sm"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUserAccount;