import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { MOCK_AUTH, MOCK_CUSTOMER, MOCK_SUPPLIER } from '@/config/dev';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setMockUser: (userType: 'customer' | 'supplier') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      // Check if we're in mock mode
      if (MOCK_AUTH) {
        console.log('🔧 Mock Auth Mode: Authentication bypassed for development');
        const mockUserType = localStorage.getItem('mockUserType') as 'customer' | 'supplier' | null;
        if (mockUserType) {
          setUser(mockUserType === 'customer' ? MOCK_CUSTOMER : MOCK_SUPPLIER);
        }
        setLoading(false);
        return;
      }

      // Check for existing token
      const token = authService.getToken();
      
      if (token) {
        try {
          console.log('🔐 Token found, fetching user data...');
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          console.log('✅ User authenticated:', currentUser.email);
        } catch (error: any) {
          console.error('❌ Failed to fetch user:', error?.message || error);
          // Clear invalid tokens
          await authService.logout();
        }
      } else {
        console.log('ℹ️ No token found, user not authenticated');
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const setMockUser = (userType: 'customer' | 'supplier') => {
    if (MOCK_AUTH) {
      const mockUser = userType === 'customer' ? MOCK_CUSTOMER : MOCK_SUPPLIER;
      setUser(mockUser);
      localStorage.setItem('mockUserType', userType);
      navigate(userType === 'customer' ? '/dashboard/customer' : '/dashboard/supplier');
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Mock login in development mode
    if (MOCK_AUTH) {
      const mockUser = credentials.email.includes('supplier') ? MOCK_SUPPLIER : MOCK_CUSTOMER;
      setUser(mockUser);
      localStorage.setItem('mockUserType', mockUser.user_type);
      
      if (mockUser.user_type === 'customer') {
        navigate('/dashboard/customer');
      } else {
        navigate('/dashboard/supplier');
      }
      
      return { success: true, user: mockUser, message: 'Mock login successful' };
    }

    try {
      console.log('🔐 Attempting login...');
      const response = await authService.login(credentials);
      
      if (response.success && response.user) {
        setUser(response.user);
        console.log('✅ Login successful:', response.user.email);
        
        // Navigate based on user type
        if (response.user.user_type === 'customer') {
          navigate('/dashboard/customer');
        } else if (response.user.user_type === 'supplier') {
          navigate('/dashboard/supplier');
        } else {
          navigate('/');
        }
      } else {
        console.error('❌ Login failed:', response.message);
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: error?.message || 'Login failed. Please try again.'
      };
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      console.log('📝 Attempting registration...');
      const response = await authService.register(data);
      
      if (response.success) {
        console.log('✅ Registration successful');
      } else {
        console.error('❌ Registration failed:', response.message);
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        message: error?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    if (MOCK_AUTH) {
      setUser(null);
      localStorage.removeItem('mockUserType');
      navigate('/login');
      return;
    }
    
    try {
      console.log('👋 Logging out...');
      await authService.logout();
      setUser(null);
      console.log('✅ Logout successful');
      navigate('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear user and navigate even if API call fails
      setUser(null);
      navigate('/login');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    setMockUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

