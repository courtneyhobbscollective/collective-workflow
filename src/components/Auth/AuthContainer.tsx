import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';

const AuthContainer: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuth();

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  // Only allow admin users to register new users
  const canRegister = user?.role === 'admin';

  // If user is not admin, only show login form
  if (!canRegister) {
    return <LoginForm showRegistrationLink={false} />;
  }

  return (
    <>
      {isLogin ? (
        <LoginForm 
          onSwitchToRegister={switchToRegister} 
          showRegistrationLink={true}
        />
      ) : (
        <RegistrationForm onSwitchToLogin={switchToLogin} />
      )}
    </>
  );
};

export default AuthContainer; 