import axiosInstance from '@/utils/axios';
import { API_ENDPOINTS } from '@/config/api';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';

export const authService = {
  /**
   * Login user with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    
    // Backend returns: { success, message, data: { user, accessToken, refreshToken } }
    if (response.data.success && response.data.data) {
      const { accessToken, refreshToken, user } = response.data.data;
      
      if (accessToken) {
        localStorage.setItem('token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      return {
        success: true,
        message: response.data.message,
        token: accessToken,
        user: user
      };
    }
    
    return {
      success: false,
      message: response.data.message || 'Login failed'
    };
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, data);
    
    // Backend returns: { success, message, data: { user } }
    return {
      success: response.data.success,
      message: response.data.message,
      user: response.data.data
    };
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.ME);
    
    // Backend returns: { success, message, data: { user, profile } }
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch user');
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    
    return {
      success: response.data.success,
      message: response.data.message
    };
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    
    return {
      success: response.data.success,
      message: response.data.message
    };
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password });
    
    return {
      success: response.data.success,
      message: response.data.message
    };
  },

  /**
   * Change password (authenticated)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword
    });
    
    return {
      success: response.data.success,
      message: response.data.message
    };
  },

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

