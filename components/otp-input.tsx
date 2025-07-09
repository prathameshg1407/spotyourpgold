"use client"

import type React from "react"

import { motion } from "framer-motion"

interface OTPInputProps {
  otp: string[]
  onChange: (index: number, value: string) => void
  onKeyDown: (index: number, e: React.KeyboardEvent) => void
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
}

export const OTPInput = ({ otp, onChange, onKeyDown }: OTPInputProps) => {

const OTP_LENGTH = 5
const OTP_PATTERN = /^\d*$/

  return (
    <motion.div variants={itemVariants} className="flex justify-center space-x-3">
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <motion.input
          key={index}
          id={`otp-${index}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index]}
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          className="w-12 h-12 font-poppins text-center text-[18px] font-medium border border-gray-200 focus-visible:ring-1 focus-visible:ring-HG-500 rounded-md   focus:outline-none"
          whileFocus={{ scale: 1.05 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </motion.div>
  )
}
