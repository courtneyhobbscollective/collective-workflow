import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSupabase } from '../../context/SupabaseContext';
import { UserPlus, Users, Shield, Mail, User, AlertCircle, CheckCircle } from 'lucide-react';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff' as 'admin' | 'staff',
    password: '', // Add password to form state
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Add state for password reset
  const [resetPassword, setResetPassword] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  // Only allow admin users to access this component
  if (user?.role !== 'admin') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!supabase) {
      setError('Database connection error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Use entered password or generate a temporary one
      const password = formData.password || (
        Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4) + '!1'
      );
      // Create user in Supabase Auth (frontend-safe)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.user) {
        // Create user profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              avatar_url: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          setError('User created but profile creation failed. Please contact support.');
          return;
        }
        setSuccess(`User created successfully! Password: ${password}`);
        setFormData({ name: '', email: '', role: 'staff', password: '' });
      } else {
        setSuccess('User created! They must confirm their email before logging in.');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle password reset
  const handleResetPassword = async (userId: string) => {
    setResetStatus('');
    if (!resetPassword) {
      setResetStatus('Please enter a new password.');
      return;
    }
    if (!supabase) {
      setResetStatus('Supabase client not initialized.');
      return;
    }
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, { password: resetPassword });
      if (error) {
        setResetStatus('Failed to reset password: ' + error.message);
      } else {
        setResetStatus('Password reset successfully!');
        setResetPassword('');
        setResetUserId('');
      }
    } catch (err: any) {
      setResetStatus('Unexpected error: ' + err.message);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (error || success) {
      setError(null);
      setSuccess(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                <p className="text-sm text-gray-500">Create a new user account</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input pl-10"
                  placeholder="Enter full name"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input pl-10"
                  placeholder="Enter email address"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="input pl-10"
                  disabled={isSubmitting}
                >
                  <option value="staff">Staff Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Choose the user's role in the organization
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="input pl-3"
                  placeholder="Enter password or leave blank for random"
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to auto-generate a secure password
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• A temporary password will be generated</li>
                    <li>• The user will receive an email to reset their password</li>
                    <li>• Make sure to share the temporary password securely</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 btn-primary"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create User
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 