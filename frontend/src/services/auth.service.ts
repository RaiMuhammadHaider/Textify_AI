import api from './api';
import { AuthResponse, LoginStartResponse, MessageResponse } from '../types/auth';

export const authService = {
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', {
      name,
      email,
      password,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<LoginStartResponse> {
    const response = await api.post<LoginStartResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async verifyLoginOtp(otp: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/verify-otp', {
      otp,
    });
    return response.data;
  },

  async forgotPassword(email: string): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  async verifyResetOtp(otp: string): Promise<MessageResponse> {
    const response = await api.post<MessageResponse>('/auth/verify-reset-otp', {
      otp,
    });
    return response.data;
  },

  async resetPassword(otp: string, newPassword: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/reset-password', {
      otp,
      newPassword,
    });
    return response.data;
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};
