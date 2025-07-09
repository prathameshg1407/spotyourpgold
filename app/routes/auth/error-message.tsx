"use client";

import { motion } from "framer-motion";

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  if (!message) return null;

  if (
    message === "Password reset successfully." ||
    message === "OTP sent successfully."
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[14px] rounded"
        role="alert"
        aria-live="polite"
      >
        {message}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-[14px] rounded"
      role="alert"
      aria-live="polite"
    >
      {message}
    </motion.div>
  );
};
