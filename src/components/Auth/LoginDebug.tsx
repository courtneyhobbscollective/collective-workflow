import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSupabase } from '../../context/SupabaseContext';

const LoginDebug: React.FC = () => {
  const { user, isLoading, error } = useAuth();
  const { supabase } = useSupabase();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runDebugTests = async () => {
    setTestResults([]);
    addResult('🔍 Starting debug tests...');

    // Test 1: Check Supabase client
    addResult(`📡 Supabase client: ${supabase ? '✅ Available' : '❌ Null'}`);

    // Test 2: Check current session
    if (supabase) {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        addResult(`🔐 Current session: ${sessionData.session ? '✅ Active' : '❌ None'}`);
        if (sessionError) {
          addResult(`❌ Session error: ${sessionError.message}`);
        }
        if (sessionData.session) {
          addResult(`👤 Session user ID: ${sessionData.session.user.id}`);
        }
      } catch (error) {
        addResult(`❌ Session test failed: ${error}`);
      }
    }

    // Test 3: Check profiles table
    if (supabase) {
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        if (profilesError) {
          addResult(`❌ Profiles table error: ${profilesError.message}`);
        } else {
          addResult(`✅ Profiles table accessible (${profilesData?.length || 0} records)`);
        }
      } catch (error) {
        addResult(`❌ Profiles test failed: ${error}`);
      }
    }

    // Test 4: Check if current user has a profile
    if (supabase && user) {
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          addResult(`❌ User profile error: ${profileError.message}`);
        } else if (userProfile) {
          addResult(`✅ User profile found: ${userProfile.name} (${userProfile.role})`);
        } else {
          addResult(`⚠️ No profile found for user ${user.id}`);
        }
      } catch (error) {
        addResult(`❌ User profile test failed: ${error}`);
      }
    }

    addResult('🎉 Debug tests completed!');
  };

  useEffect(() => {
    setDebugInfo({
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      } : null,
      isLoading,
      error,
      timestamp: new Date().toISOString()
    });
  }, [user, isLoading, error]);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Login Debug Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Current State</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <button
            onClick={runDebugTests}
            className="w-full mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Run Debug Tests
          </button>
          <button
            onClick={() => {
              if (supabase) {
                supabase.auth.signOut();
              }
            }}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Test Results</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginDebug; 