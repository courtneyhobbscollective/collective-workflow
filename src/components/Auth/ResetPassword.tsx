import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Supabase sends the access_token in the URL hash or query string
  const params = new URLSearchParams(location.hash.replace('#', '?'));
  const queryParams = new URLSearchParams(location.search);
  
  const access_token = params.get('access_token') || queryParams.get('access_token');
  
  console.log('ResetPassword component loaded');
  console.log('Location hash:', location.hash);
  console.log('Location search:', location.search);
  console.log('Access token:', access_token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!access_token) {
      setError('Invalid or missing token.');
      return;
    }
    if (!supabase) {
      setError('Supabase client not initialized.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow text-center">
        <h2 className="text-2xl font-semibold mb-4">Password updated!</h2>
        <p>Redirecting to login...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="max-w-md w-full bg-white p-8 rounded-xl shadow">
        <h2 className="text-2xl font-semibold mb-6 text-center">Set a New Password</h2>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="input mb-4"
        />
        <button type="submit" className="btn-primary w-full mb-2">Update Password</button>
        {error && <div className="text-red-600 text-sm text-center mt-2">{error}</div>}
      </form>
    </div>
  );
};

export default ResetPassword; 