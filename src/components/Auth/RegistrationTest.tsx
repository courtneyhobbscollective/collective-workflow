import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSupabase } from '../../context/SupabaseContext';
import { CheckCircle, AlertCircle, User, Shield } from 'lucide-react';

const RegistrationTest: React.FC = () => {
  const { user, logout } = useAuth();
  const { supabase } = useSupabase();

  const testRegistration = async () => {
    if (!supabase) return;
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    const testName = 'Test User';
    
    try {
      console.log('Testing registration with:', { testEmail, testName });
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: testName,
            role: 'staff'
          }
        }
      });
      
      if (error) {
        console.error('Registration error:', error);
        alert(`Registration failed: ${error.message}`);
      } else {
        console.log('Registration successful:', data);
        alert(`Registration successful! Check console for details.`);
      }
    } catch (error) {
      console.error('Test registration error:', error);
      alert(`Test failed: ${error}`);
    }
  };

  const testProfileCreation = async () => {
    if (!supabase || !user) return;
    
    try {
      console.log('Testing profile creation for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar_url: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) {
        console.error('Profile creation error:', error);
        alert(`Profile creation failed: ${error.message}`);
      } else {
        console.log('Profile creation successful:', data);
        alert(`Profile creation successful! Check console for details.`);
      }
    } catch (error) {
      console.error('Test profile creation error:', error);
      alert(`Test failed: ${error}`);
    }
  };

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-6 w-6 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">Authentication Test</h2>
      </div>

      {/* Connection Status */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          {supabase ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm">
            Supabase Connection: {supabase ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {/* User Status */}
        <div className="flex items-center space-x-3">
          {user ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm">
            Authentication: {user ? 'Logged In' : 'Not Logged In'}
          </span>
        </div>
      </div>

      {/* Current User Info */}
      {user && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="font-medium text-gray-900">Current User:</h3>
          <div className="text-sm space-y-1">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span><strong>Name:</strong> {user.name}</span>
            </div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> {user.role}</div>
            <div><strong>ID:</strong> {user.id}</div>
          </div>
        </div>
      )}

      {/* Test Buttons */}
      <div className="space-y-3">
        <button
          onClick={testRegistration}
          className="btn-secondary w-full"
        >
          Test Registration (Console)
        </button>
        
        {user && (
          <button
            onClick={testProfileCreation}
            className="btn-secondary w-full"
          >
            Test Profile Creation (Console)
          </button>
        )}
        
        {user && (
          <button
            onClick={logout}
            className="btn-primary w-full"
          >
            Logout
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-2">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click "Test Registration" to create a test account</li>
          <li>Check the browser console for detailed logs</li>
          <li>Use the registration form to create real accounts</li>
          <li>Verify data is saved in Supabase dashboard</li>
        </ul>
      </div>
    </div>
  );
};

export default RegistrationTest; 