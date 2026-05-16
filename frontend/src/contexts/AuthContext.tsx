import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyLoginOtp: (otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyResetOtp: (otp: string) => Promise<void>;
  resetPassword: (otp: string, newPassword: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const saveAuthSession = (authUser: User, accessToken: string, refreshToken: string) => {
    const userWithImage = {
      ...authUser,
      image: `https://api.dicebear.com/9.x/avataaars/svg?seed=${authUser.name}`,
    };
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userWithImage));
    setUser(userWithImage);
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    if (!response.success) {
      throw new Error(response.message || 'Login failed');
    }
  };

  const verifyLoginOtp = async (otp: string) => {
    const response = await authService.verifyLoginOtp(otp);
    if (!response.success) {
      throw new Error(response.message || 'OTP verification failed');
    }

    const { user, accessToken, refreshToken } = response.data;
    saveAuthSession(user, accessToken, refreshToken);
  };

  const forgotPassword = async (email: string) => {
    const response = await authService.forgotPassword(email);
    if (!response.success) {
      throw new Error(response.message || 'Failed to send reset OTP');
    }
  };

  const verifyResetOtp = async (otp: string) => {
    const response = await authService.verifyResetOtp(otp);
    if (!response.success) {
      throw new Error(response.message || 'OTP verification failed');
    }
  };

  const resetPassword = async (otp: string, newPassword: string) => {
    const response = await authService.resetPassword(otp, newPassword);
    if (!response.success) {
      throw new Error(response.message || 'Password reset failed');
    }

    const { user, accessToken, refreshToken } = response.data;
    saveAuthSession(user, accessToken, refreshToken);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await authService.signup(name, email, password);
    if (!response.success) {
      throw new Error(response.message || 'Signup failed');
    }

    const { user, accessToken, refreshToken } = response.data;
    saveAuthSession(user, accessToken, refreshToken);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        verifyLoginOtp,
        forgotPassword,
        verifyResetOtp,
        resetPassword,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
