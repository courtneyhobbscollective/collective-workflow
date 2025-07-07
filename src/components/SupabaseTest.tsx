import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';

const SupabaseTest: React.FC = () => {
  const { supabase } = useSupabase();
  const [testResult, setTestResult] = useState<string>('Testing...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      if (!supabase) {
        setTestResult('❌ Supabase client is null');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('clients').select('count').limit(1);
        
        if (error) {
          console.error('Supabase test error:', error);
          setTestResult(`❌ Error: ${error.message}`);
        } else {
          console.log('Supabase test success:', data);
          setTestResult('✅ Supabase connection working');
        }
      } catch (err) {
        console.error('Supabase test exception:', err);
        setTestResult(`❌ Exception: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    testConnection();
  }, [supabase]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Supabase Connection Test</h3>
      <div className="text-sm">
        <div>Status: {isLoading ? '🔄 Testing...' : testResult}</div>
        <div>Supabase Client: {supabase ? '✅ Available' : '❌ Null'}</div>
      </div>
    </div>
  );
};

export default SupabaseTest; 