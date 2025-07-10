import { BankDetailsData, IdentityData, OnboardingErrors } from "../owners/onboarding/page"
import type { FormErrors, SignupFormData, LoginFormData, ForgotPasswordData } from "./auth"

const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 6,
  PATTERNS: {
    LOWERCASE: /[a-z]/,
    UPPERCASE: /[A-Z]/,
    NUMBER: /\d/,
    SPECIAL_CHAR: /[!@#$%^&*(),.?":{}|<>]/,
  },
} as const

const EMAIL_PATTERN = /\S+@\S+\.\S+/

export const validateSignupForm = (data: SignupFormData): FormErrors => {
  const errors: FormErrors = {
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    otp: false,
    general: "",
  }

 if (!data.fullName.trim()) {
    errors.fullName = true;
    errors.general = "Full name is required.";
    return errors;
  }
   if (!/^[a-zA-Z\s&apos;-]+$/.test(data.fullName)) {
    errors.fullName = true;
    errors.general = "Full name can only contain letters, spaces, and hyphens.";
    return errors;
  } 
  if (data.fullName.trim().split(/\s+/).length < 2) {
    errors.fullName = true;
    errors.general = "Please enter your full name (first and last).";
    return errors;
  } 
   if (data.fullName.length > 50) {
    errors.fullName = true;
    errors.general = "Full name should be under 50 characters.";
    return errors;
  }

  if (!data.email.trim()) {
    errors.email = true
    errors.general = "Email is required."
    return errors
  }

  if (!EMAIL_PATTERN.test(data.email)) {
    errors.email = true
    errors.general = "Enter a valid email."
    return errors
  }

  if (!data.password.trim()) {
    errors.password = true
    errors.general = "Password is required."
    return errors
  }

  if (data.password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.password = true
    errors.general = `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters.`
    return errors
  }

  if (!PASSWORD_REQUIREMENTS.PATTERNS.LOWERCASE.test(data.password)) {
    errors.password = true
    errors.general = "Password must contain a lowercase letter."
    return errors
  }

  if (!PASSWORD_REQUIREMENTS.PATTERNS.UPPERCASE.test(data.password)) {
    errors.password = true
    errors.general = "Password must contain an uppercase letter."
    return errors
  }

  if (!PASSWORD_REQUIREMENTS.PATTERNS.NUMBER.test(data.password)) {
    errors.password = true
    errors.general = "Password must contain a number."
    return errors
  }

  if (!PASSWORD_REQUIREMENTS.PATTERNS.SPECIAL_CHAR.test(data.password)) {
    errors.password = true
    errors.general = "Password must contain a special character."
    return errors
  }

  if (!data.confirmPassword.trim()) {
    errors.confirmPassword = true
    errors.general = "Please confirm your password."
    return errors
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = true
    errors.general = "Passwords do not match."
    return errors
  }

  return errors
}

export const validateLoginForm = (data: LoginFormData): FormErrors => {
  const errors: FormErrors = {
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    otp: false,
    general: "",
  }

  if (!data.email.trim()) {
    errors.email = true
    errors.general = "Email is required."
    return errors
  }

  if (!EMAIL_PATTERN.test(data.email)) {
    errors.email = true
    errors.general = "Enter a valid email."
    return errors
  }

  if (!data.password.trim()) {
    errors.password = true
    errors.general = "Password is required."
    return errors
  }

  return errors
}

export const validateForgotPasswordForm = (data: ForgotPasswordData): FormErrors => {
  const errors: FormErrors = {
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    otp: false,
    general: "",
  }

  if (!data.newPassword.trim()) {
    errors.password = true
    errors.general = "New password is required."
    return errors
  }

  if (data.newPassword.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.password = true
    errors.general = `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters.`
    return errors
  }

  if (!PASSWORD_REQUIREMENTS.PATTERNS.LOWERCASE.test(data.newPassword)) {
    errors.password = true
    errors.general = "Password must contain a lowercase letter."
    return errors
  }

  if (!PASSWORD_REQUIREMENTS.PATTERNS.UPPERCASE.test(data.newPassword)) {
    errors.password = true
    errors.general = "Password must contain an uppercase letter."
    return errors
  }

  if (!PASSWORD_REQUIREMENTS.PATTERNS.NUMBER.test(data.newPassword)) {
    errors.password = true
    errors.general = "Password must contain a number."
    return errors
  }

  if (!PASSWORD_REQUIREMENTS.PATTERNS.SPECIAL_CHAR.test(data.newPassword)) {
    errors.password = true
    errors.general = "Password must contain a special character."
    return errors
  }

  if (!data.confirmPassword.trim()) {
    errors.confirmPassword = true
    errors.general = "Please confirm your new password."
    return errors
  }

  if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = true
    errors.general = "Passwords do not match."
    return errors
  }

  return errors
}

export const validateOTP = (otp: string[]): boolean => {
  const otpValue = otp.join("")
  return otpValue.length === 5 && /^\d+$/.test(otpValue)
}

export const formatTimer = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}







const MAX_FILE_SIZE_MB = 2;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const validateIdentity = (data: IdentityData): OnboardingErrors => {
  const errors: OnboardingErrors = {
    aadhaar: false,
    phone: false,
    documents: false,
    accountNumber: false,
    aadharFront: false,
    aadharBack: false,
    ifscCode: false,
    accountHolderName: false,
    bankName: false,
    plan: false,
    billing: false,
    cardNumber: false,
    expiryDate: false,
    cvv: false,
    otp: false,
    upiId: false,
    general: "",
    address: {
      street: false,
      city: false,
      state: false,
      pincode: false,
    },
  };

  const validateFile = (file: File | null, name: string): string | null => {
    if (!file) return `${name} is required.`;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) return `${name} must be under 2MB.`;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `${name} must be JPG, PNG, or WEBP.`;
    return null;
  };

  // Aadhaar Number
  if (!data.aadhaar) {
    errors.aadhaar = true;
    errors.general ||= "Aadhaar number is required.";
  } else if (!/^\d{12}$/.test(data.aadhaar)) {
    errors.aadhaar = true;
    errors.general ||= "Aadhaar number must be exactly 12 digits.";
  }

  // Phone
  if (!data.phone) {
    errors.phone = true;
    errors.general ||= "Phone number is required.";
  } else if (!/^\d{10}$/.test(data.phone)) {
    errors.phone = true;
    errors.general ||= "Phone number must be exactly 10 digits.";
  }

  // // Aadhaar Front
  // const frontError = validateFile(data.aadhaarFront, "Aadhaar Front");
  // if (frontError) {
  //   errors.aadharFront = true;
  //   errors.general ||= frontError;
  // }

  // // Aadhaar Back
  // const backError = validateFile(data.aadhaarBack, "Aadhaar Back");
  // if (backError) {
  //   errors.aadharBack = true;
  //   errors.general ||= backError;
  // }

  // Additional Documents
  if (data.documents.length > 6) {
    errors.documents = true;
    errors.general ||= "You can upload a maximum of 6 documents.";
  } else {
    for (const doc of data.documents) {
      const docError = validateFile(doc, "Document");
      if (docError) {
        errors.documents = true;
        errors.general ||= docError;
        break;
      }
    }
  }

  // Address
  if (!data.address.street) {
    errors.address.street = true;
    errors.general ||= "Street address is required.";
  }
  if (!data.address.city) {
    errors.address.city = true;
    errors.general ||= "City is required.";
  }
  if (!data.address.state) {
    errors.address.state = true;
    errors.general ||= "State is required.";
  }
  if (!data.address.pincode) {
    errors.address.pincode = true;
    errors.general ||= "Pincode is required.";
  } else if (!/^\d{6}$/.test(data.address.pincode)) {
    errors.address.pincode = true;
    errors.general ||= "Pincode must be exactly 6 digits.";
  }

  return errors;
};



export const validateBankDetails = (
  data: BankDetailsData
): Partial<OnboardingErrors> => {
 const errors: OnboardingErrors = {
    aadhaar: false,
    phone: false,
    documents: false,
    accountNumber: false,
    aadharFront: false,
    aadharBack: false,
    ifscCode: false,
    accountHolderName: false,
    bankName: false,
    plan: false,
    billing: false,
    cardNumber: false,
    expiryDate: false,
    cvv: false,
    otp: false,
    upiId: false,
    general: "",
    address: {
      street: false,
      city: false,
      state: false,
      pincode: false,
    },
  };

  // Account Number
  // if (!data.accountNumber) {
  //    errors.accountNumber = true;
  //   errors.general ||= "Account number is required";
  // } else 
  // if (!/^\d{9,18}$/.test(data.accountNumber)) {
  //   errors.accountNumber = true;
  //       errors.general = "Account number must be 9–18 digits";
  // }

  // IFSC Code
  // if (!data.ifscCode) {
  //   errors.ifscCode = true;
  //   errors.general = "IFSC code is required";
  // } else
  //  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode)) {
  //   errors.ifscCode = true;
  //   errors.general = "Invalid IFSC code format";
  // }

  // Account Holder Name
  // if (!data.accountHolderName) {
  //   errors.accountHolderName = true;
  //   errors.general = "Account holder name is required";
  // }

  // Bank Name
  // if (!data.bankName) {
  //   errors.bankName = true;
  //   errors.general = "Bank name is required";
  // }

  // Optional: UPI validation (if user entered it)
  if (data.upiId && !/^[\w.-]+@[\w]+$/.test(data.upiId)) {
    errors.upiId = true;  
    errors.general = "Invalid UPI ID format";
  }

  return errors;
};