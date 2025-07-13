"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <Link
              href="/routes/auth/signup"
              className="inline-flex items-center gap-2 text-HG-500 hover:text-HG-400 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Signup
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            variants={itemVariants}
            className="prose prose-lg max-w-none"
          >
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using SYPG (the &quot;Service&quot;), you
                  accept and agree to be bound by the terms and provision of
                  this agreement. If you do not agree to abide by the above,
                  please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  2. Service Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  SYPG is a platform that connects property owners with
                  individuals seeking paying guest accommodations. We provide a
                  marketplace for listing, discovering, and booking PG
                  accommodations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  3. User Responsibilities
                </h2>
                <ul className="text-gray-700 leading-relaxed space-y-2">
                  <li>• Provide accurate and truthful information</li>
                  <li>• Maintain the confidentiality of your account</li>
                  <li>• Use the service in compliance with applicable laws</li>
                  <li>
                    • Respect the rights of other users and property owners
                  </li>
                  <li>• Report any suspicious or fraudulent activity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  4. Property Listings
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Property owners are responsible for the accuracy of their
                  listings. SYPG does not guarantee the availability, condition,
                  or quality of listed properties. All bookings and agreements
                  are between users and property owners.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  5. Payment and Fees
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Payment terms are established between users and property
                  owners. SYPG may charge service fees for certain features. All
                  fees will be clearly disclosed before any transaction.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  6. Prohibited Activities
                </h2>
                <ul className="text-gray-700 leading-relaxed space-y-2">
                  <li>• Posting false or misleading information</li>
                  <li>• Harassment or discrimination</li>
                  <li>• Illegal activities or violations of local laws</li>
                  <li>• Spam or unauthorized commercial communications</li>
                  <li>• Attempting to circumvent security measures</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  7. Limitation of Liability
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  SYPG shall not be liable for any direct, indirect, incidental,
                  special, or consequential damages arising from the use of our
                  service. We provide the platform &quot;as is&quot; without
                  warranties of any kind.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  8. Termination
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to terminate or suspend accounts that
                  violate these terms. Users may terminate their accounts at any
                  time by contacting support.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  9. Changes to Terms
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these terms at any time. Users
                  will be notified of significant changes. Continued use of the
                  service after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  10. Contact Information
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  For questions about these Terms of Service, please contact us
                  at{" "}
                  <a
                    href="https://wa.me/+919182437450"
                    className="text-HG-500 hover:text-HG-400 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                  .
                </p>
              </section>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
