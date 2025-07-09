"use client"

import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"

interface PasswordToggleProps {
  showPassword: boolean
  onToggle: () => void
}

export const PasswordToggle = ({ showPassword, onToggle }: PasswordToggleProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      type="button"
      onClick={onToggle}
      className="text-gray-400 hover:text-gray-600 focus:outline-none"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </motion.button>
  )
}
