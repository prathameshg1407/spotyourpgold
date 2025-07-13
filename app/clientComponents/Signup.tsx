"use client";
import { FormInput } from "../routes/auth/form-input";
import { PasswordToggle } from "../routes/auth/password-toggle";
import { OTPInput } from "@/components/otp-input";
import { LoadingButton } from "@/components/loading-button";
import { ErrorMessage } from "@/app/routes/auth/error-message";
import { useSignupForm } from "@/hooks/use-signup-form";
import { formatTimer } from "@/app/routes/auth/validation";
import { Mail, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const Signup = () => {
  const {
    formData,
    otp,
    showPassword,
    showConfirmPassword,
    showOTP,
    isLoading,
    errors,
    timer,
    termsAccepted,
    updateFormData,
    setShowPassword,
    setShowConfirmPassword,
    handleOTPChange,
    handleOTPKeyDown,
    submitSignupForm,
    submitOTP,
    resendOTP,
    backToSignup,
    setTermsAccepted,
    isOTPComplete,
    isTimerExpired,
  } = useSignupForm();

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

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

      {!showOTP && (
        <>
          <motion.h2
            variants={itemVariants}
            className="text-[22px] font-normal text-gray-900 mb-1"
          >
            Sign up
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-[15px] text-gray-500 mb-3"
          >
            Create your account to get started
          </motion.p>
        </>
      )}

      <ErrorMessage message={errors.general} />

      {!showOTP ? (
        <form onSubmit={submitSignupForm}>
          <motion.div variants={containerVariants} className="space-y-4">
            <FormInput
              id="fullName"
              label="Full Name"
              type="text"
              value={formData.fullName}
              onChange={(value) => updateFormData("fullName", value)}
              placeholder="John Doe"
              icon={User}
              hasError={errors.fullName}
              // required
            />

            <FormInput
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => updateFormData("email", value)}
              placeholder="you@company.com"
              icon={Mail}
              hasError={errors.email}
              // required
            />

            <FormInput
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(value) => updateFormData("password", value)}
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

            <FormInput
              id="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(value) => updateFormData("confirmPassword", value)}
              placeholder="••••••••"
              icon={Lock}
              hasError={errors.confirmPassword}
              // required
              rightElement={
                <PasswordToggle
                  showPassword={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            <motion.div variants={itemVariants} className="pt-2">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-HG-500 focus:ring-HG-500 focus:ring-offset-0"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-700 leading-5"
                >
                  I agree to the{" "}
                  <Link
                    href="/routes/terms-of-service"
                    className="text-HG-500 hover:text-HG-400 transition-colors underline"
                    target="_blank"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/routes/privacy-policy"
                    className="text-HG-500 hover:text-HG-400 transition-colors underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
              <LoadingButton
                type="submit"
                isLoading={isLoading}
                loadingText="Sending OTP"
              >
                Create Account
              </LoadingButton>
            </motion.div>
          </motion.div>
        </form>
      ) : (
        <form onSubmit={submitOTP}>
          <motion.div variants={containerVariants} className="space-y-6">
            <motion.div variants={itemVariants} className="text-center">
              <h3 className="text-[18px] font-normal text-gray-900 mb-2">
                Verify your identity
              </h3>
              <p className="text-[14px] text-gray-500 mb-8 text-center">
                We&apos;ve sent a 5-digit code to {formData.email}. Enter it
                below to continue.
              </p>
            </motion.div>

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
                    className="font-normal text-HG-500 hover:text-HG-400 transition-colors"
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
                onClick={backToSignup}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-[14px] text-HG-500 hover:text-HG-400 transition-colors"
              >
                ← Back to signup
              </motion.button>
            </motion.div>
          </motion.div>
        </form>
      )}

      {!showOTP && (
        <>
          <motion.div variants={itemVariants} className="mt-2">
            <p className="text-[14px] text-gray-500 text-center">
              Already have an account?{" "}
              <Link href="/routes/auth/login" prefetch={true}>
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="font-normal text-HG-400 hover:text-HG-500 transition-colors"
                >
                  Log In
                </motion.span>
              </Link>
            </p>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default Signup;
