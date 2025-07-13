"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white border-t border-gray-100 mt-auto"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo Section - Left */}
          <div className="flex flex-col items-center md:items-start justify-center">
            <Image
              src="/logo.png"
              alt="SYPG Logo"
              width={220}
              height={220}
              className="transition-shadow duration-300"
            />
          
            <div className="flex items-center gap-2 mt-2">
            
            </div>
          </div>

          {/* About Site - Middle */}
          <div className="flex flex-col items-center justify-start">
            <h4 className="font-semibold text-gray-900 text-lg border-b-2 border-HG-400 pb-2 px-4 mb-5 text-center">
              About Us
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs text-center mb-3">
              Find your perfect paying guest accommodation with verified owners
              and detailed listings across the city.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs text-center">
              We connect property owners with individuals seeking quality PG
              accommodations through our trusted platform.
            </p>
          </div>

          {/* Quick Links - Right */}
          <div className="flex flex-col items-center justify-start">
            <h4 className="font-semibold text-gray-900 text-lg border-b-2 border-HG-400 pb-2 px-4 mb-5">
              Quick Links
            </h4>
            <div className="flex flex-col items-center space-y-3">
              <Link
                href="/routes/terms-of-service"
                className="text-sm text-gray-600 hover:text-HG-500 transition-colors hover:underline"
              >
                Terms of Service
              </Link>
              <Link
                href="/routes/privacy-policy"
                className="text-sm text-gray-600 hover:text-HG-500 transition-colors hover:underline"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 mt-8 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} SYPG. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>by</span>
              <a
                href="#"
                className="font-medium text-HG-500 hover:text-HG-400 transition-colors"
              >
                few technology
              </a>
              <span>•</span>
              <a
                href="https://wa.me/+919182437450"
                target="_blank"
                rel="noopener noreferrer"
                className="text-HG-500 hover:text-HG-400 transition-colors font-medium"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
