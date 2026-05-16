export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified?: boolean;
  image?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

export interface LoginStartResponse {
  success: boolean;
  message: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface AuthError {
  message: string[];
  error: string;
  statusCode: number;
}
