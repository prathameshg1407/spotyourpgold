"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
              Privacy Policy
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
                  1. Information We Collect
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Personal Information
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      We collect information you provide directly to us, such as
                      when you create an account, list a property, or contact
                      us. This includes your name, email address, phone number,
                      and profile information.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Usage Information
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      We automatically collect information about how you use our
                      service, including your IP address, browser type, device
                      information, and pages visited.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  2. How We Use Your Information
                </h2>
                <ul className="text-gray-700 leading-relaxed space-y-2">
                  <li>• To provide, maintain, and improve our services</li>
                  <li>
                    • To process transactions and send related information
                  </li>
                  <li>• To send you technical notices and support messages</li>
                  <li>
                    • To communicate with you about products, services, and
                    events
                  </li>
                  <li>• To monitor and analyze trends and usage</li>
                  <li>
                    • To detect, investigate, and prevent fraudulent
                    transactions
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  3. Information Sharing
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not sell, trade, or otherwise transfer your personal
                  information to third parties without your consent, except in
                  the following circumstances:
                </p>
                <ul className="text-gray-700 leading-relaxed space-y-2">
                  <li>
                    • With property owners when you inquire about their listings
                  </li>
                  <li>
                    • With service providers who assist us in operating our
                    platform
                  </li>
                  <li>• When required by law or to protect our rights</li>
                  <li>
                    • In connection with a merger, acquisition, or sale of
                    assets
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  4. Data Security
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement appropriate technical and organizational measures
                  to protect your personal information against unauthorized
                  access, alteration, disclosure, or destruction. However, no
                  method of transmission over the Internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  5. Cookies and Tracking
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We use cookies and similar tracking technologies to enhance
                  your experience, analyze site usage, and assist in our
                  marketing efforts. You can control cookie settings through
                  your browser preferences.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  6. Your Rights
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="text-gray-700 leading-relaxed space-y-2">
                  <li>• Access and update your personal information</li>
                  <li>• Request deletion of your personal information</li>
                  <li>• Opt-out of certain communications</li>
                  <li>• Request a copy of your personal information</li>
                  <li>• Object to certain processing of your information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  7. Data Retention
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as necessary
                  to provide our services, comply with legal obligations,
                  resolve disputes, and enforce our agreements. You may request
                  deletion of your account at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  8. Third-Party Services
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Our service may contain links to third-party websites or
                  services. We are not responsible for the privacy practices of
                  these third parties. We encourage you to review their privacy
                  policies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  9. Children&apos;s Privacy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Our service is not intended for children under 18. We do not
                  knowingly collect personal information from children under 18.
                  If you become aware that a child has provided us with personal
                  information, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  10. Changes to Privacy Policy
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any changes by posting the new Privacy Policy on
                  this page and updating the &quot;last updated&quot; date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  11. Contact Us
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this Privacy Policy, please
                  contact us at{" "}
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
