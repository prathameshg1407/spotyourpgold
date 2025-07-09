"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LoadingButtonProps {
  isLoading: boolean
  disabled?: boolean
  loadingText: string
  children: React.ReactNode
  type?: "button" | "submit"
  className?: string
}

export const LoadingButton = ({
  isLoading,
  disabled = false,
  loadingText,
  children,
  type = "button",
  className,
}: LoadingButtonProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        type={type}
        className={cn(
          "w-full h-11 bg-HG-500/70 hover:bg-HG-500/90 text-white font-poppins uppercase font-normal rounded-md transition-all duration-200 text-[15px]",
          (isLoading || disabled) && "opacity-90 cursor-not-allowed",
          className,
        )}
        disabled={isLoading || disabled}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              className="h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"
            />
            <span>{loadingText}</span>
          </div>
        ) : (
          children
        )}
      </Button>
    </motion.div>
  )
}
