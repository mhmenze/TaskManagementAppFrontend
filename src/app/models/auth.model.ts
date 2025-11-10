export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userID: number;
  username: string;
  displayName: string;
  email: string;
  message: string;
  success: boolean;
}

export interface RegisterRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  createdBy?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}