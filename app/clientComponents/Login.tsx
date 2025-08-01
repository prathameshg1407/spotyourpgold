"use client";
import { FormInput } from "@/app/routes/auth/form-input";
import { PasswordToggle } from "@/app/routes/auth/password-toggle";
import { OTPInput } from "@/components/otp-input";
import { LoadingButton } from "@/components/loading-button";
import { ErrorMessage } from "@/app/routes/auth/error-message";
import { formatTimer } from "@/app/routes/auth/validation";
import { Mail, Lock, Phone } from "lucide-react";
import { useLoginForm } from "@/hooks/use-login-form";
import { motion } from "framer-motion";
import Link from "next/link";

interface LoginProps {
  onSuccess?: () => void;
}

const Login = ({ onSuccess }: LoginProps = {}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 20 },
    },
  };

  const MobileLogoIcon = () => (
    <Link href={"/"}>
      <p className="font-poppins font-bold text-HG-500 text-lg tracking-wider">
        SYPG
      </p>
    </Link>
  );

  const {
    currentStep,
    loginData,
    forgotPasswordData,
    otp,
    showPassword,
    showNewPassword,
    showConfirmPassword,
    isLoading,
    errors,
    timer,
    updateLoginData,
    updateForgotPasswordData,
    setShowPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    handleOTPChange,
    handleOTPKeyDown,
    submitLogin,
    submitForgotPassword,
    submitOTP,
    submitResetPassword,
    resendOTP,
    goToForgotPassword,
    backToLogin,
    backToForgotPassword,
    isOTPComplete,
    isTimerExpired,
  } = useLoginForm(onSuccess);

  const getTitle = () => {
    switch (currentStep) {
      case "login":
        return "Log In";
      case "forgot-password":
        return "Reset password";
      case "forgot-otp":
        return "Verify your identity";
      case "reset-password":
        return "Set new password";
      default:
        return "Sign in";
    }
  };

  const getSubtitle = () => {
    switch (currentStep) {
      case "login":
        return "Enter your credentials to access your account";
      case "forgot-password":
        return "Enter your email to receive a reset code";
      case "forgot-otp":
        return `Weve sent a 5-digit code to ${forgotPasswordData.email}. Enter it below to continue.`;
      case "reset-password":
        return "Create a new password for your account";
      default:
        return "Enter your credentials to access your account";
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-[400px]"
    >
      <motion.div variants={iconVariants} className="md:hidden mb-10">
        <MobileLogoIcon />
      </motion.div>

      <motion.h2
        variants={itemVariants}
        className="text-[22px] font-normal text-gray-900 mb-1 pt-8 md:pt-0"
      >
        {getTitle()}
      </motion.h2>
      <motion.p
        variants={itemVariants}
        className="text-[15px] text-gray-500 mb-10"
      >
        {getSubtitle()}
      </motion.p>

      <ErrorMessage message={errors.general} />

      {currentStep === "login" && (
        <form onSubmit={submitLogin}>
          <motion.div variants={containerVariants} className="space-y-4">
            <FormInput
              id="email"
              label="Email"
              type="email"
              value={loginData.email}
              onChange={(value) => updateLoginData("email", value)}
              placeholder="you@company.com"
              icon={Mail}
              hasError={errors.email}
              // required
            />

            <motion.div variants={itemVariants}>
              <div className="relative">
                <FormInput
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(value) => updateLoginData("password", value)}
                  placeholder="••••••••"
                  icon={Lock}
                  hasError={errors.password}
                  // required
                  rightElement={
                    <PasswordToggle
                      showPassword={showPassword}
                      onToggle={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              </div>
              <div className="flex items-center justify-end">
                <motion.button
                  type="button"
                  onClick={goToForgotPassword}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-[14px] font-normal text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Forgot password?
                </motion.button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2">
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                loadingText="Signing in"
              >
                Sign in
              </LoadingButton>
            </motion.div>
          </motion.div>
        </form>
      )}

      {currentStep === "forgot-password" && (
        <form onSubmit={submitForgotPassword}>
          <motion.div variants={containerVariants} className="space-y-4">
            <FormInput
              id="forgot-email"
              label="Email"
              type="email"
              value={forgotPasswordData.email}
              onChange={(value) => updateForgotPasswordData("email", value)}
              placeholder="you@company.com"
              icon={Mail}
              hasError={errors.email}
            />

            <motion.div variants={itemVariants} className="pt-2">
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                loadingText="Sending code"
              >
                Send reset code
              </LoadingButton>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center pt-4">
              <motion.button
                type="button"
                onClick={backToLogin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors"
              >
                ← Back to login
              </motion.button>
            </motion.div>
          </motion.div>
        </form>
      )}

      {currentStep === "forgot-otp" && (
        <form onSubmit={submitOTP}>
          <motion.div variants={containerVariants} className="space-y-6">
            <OTPInput
              otp={otp}
              onChange={handleOTPChange}
              onKeyDown={handleOTPKeyDown}
            />

            <motion.div variants={itemVariants} className="pt-2">
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                loadingText="Verifying"
                disabled={!isOTPComplete}
              >
                Verify & Continue
              </LoadingButton>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center">
              <p className="text-[14px] text-gray-500">
                Didn&apos;t receive the code?{" "}
                {isTimerExpired ? (
                  <motion.button
                    type="button"
                    onClick={resendOTP}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="font-normal text-gray-900 hover:text-gray-700 transition-colors"
                  >
                    Resend code
                  </motion.button>
                ) : (
                  <span className="font-normal text-gray-500">
                    Resend code in {formatTimer(timer)}
                  </span>
                )}
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center pt-4">
              <motion.button
                type="button"
                onClick={backToForgotPassword}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors"
              >
                ← Back to email
              </motion.button>
            </motion.div>
          </motion.div>
        </form>
      )}

      {currentStep === "reset-password" && (
        <form onSubmit={submitResetPassword}>
          <motion.div variants={containerVariants} className="space-y-4">
            <FormInput
              id="newPassword"
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              value={forgotPasswordData.newPassword}
              onChange={(value) =>
                updateForgotPasswordData("newPassword", value)
              }
              placeholder="••••••••"
              icon={Lock}
              hasError={errors.password}
              rightElement={
                <PasswordToggle
                  showPassword={showNewPassword}
                  onToggle={() => setShowNewPassword(!showNewPassword)}
                />
              }
            />

            <FormInput
              id="confirmNewPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              value={forgotPasswordData.confirmPassword}
              onChange={(value) =>
                updateForgotPasswordData("confirmPassword", value)
              }
              placeholder="••••••••"
              icon={Lock}
              hasError={errors.confirmPassword}
              rightElement={
                <PasswordToggle
                  showPassword={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            <motion.div variants={itemVariants} className="pt-2">
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                loadingText="Updating password"
              >
                Update password
              </LoadingButton>
            </motion.div>
          </motion.div>
        </form>
      )}

      {currentStep === "login" && (
        <>
          <motion.div variants={itemVariants} className="mt-2">
            <p className="text-[14px] text-gray-500 text-center">
              Don&apos;t have an account?{" "}
              <Link href="/routes/auth/signup" prefetch={true}>
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="font-normal text-HG-400 hover:text-HG-500 transition-colors"
                >
                  Register
                </motion.span>
              </Link>
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="mt-5">
            <p className="text-[13px] text-gray-400 text-center">
              By signing in, you agree to our{" "}
              <Link href="#">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Terms
                </motion.span>
              </Link>{" "}
              and{" "}
              <Link href="#">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Privacy Policy
                </motion.span>
              </Link>
            </p>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default Login;
