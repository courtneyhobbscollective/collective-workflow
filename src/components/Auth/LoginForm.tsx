import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, UserPlus, Shield, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  showRegistrationLink?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, showRegistrationLink = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const { login, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleForgotPassword = async () => {
    console.log('Forgot password clicked for email:', email);
    
    if (!email) {
      setResetError('Please enter your email address first');
      setResetEmailSent(false);
      return;
    }
    
    if (!supabase) {
      setResetError('Database connection error');
      setResetEmailSent(false);
      return;
    }
    
    try {
      console.log('Sending password reset email to:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173/reset-password' // No trailing slash or hash
      });
      
      if (error) {
        console.error('Password reset error:', error);
        setResetError(error.message);
        setResetEmailSent(false);
      } else {
        console.log('Password reset email sent successfully');
        setResetEmailSent(true);
        setResetError('');
      }
    } catch (error) {
      console.error('Password reset exception:', error);
      setResetError('Failed to send reset email');
      setResetEmailSent(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center">
          <img src="/logo.svg" alt="CreativeFlow Logo" className="h-48 w-48 object-contain block" />
          <p className="-mt-12 text-center text-sm text-gray-600">
            Your creative agency management platform
          </p>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-center" role="alert">
            {error}
          </div>
        )}
        {resetError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-center" role="alert">
            {resetError}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} aria-label="Sign in form">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setResetError('');
                  setResetEmailSent(false);
                }}
                aria-required="true"
                aria-label="Email address"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input pr-10"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-required="true"
                aria-label="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={0}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            
            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center justify-end ml-auto"
                disabled={isLoading || !email}
              >
                <Lock className="h-4 w-4 mr-1" />
                Forgot Password?
              </button>
            </div>
            
            {resetEmailSent && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded relative text-center" role="alert">
                Password reset email sent! Check your inbox.
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`btn-primary w-full justify-center ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Sign in
                </span>
              )}
            </button>
          </div>

          {/* Switch to Registration - Only show for admin users */}
          {showRegistrationLink && onSwitchToRegister && (
            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center justify-center mx-auto"
                disabled={isLoading}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Create New User Account
              </button>
            </div>
          )}

          {/* Contact Admin Message - Show for non-admin users */}
          {!showRegistrationLink && (
            <div className="text-center">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <Shield className="h-4 w-4 mr-1" />
                Need an account? Contact your administrator
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;