export interface FormErrors {
  fullName: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
  otp: boolean;
  mobile: boolean;
  general: string;
}

export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  mobile: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OTPData {
  digits: string[];
  isComplete: boolean;
}

export type LoginStep =
  | "login"
  | "forgot-password"
  | "forgot-otp"
  | "reset-password";
