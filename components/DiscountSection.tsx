"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Percent,
  Gift,
  CheckCircle,
  ArrowRight,
  Star,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function DiscountSection() {
  return (
    <section className="py-12 bg-gradient-to-br from-HG-50 via-white to-HG-100/50 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className="bg-HG-500/10 text-HG-600 border-HG-500/20 px-4 py-2">
              <Gift className="w-4 h-4 mr-2" />
              Limited Time Offer
            </Badge>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 font-poppins">
            Get <span className="text-HG-500">5% Discount</span> on First Rent
            Payment
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto font-inter">
            Book your ideal PG today and enjoy exclusive savings on your first
            month&apos;s rent.
          </p>
        </motion.div>

        {/* Main Discount Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="bg-white border-HG-200/50 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Left Side - Discount Info */}
                <div className="p-6 md:p-8 bg-HG-500 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/20 rounded-full">
                        <Percent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold font-poppins">
                          5% OFF
                        </h3>
                        <p className="text-white/90 font-inter">
                          First Month Rent
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-white/90 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Instant Savings</p>
                          <p className="text-xs text-white/80">
                            Save up to ₹1,500 on premium PGs
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-white/90 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Verified PGs</p>
                          <p className="text-xs text-white/80">
                            Apply on all approved listings
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - CTA */}
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </div>

                    <h4 className="text-xl font-bold text-gray-900 mb-2 font-poppins">
                      Ready to Save?
                    </h4>
                    <p className="text-gray-600 mb-4 font-inter text-sm">
                      Browse verified PGs and apply discount at checkout.
                    </p>

                    <Link href="/routes/all-listings">
                      <Button
                        size="lg"
                        className="w-full bg-HG-500 hover:bg-HG-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group"
                      >
                        <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                        Browse PGs & Save Now
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>

                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-3">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        No hidden fees
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Instant booking
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
