"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Calendar,
  Clock,
  Phone,
  User,
  MessageSquare,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { motion } from "framer-motion";

interface VisitRequestFormProps {
  listingId: string;
  pgName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function VisitRequestForm({
  listingId,
  pgName,
  onSuccess,
  onCancel,
}: VisitRequestFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    message: "",
    consent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = [
    "Morning (10 AM - 12 PM)",
    "Afternoon (12 PM - 3 PM)",
    "Evening (3 PM - 6 PM)",
    "Late Evening (6 PM - 8 PM)",
  ];

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTimeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      time: value,
    }));
  };

  const handleConsentChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      consent: checked,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error("Please enter your mobile number");
      return false;
    }

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error("Mobile number must be exactly 10 digits");
      return false;
    }

    if (!formData.date) {
      toast.error("Please select your preferred visit date");
      return false;
    }

    if (!formData.time) {
      toast.error("Please select your preferred time slot");
      return false;
    }

    if (!formData.consent) {
      toast.error("Please give consent to share your contact details");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/visit-request", {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        listingId,
        preferredDate: formData.date,
        preferredTime: formData.time,
        message: formData.message.trim(),
        consent: formData.consent,
      });

      if (response.data.success) {
        toast.success(response.data.message);

        // Reset form
        setFormData({
          name: "",
          phone: "",
          date: "",
          time: "",
          message: "",
          consent: false,
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[99999]"
    >
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl font-poppins text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-HG-500" />
            Schedule a Visit
          </CardTitle>
          <CardDescription className="font-inter">
            Request a visit to <strong>{pgName}</strong>. The property owner
            will contact you to confirm the appointment.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <Label
                htmlFor="name"
                className="font-poppins flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 font-inter"
                placeholder="Enter your full name"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <Label
                htmlFor="phone"
                className="font-poppins flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Mobile Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 font-inter"
                placeholder="9876543210"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter 10-digit mobile number
              </p>
            </div>

            {/* Preferred Visit Date */}
            <div>
              <Label
                htmlFor="date"
                className="font-poppins flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Preferred Visit Date *
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="mt-1 font-inter"
                min={getMinDate()}
              />
            </div>

            {/* Preferred Time Slot */}
            <div>
              <Label className="font-poppins flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Preferred Time Slot *
              </Label>
              <Select value={formData.time} onValueChange={handleTimeChange}>
                <SelectTrigger className="mt-1 font-inter">
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot} className="font-inter">
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Special Requests */}
            <div>
              <Label
                htmlFor="message"
                className="font-poppins flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Special Requests (Optional)
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                className="mt-1 font-inter"
                placeholder="Any specific requirements or questions..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.message.length}/500 characters
              </p>
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start space-x-3 p-4 bg-HG-50 rounded-lg border">
              <Checkbox
                id="consent"
                checked={formData.consent}
                onCheckedChange={handleConsentChange}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="consent"
                  className="text-sm font-inter cursor-pointer flex items-start gap-2"
                >
                  <Shield className="w-4 h-4 text-HG-500 mt-0.5 flex-shrink-0" />
                  <span>
                    I consent to share my contact details with the property
                    owner for scheduling this visit. *
                  </span>
                </Label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 font-poppins"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-HG-500 hover:bg-HG-600 text-white font-poppins"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Visit
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
