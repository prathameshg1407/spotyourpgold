"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  CreditCard,
  Wallet,
  CheckCircle,
  Loader2,
  Info,
  Shield,
  Home,
  IndianRupee,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { BlurImage } from "@/components/BlurImage";
import RazorpayCheckout, {
  RazorpaySuccessResponse,
} from "@/components/payments/RazorpayCheckout";

// Types
interface RoomType {
  type: string;
  monthlyRent: number;
  availableRooms: number;
  capacityPerRoom: number;
  securityDeposit: number;
  isAC?: boolean;
}

interface BookingFormData {
  moveInDate: string;
  duration: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  aadhaarNumber: string;
  additionalRequirements: string;
  termsAccepted: boolean;
  couponCode: string;
  paymentMethod: "online" | "cash";
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    _id?: string;
    pgName: string;
    primaryImage?: string;
    images: { url: string }[];
    minRent: number;
    roomTypes: RoomType[];
    location: {
      area: string;
      city: string;
    };
    detailedRules?: {
      noticePeriod?: string;
      lockInPeriod?: string;
    };
  };
  user: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  } | null;
}

// Payment Breakdown Component
const BookingPaymentBreakdown = ({
  selectedRoomType,
  discountAmount,
  couponCode,
  paymentMethod,
}: {
  selectedRoomType: RoomType | null;
  discountAmount: number;
  couponCode: string;
  paymentMethod: "online" | "cash";
}) => {
  if (!selectedRoomType) return null;

  const monthlyRent = selectedRoomType.monthlyRent;
  const finalMonthlyRent = monthlyRent - discountAmount;
  const bookingFee = Math.round(finalMonthlyRent * 0.1);
  const firstMonthRent = Math.round(finalMonthlyRent * 0.9);
  const securityDeposit = selectedRoomType.securityDeposit;
  const totalAmount = bookingFee + securityDeposit + firstMonthRent;

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
      <h4 className="font-semibold text-lg flex items-center gap-2">
        <IndianRupee className="h-5 w-5 text-HG-500" />
        Payment Details
      </h4>

      {discountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Original Monthly Rent</span>
          <span className="line-through text-gray-400">
            {formatCurrency(monthlyRent)}
          </span>
        </div>
      )}

      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span className="flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" />
            Discount {couponCode && `(${couponCode})`}
          </span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>
      )}

      <Separator />

      {paymentMethod === "online" ? (
        <>
          {/* Only show booking fee for online payment */}
          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 bg-white rounded-lg border-2 border-HG-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-HG-100 rounded-lg">
                  <CreditCard className="h-4 w-4 text-HG-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Booking Fee</p>
                  <p className="text-xs text-gray-500">
                    10% of monthly rent - Pay now to confirm
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-HG-600">{formatCurrency(bookingFee)}</p>
                <Badge variant="outline" className="text-[10px] bg-HG-50 text-HG-700 border-HG-300">
                  Pay Now
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-lg">Amount to Pay Now</span>
            <span className="font-bold text-2xl text-HG-600">
              {formatCurrency(bookingFee)}
            </span>
          </div>

          {/* Info about remaining payment */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-blue-600" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Remaining Payment</p>
                <p className="text-xs mt-1">
                  After owner approval, you'll need to pay:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
                  <li>Security Deposit: {formatCurrency(securityDeposit)}</li>
                  <li>First Month Rent (90%): {formatCurrency(firstMonthRent)}</li>
                  <li className="font-medium">Total: {formatCurrency(securityDeposit + firstMonthRent)}</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Show full breakdown for cash payment */}
          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Booking Fee (10%)</p>
                  <p className="text-xs text-gray-500">Part of total payment</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCurrency(bookingFee)}</p>
              </div>
            </div>

            <div className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Shield className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Security Deposit</p>
                  <p className="text-xs text-gray-500">Refundable at checkout</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCurrency(securityDeposit)}</p>
              </div>
            </div>

            <div className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Home className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">First Month Rent (90%)</p>
                  <p className="text-xs text-gray-500">Remaining after booking fee</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCurrency(firstMonthRent)}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-lg">Total Amount</span>
            <span className="font-bold text-2xl text-gray-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-yellow-600" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Cash Payment</p>
                <p className="text-xs mt-1">
                  Pay the full amount ({formatCurrency(totalAmount)}) to the owner in cash when visiting the property.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function BookingModal({
  isOpen,
  onClose,
  listing,
  user,
}: BookingModalProps) {
  const router = useRouter();
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    moveInDate: "",
    duration: "1",
    fullName: user?.fullName || "",
    phoneNumber: user?.phone || "",
    email: user?.email || "",
    address: { street: "", city: "", state: "", pincode: "" },
    aadhaarNumber: "",
    additionalRequirements: "",
    termsAccepted: false,
    couponCode: "",
    paymentMethod: "online",
  });

  const [couponData, setCouponData] = useState<{ name: string; percentage: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [razorpayOrder, setRazorpayOrder] = useState<{
    orderId: string;
    amount: number;
    bookingId: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setBookingStep(1);
    setSelectedRoomType(null);
    setBookingForm({
      moveInDate: "",
      duration: "1",
      fullName: user?.fullName || "",
      phoneNumber: user?.phone || "",
      email: user?.email || "",
      address: { street: "", city: "", state: "", pincode: "" },
      aadhaarNumber: "",
      additionalRequirements: "",
      termsAccepted: false,
      couponCode: "",
      paymentMethod: "online",
    });
    setCouponData(null);
    setCouponError(null);
    setRazorpayOrder(null);
    setPaymentSuccess(false);
    setCreatedBookingId(null);
    onClose();
  };

  const handleFormChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      if (parent === "address") {
        setBookingForm((prev) => ({
          ...prev,
          address: { ...prev.address, [child]: value },
        }));
      }
    } else {
      setBookingForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Coupon validation
  const validateCoupon = async (couponCode: string) => {
    if (!couponCode.trim()) {
      setCouponData(null);
      setCouponError(null);
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError(null);

      const response = await fetch("/api/coupon-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode }),
      });

      const data = await response.json();

      if (data.success) {
        setCouponData(data.data);
        setCouponError(null);
      } else {
        setCouponData(null);
        setCouponError(data.message || "Invalid coupon code");
      }
    } catch (error) {
      setCouponData(null);
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCouponChange = (value: string) => {
    setBookingForm((prev) => ({ ...prev, couponCode: value.toUpperCase() }));
    if (couponData || couponError) {
      setCouponData(null);
      setCouponError(null);
    }
  };

  const calculateDiscount = () => {
    if (!couponData || !selectedRoomType) return 0;
    return Math.round((selectedRoomType.monthlyRent * couponData.percentage) / 100);
  };

  const calculateFinalAmount = () => {
    if (!selectedRoomType) return 0;
    return selectedRoomType.monthlyRent - calculateDiscount();
  };

  const calculateBookingFee = () => {
    return Math.round(calculateFinalAmount() * 0.1);
  };

  // Step validation
  const validateStep1 = () => {
    if (!selectedRoomType) {
      toast.error("Please select a room type");
      return false;
    }
    if (!bookingForm.moveInDate) {
      toast.error("Please select a move-in date");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!bookingForm.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!bookingForm.phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!bookingForm.email.trim()) {
      toast.error("Please enter your email address");
      return false;
    }
    if (!bookingForm.address.street.trim()) {
      toast.error("Please enter your street address");
      return false;
    }
    if (!bookingForm.address.city.trim()) {
      toast.error("Please enter your city");
      return false;
    }
    if (!bookingForm.address.state.trim()) {
      toast.error("Please enter your state");
      return false;
    }
    if (!bookingForm.address.pincode.trim()) {
      toast.error("Please enter your pincode");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (bookingStep === 1 && validateStep1()) setBookingStep(2);
    else if (bookingStep === 2 && validateStep2()) setBookingStep(3);
  };

  const handlePrevStep = () => {
    if (bookingStep > 1) setBookingStep(bookingStep - 1);
  };

  // Submit booking
  const handleBookingSubmit = async () => {
    if (!user) {
      toast.error("Please log in to submit booking");
      return;
    }

    if (!selectedRoomType || !listing?._id) {
      toast.error("Invalid booking data");
      return;
    }

    if (!bookingForm.termsAccepted) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setBookingInProgress(true);

    try {
      const response = await axios.post("/api/booking", {
        userId: user.id,
        listingId: listing._id,
        roomType: selectedRoomType.type,
        moveInDate: bookingForm.moveInDate,
        duration: bookingForm.duration,
        fullName: bookingForm.fullName,
        phoneNumber: bookingForm.phoneNumber,
        email: bookingForm.email,
        address: bookingForm.address,
        aadhaarNumber: bookingForm.aadhaarNumber,
        additionalRequirements: bookingForm.additionalRequirements,
        termsAccepted: bookingForm.termsAccepted,
        couponCode: bookingForm.couponCode || null,
        paymentMethod: bookingForm.paymentMethod,
      });

      if (response.data.success) {
        const bookingData = response.data.data;
        setCreatedBookingId(bookingData.booking._id);

        if (bookingForm.paymentMethod === "online" && bookingData.razorpayOrder) {
          setRazorpayOrder({
            orderId: bookingData.razorpayOrder.orderId,
            amount: bookingData.razorpayOrder.amount,
            bookingId: bookingData.booking._id,
          });
          setBookingStep(4);
        } else {
          setPaymentSuccess(true);
          setBookingStep(5);
        }
      } else {
        toast.error(response.data.message || "Failed to submit booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setBookingInProgress(false);
    }
  };

  const handlePaymentSuccess = async (response: RazorpaySuccessResponse) => {
    if (!razorpayOrder) return;

    try {
      setBookingInProgress(true);

      const verifyResponse = await fetch(
        `/api/booking/${razorpayOrder.bookingId}/verify-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentType: "booking_fee",
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        }
      );

      const data = await verifyResponse.json();

      if (data.success) {
        setPaymentSuccess(true);
        setBookingStep(5);
        toast.success("Payment successful!");
      } else {
        toast.error(data.message || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Payment verification failed. Please contact support.");
    } finally {
      setBookingInProgress(false);
    }
  };

  const handlePaymentFailure = () => {
    toast.error("Payment failed. Please try again.");
    setRazorpayOrder(null);
    setBookingStep(3);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-2xl font-bold font-poppins text-gray-900">
              {bookingStep === 5 ? "Booking Confirmed!" : "Book Your Stay"}
            </h3>
            {bookingStep < 5 && (
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        bookingStep >= step
                          ? "bg-HG-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {bookingStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                    </div>
                    {step < 4 && (
                      <div className={`w-8 h-1 ${bookingStep > step ? "bg-HG-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Property Summary */}
          {bookingStep < 5 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                  <BlurImage
                    src={listing?.primaryImage || listing?.images[0]?.url || ""}
                    alt={listing?.pgName || ""}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-gray-900">{listing?.pgName}</h4>
                  <p className="text-gray-600 text-sm">
                    {listing?.location?.area}, {listing?.location?.city}
                  </p>
                  <p className="text-HG-600 font-bold text-lg">
                    ₹{listing?.minRent?.toLocaleString()}/month
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Room Selection */}
          {bookingStep === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-4">Select Room Type</h4>
                <div className="space-y-3">
                  {listing?.roomTypes?.map((roomType, index) => (
                    <div
                      key={index}
                      onClick={() => roomType.availableRooms > 0 && setSelectedRoomType(roomType)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        roomType.availableRooms === 0
                          ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                          : selectedRoomType?.type === roomType.type
                          ? "border-HG-500 bg-HG-50"
                          : "border-gray-200 hover:border-HG-400"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium text-gray-900 capitalize">{roomType.type}</h5>
                          <p className="text-sm text-gray-600">
                            {roomType.capacityPerRoom} person • {roomType.availableRooms} rooms available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-HG-600">
                            ₹{roomType.monthlyRent?.toLocaleString()}/month
                          </p>
                          <p className="text-sm text-gray-600">
                            Deposit: ₹{roomType.securityDeposit?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-4">Booking Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Move-in Date *
                    </label>
                    <input
                      type="date"
                      value={bookingForm.moveInDate}
                      onChange={(e) => handleFormChange("moveInDate", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (months)
                    </label>
                    <select
                      value={bookingForm.duration}
                      onChange={(e) => handleFormChange("duration", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                    >
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {bookingStep === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={bookingForm.fullName}
                      onChange={(e) => handleFormChange("fullName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={bookingForm.phoneNumber}
                      onChange={(e) => handleFormChange("phoneNumber", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => handleFormChange("email", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-4">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                    <input
                      type="text"
                      value={bookingForm.address.street}
                      onChange={(e) => handleFormChange("address.street", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      placeholder="Enter your street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={bookingForm.address.city}
                      onChange={(e) => handleFormChange("address.city", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      placeholder="Enter your city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      value={bookingForm.address.state}
                      onChange={(e) => handleFormChange("address.state", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      placeholder="Enter your state"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                    <input
                      type="text"
                      value={bookingForm.address.pincode}
                      onChange={(e) => handleFormChange("address.pincode", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      placeholder="Enter your pincode"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Number (Optional)</label>
                    <input
                      type="text"
                      value={bookingForm.aadhaarNumber}
                      onChange={(e) => handleFormChange("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                      placeholder="12-digit Aadhaar number"
                      maxLength={12}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Requirements</label>
                <textarea
                  value={bookingForm.additionalRequirements}
                  onChange={(e) => handleFormChange("additionalRequirements", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any special requirements or preferences..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment Method & Review */}
          {bookingStep === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-4">Choose Payment Method</h4>
                <RadioGroup
                  value={bookingForm.paymentMethod}
                  onValueChange={(value) => handleFormChange("paymentMethod", value)}
                  className="space-y-3"
                >
                  <div
                    className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      bookingForm.paymentMethod === "online"
                        ? "border-HG-500 bg-HG-50"
                        : "border-gray-200 hover:border-HG-300"
                    }`}
                    onClick={() => handleFormChange("paymentMethod", "online")}
                  >
                    <RadioGroupItem value="online" id="online" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-HG-600" />
                        <Label htmlFor="online" className="font-semibold text-gray-900 cursor-pointer">
                          Pay Booking Fee Online (Recommended)
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Pay 10% booking fee now to confirm. Remaining payment after owner approval.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">UPI</Badge>
                        <Badge variant="outline" className="text-[10px]">Cards</Badge>
                        <Badge variant="outline" className="text-[10px]">Net Banking</Badge>
                        <Badge variant="outline" className="text-[10px]">Wallets</Badge>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      bookingForm.paymentMethod === "cash"
                        ? "border-HG-500 bg-HG-50"
                        : "border-gray-200 hover:border-HG-300"
                    }`}
                    onClick={() => handleFormChange("paymentMethod", "cash")}
                  >
                    <RadioGroupItem value="cash" id="cash" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-green-600" />
                        <Label htmlFor="cash" className="font-semibold text-gray-900 cursor-pointer">
                          Pay in Cash
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Submit booking request and pay the full amount to owner when visiting.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Coupon Code */}
              <div>
                <h4 className="font-semibold text-lg mb-4">Have a Coupon?</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bookingForm.couponCode}
                    onChange={(e) => handleCouponChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-HG-500 focus:border-transparent uppercase"
                    placeholder="Enter coupon code"
                  />
                  <Button
                    type="button"
                    onClick={() => validateCoupon(bookingForm.couponCode)}
                    disabled={!bookingForm.couponCode.trim() || couponLoading}
                    variant="outline"
                  >
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
                {couponData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">
                        {couponData.name} - {couponData.percentage}% discount applied!
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Breakdown */}
              <BookingPaymentBreakdown
                selectedRoomType={selectedRoomType}
                discountAmount={calculateDiscount()}
                couponCode={bookingForm.couponCode}
                paymentMethod={bookingForm.paymentMethod}
              />

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={bookingForm.termsAccepted}
                  onChange={(e) => handleFormChange("termsAccepted", e.target.checked)}
                  className="mt-1 h-4 w-4 text-HG-600 focus:ring-HG-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the terms and conditions, including the security deposit,
                  notice period ({listing?.detailedRules?.noticePeriod || "1 month"}),
                  and lock-in period ({listing?.detailedRules?.lockInPeriod || "None"}) requirements.
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Razorpay Payment */}
          {bookingStep === 4 && razorpayOrder && (
            <div className="space-y-6 text-center py-8">
              <div className="w-20 h-20 bg-HG-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="w-10 h-10 text-HG-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900">Complete Payment</h4>
              <p className="text-gray-600">
                Pay the booking fee of{" "}
                <span className="font-bold text-HG-600">
                  ₹{razorpayOrder.amount.toLocaleString()}
                </span>{" "}
                to confirm your booking.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 max-w-md mx-auto">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Booking Fee (10%)</span>
                  <span className="font-medium">₹{razorpayOrder.amount.toLocaleString()}</span>
                </div>
                <Separator className="my-3" />
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Secure payment via Razorpay</p>
                  <p>• Instant booking confirmation</p>
                  <p>• Pay remaining after approval</p>
                </div>
              </div>

              <div className="max-w-md mx-auto">
                <RazorpayCheckout
                  orderId={razorpayOrder.orderId}
                  amount={razorpayOrder.amount}
                  description={`Booking Fee for ${listing?.pgName}`}
                  prefill={{
                    name: bookingForm.fullName,
                    email: bookingForm.email,
                    contact: bookingForm.phoneNumber,
                  }}
                  onSuccess={handlePaymentSuccess}
                  onFailure={handlePaymentFailure}
                  onDismiss={() => {}}
                  buttonText={`Pay ₹${razorpayOrder.amount.toLocaleString()}`}
                  fullWidth
                  loading={bookingInProgress}
                />
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setBookingStep(3);
                  setRazorpayOrder(null);
                }}
                className="text-gray-500"
              >
                ← Go Back
              </Button>
            </div>
          )}

          {/* Step 5: Success */}
          {bookingStep === 5 && paymentSuccess && (
            <div className="space-y-6 text-center py-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-14 h-14 text-green-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900">Booking Submitted!</h4>

              {bookingForm.paymentMethod === "online" ? (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Your booking fee has been received. The owner will review your request.
                  </p>
                  <div className="bg-HG-50 rounded-xl p-4 max-w-md mx-auto text-left">
                    <h5 className="font-semibold text-HG-700 mb-2">Next Steps:</h5>
                    <ol className="text-sm text-HG-600 space-y-2 list-decimal list-inside">
                      <li>Owner reviews your booking request</li>
                      <li>You'll receive a notification on approval</li>
                      <li>Complete remaining payment (Deposit + First Month Rent)</li>
                      <li>Move in on your selected date!</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Your booking request has been submitted. The owner will contact you shortly.
                  </p>
                  <div className="bg-yellow-50 rounded-xl p-4 max-w-md mx-auto text-left">
                    <h5 className="font-semibold text-yellow-700 mb-2">Next Steps:</h5>
                    <ol className="text-sm text-yellow-600 space-y-2 list-decimal list-inside">
                      <li>Owner reviews your booking request</li>
                      <li>Owner contacts you to arrange visit/payment</li>
                      <li>Pay full amount in cash to owner</li>
                      <li>Move in on your selected date!</li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={handleClose} variant="outline">
                  Close
                </Button>
                <Button
                  onClick={() => router.push("/routes/dashboard/user/payments")}
                  className="bg-HG-500 hover:bg-HG-600"
                >
                  View My Bookings
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {bookingStep < 4 && (
            <div className="flex gap-4 mt-8">
              {bookingStep > 1 && (
                <Button onClick={handlePrevStep} variant="outline" className="flex-1">
                  Previous
                </Button>
              )}
              {bookingStep < 3 ? (
                <Button onClick={handleNextStep} className="flex-1 bg-HG-500 hover:bg-HG-600">
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleBookingSubmit}
                  disabled={!bookingForm.termsAccepted || bookingInProgress}
                  className="flex-1 bg-HG-500 hover:bg-HG-600 disabled:bg-gray-300"
                >
                  {bookingInProgress ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : bookingForm.paymentMethod === "online" ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Proceed to Pay ₹{calculateBookingFee().toLocaleString()}
                    </>
                  ) : (
                    "Submit Booking Request"
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}