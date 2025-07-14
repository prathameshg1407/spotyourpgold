"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Building, Home, Users, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const OwnerListingSection = () => {
  const propertyTypes = [
    {
      icon: Building,
      title: "PGs",
      description: "Paying Guest accommodations",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Home,
      title: "Flats",
      description: "Apartment rentals",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Users,
      title: "Hostels",
      description: "Student accommodations",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Star,
      title: "Rooms",
      description: "Individual room rentals",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-HG-50 to-HG-100/50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 font-poppins"
          >
            Own a Property?{" "}
            <span className="text-HG-500">List it with us!</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-inter"
          >
            Join thousands of property owners who trust SpotYourPG to connect
            them with quality tenants. List your property today and start
            earning!
          </motion.p>
        </div>

        {/* Property Types Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {propertyTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`${type.bgColor} p-6 rounded-2xl text-center hover:shadow-lg transition-all duration-300 hover:scale-105`}
            >
              <type.icon
                className={`w-8 h-8 md:w-12 md:h-12 ${type.color} mx-auto mb-3`}
              />
              <h3 className="font-semibold text-gray-900 text-lg md:text-xl font-poppins">
                {type.title}
              </h3>
              <p className="text-sm md:text-base text-gray-600 mt-1 font-inter">
                {type.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
              Why Choose SpotYourPG?
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-HG-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 font-poppins">
                    Verified Tenants
                  </h4>
                  <p className="text-gray-600 text-sm md:text-base font-inter">
                    All tenants are verified through our secure screening
                    process
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-HG-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 font-poppins">
                    Maximum Exposure
                  </h4>
                  <p className="text-gray-600 text-sm md:text-base font-inter">
                    Your property reaches thousands of potential tenants
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-HG-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 font-poppins">
                    Easy Management
                  </h4>
                  <p className="text-gray-600 text-sm md:text-base font-inter">
                    Manage bookings, payments, and tenant communication in one
                    place
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-HG-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 font-poppins">
                    24/7 Support
                  </h4>
                  <p className="text-gray-600 text-sm md:text-base font-inter">
                    Get help whenever you need it from our dedicated support
                    team
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white p-8 rounded-2xl shadow-lg"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-HG-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 font-poppins">
                Ready to get started?
              </h4>
              <p className="text-gray-600 mb-6 font-inter">
                Join our community of successful property owners and start
                earning more from your property.
              </p>

              <div className="space-y-4">
                <Link href="/routes/owners/onboarding" className="block">
                  <Button
                    size="lg"
                    className="w-full bg-HG-500 hover:bg-HG-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg font-poppins"
                  >
                    List Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>


              </div>
            </div>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center bg-white p-8 md:p-12 rounded-2xl shadow-lg"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-poppins">
            Start earning from your property today!
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto font-inter">
            List your PG, flat, hostel, or room on SpotYourPG and connect with
            thousands of verified tenants looking for quality accommodations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/routes/owners/onboarding">
              <Button
                size="lg"
                className="bg-HG-500 hover:bg-HG-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg font-poppins"
              >
                List Your Property Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OwnerListingSection;
