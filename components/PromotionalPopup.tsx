"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { 
  TicketPercent, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BlurImage } from "@/components/BlurImage";

const PromotionalPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUserStore();

  useEffect(() => {
    // 1. Don't show if user is already logged in
    if (user) return;

    // 2. Check localStorage to see if it was shown recently (last 24 hours)
    const lastShown = localStorage.getItem("promo-popup-last-shown");
    const now = new Date().getTime();
    
    if (lastShown && now - parseInt(lastShown) < 24 * 60 * 60 * 1000) {
      return;
    }

    // 3. Show after a delay
    const timer = setTimeout(() => {
      setIsOpen(true);
      localStorage.setItem("promo-popup-last-shown", now.toString());
    }, 2500);

    return () => clearTimeout(timer);
  }, [user]);

  const handleClose = () => setIsOpen(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-transparent shadow-none">
        <DialogTitle className="sr-only">Promotional Discount Offer</DialogTitle>
        <DialogDescription className="sr-only">
          Get a 5% discount on your first rent payment by logging in and booking your ideal PG today.
        </DialogDescription>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-HG-400/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-HG-500/10 rounded-full -ml-16 -mb-16 blur-3xl" />

          {/* Close Button */}
          <DialogClose className="absolute right-4 top-4 z-10 p-2 rounded-full bg-white/50 backdrop-blur-md hover:bg-white transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </DialogClose>

          {/* Banner Image / Gradient Area */}
          <div className="relative h-48 bg-gradient-to-br from-HG-500 to-HG-400 p-8 flex flex-col justify-end">
            <div className="absolute top-8 left-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-medium">
                <Clock className="w-3 h-3" />
                Limited Time Offer
              </div>
            </div>
            
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white"
            >
              <h3 className="text-3xl font-poppins font-bold leading-tight">
                Unlock Exclusive <br /> Savings
              </h3>
            </motion.div>
            
            <div className="absolute top-4 right-4 text-white/20">
              <TicketPercent className="w-32 h-32 rotate-12" />
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-poppins font-bold text-gray-900">
                Get <span className="text-HG-500">5% Discount</span> on First Rent
              </h2>
              <p className="text-gray-600 font-inter text-sm">
                Book your ideal PG today and enjoy exclusive savings on your first month's rent. Use this limited-time opportunity!
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-HG-50 border border-HG-100">
                <div className="w-8 h-8 rounded-lg bg-HG-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Instant Savings</p>
                  <p className="text-[10px] text-gray-500">Save up to ₹1,500</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-HG-50 border border-HG-100">
                <div className="w-8 h-8 rounded-lg bg-HG-500 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Verified PGs</p>
                  <p className="text-[10px] text-gray-500">Approved listings</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-3 pt-2">
              <Link href="/routes/auth/login" onClick={handleClose}>
                <Button className="w-full h-12 rounded-xl bg-HG-500 hover:bg-HG-600 shadow-lg shadow-HG-500/20 group text-base font-semibold">
                  Login to Claim Offer
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={handleClose}
                  className="text-sm text-gray-500 hover:text-HG-500 transition-colors font-medium"
                >
                  Maybe later, let me browse
                </button>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-HG-400 rounded-full" />
                    No hidden fees
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-HG-400 rounded-full" />
                    Instant booking
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionalPopup;
