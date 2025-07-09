"use client"

import { motion } from "framer-motion"
import { Shield, Clock, Zap, Globe } from "lucide-react"
import Link from "next/link"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
}

const iconVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
  },
}

const features = [
  {
    icon: Shield,
    text: "Seamless experience across cities",
  },
  {
    icon: Clock,
    text: "24/7 support for tenants and owners",
  },
  {
    icon: Zap,
    text: "99.9% uptime for uninterrupted discovery",
  },
  {
    icon: Globe,
    text: "Global payment processing",
  },
]

const LogoIcon = () => (
  
    <Link href={"/"}>
    <p className="font-poppins font-bold text-HG-500 text-2xl pb-10">
      SYPG
    </p>
    </Link>
)

export const BrandPanel = () => {
  return (
    <div className="hidden md:flex md:w-5/12 bg-HG-400/10 items-center justify-center p-12">
    {/* <div className="hidden md:flex md:w-5/12 bg-[#FAFAFA] items-center justify-center p-12"> */}
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-md">
        <motion.div variants={iconVariants} className="mb-12">
          <LogoIcon />
          <motion.h1 variants={itemVariants} className="text-[28px] font-inter leading-[1.2] font-light text-gray-600 mb-6">
            Your trusted partner for modern PG living
          </motion.h1>
          <motion.p variants={itemVariants} className="text-gray-500 text-[15px] leading-relaxed">
            Millions of students and working professionals rely on Spot Your PG to find verified PG accommodations,
            connect with ideal roommates, and manage their stays — all in one place.
          </motion.p>
        </motion.div>

        <motion.div variants={containerVariants} className="space-y-6">
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants} className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-HG-400/30 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-gray-600" />
              </div>
              <span className="text-[15px] text-gray-700">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
