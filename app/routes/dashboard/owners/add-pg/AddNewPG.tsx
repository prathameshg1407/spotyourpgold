// "use client";

// import type React from "react";

// import { useState, useRef, useCallback, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Progress } from "@/components/ui/progress";
// import {
//   MapPin,
//   Upload,
//   X,
//   IndianRupee,
//   Shield,
//   Camera,
//   CreditCard,
//   CheckCircle,
//   AlertCircle,
//   Wifi,
//   Car,
//   Utensils,
//   Dumbbell,
//   Tv,
//   AirVent,
//   Shirt,
//   Coffee,
//   Users,
//   Clock,
//   Building,
//   ListCollapse,
//   BedDouble,
//   ArrowLeft,
//   ArrowRight,
//   BrushCleaning,
//   Plus,
//   Loader2,
//   Navigation,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import { ErrorMessage } from "@/app/routes/auth/error-message";
// import { FormInput } from "@/app/routes/auth/form-input";
// import { BlurImage } from "@/components/BlurImage";
// import { toast } from "sonner";
// import axios from "axios";
// import { useUserStore } from "@/store/userStore";
// import { useRouter } from "next/navigation";

// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   useMap,
//   useMapEvents,
// } from "react-leaflet";

// import L from "leaflet";

// // Custom marker icon
// const createMarkerIcon = () => {
//   return L.divIcon({
//     className: "custom-marker",
//     html: `<div style="
//       width: 20px;
//       height: 20px;
//       background-color: #D58F24;
//       border: 2px solid white;
//       border-radius: 50%;
//       box-shadow: 0 2px 8px rgba(0,0,0,0.4);
//       cursor: pointer;
//     "></div>`,
//     iconSize: [20, 20],
//     iconAnchor: [10, 10],
//   });
// };

// // Component to update map center when coordinates change
// function MapUpdater({ center }: { center: [number, number] }) {
//   const map = useMap();

//   useEffect(() => {
//     map.setView(center, 13);
//   }, [center, map]);

//   return null;
// }

// // Component to handle map clicks and marker dragging
// function MapController({
//   position,
//   onLocationChange,
// }: {
//   position: [number, number];
//   onLocationChange: (lat: number, lng: number) => void;
// }) {
//   useMapEvents({
//     click(e) {
//       const { lat, lng } = e.latlng;
//       onLocationChange(lat, lng);
//     },
//   });

//   return (
//     <Marker
//       position={position}
//       draggable={true}
//       icon={createMarkerIcon()}
//       eventHandlers={{
//         dragend: (e) => {
//           const marker = e.target;
//           const { lat, lng } = marker.getLatLng();
//           onLocationChange(lat, lng);
//         },
//       }}
//     />
//   );
// }

// interface PGFormData {
//   pgName: string;
//   monthlyRent: number;
//   securityDeposit: number;
//   numberOfRooms: number;
//   capacityPerRoom: number;
//   //   roomTypes: string[];
//   genderPreference: "male" | "female" | "both";
//   additionalDetails: string[];
//   additionalDetailsInput: string;
//   location: {
//     area: string;
//     city: string;
//     state: string;
//     pincode: string;
//     coordinates: { lat: number; lng: number };
//   };
//   rulesAndRegulations: string[];
//   newRuleInput: string;
//   images: File[];
//   amenities: string[];
//   customAmenities: string;
//   foodIncluded: boolean;
//   electricityIncluded: boolean;
//   maintenanceIncluded: boolean;
// }

// const predefinedAmenities = [
//   { id: "wifi", label: "WiFi", icon: Wifi },
//   { id: "parking", label: "Parking", icon: Car },
//   { id: "meals", label: "Meals", icon: Utensils },
//   { id: "gym", label: "Gym", icon: Dumbbell },
//   { id: "tv", label: "TV/Entertainment", icon: Tv },
//   { id: "ac", label: "Air Conditioning", icon: AirVent },
//   { id: "laundry", label: "Laundry", icon: Shirt },
//   { id: "kitchen", label: "Kitchen Access", icon: Coffee },
//   { id: "common-area", label: "Common Area", icon: Users },
//   { id: "24x7-security", label: "24x7 Security", icon: Shield },
//   { id: "housekeeping", label: "Housekeeping", icon: BrushCleaning }, // daily or weekly cleaning
//   { id: "cctv", label: "CCTV", icon: Camera }, // security visual monitoring
// ];

// const initialErrors: any = {
//   pgName: false,
//   monthlyRent: false,
//   additionalDetails: false,
//   rulesAndRegulations: false,
//   images: false,
//   area: false,
//   city: false,
//   state: false,
//   pincode: false,
//   coordinates: false,
//   general: "",
// };

// const initialFormData: PGFormData = {
//   pgName: "",
//   monthlyRent: 0,
//   securityDeposit: 0,
//   numberOfRooms: 0,
//   capacityPerRoom: 0,
//   genderPreference: "both",
//   additionalDetails: [],
//   additionalDetailsInput: "",
//   location: {
//     area: "",
//     city: "",
//     state: "",
//     pincode: "",
//     coordinates: { lat: 30.7333, lng: 76.7794 }, // Chandigarh fallback instead of null
//   },
//   rulesAndRegulations: [],
//   newRuleInput: "",
//   images: [],
//   amenities: [],
//   customAmenities: "",
//   foodIncluded: false,
//   electricityIncluded: false,
//   maintenanceIncluded: false,
// };

// export default function AddNewPGPage() {
//   const [currentStep, setCurrentStep] = useState(2);
//   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [paymentStatus, setPaymentStatus] = useState<
//     "pending" | "paid" | "failed"
//   >("pending");
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const [formData, setFormData] = useState<PGFormData>(initialFormData);

//   const [errors, setErrors] = useState(initialErrors);

//   const totalSteps = 6;
//   const progress = (currentStep / totalSteps) * 100;

//   // const [isListingCreated, setIsListingCreated] = useState(false);

//   const { user } = useUserStore();

//   const router = useRouter();

//   const validateStep = (step: number): boolean => {
//     const newErrors: any = {
//       pgName: false,
//       monthlyRent: false,
//       securityDeposit: false,
//       numberOfRooms: false,
//       capacityPerRoom: false,
//       additionalDetails: false,
//       rulesAndRegulations: false,
//       genderPreference: false,
//       images: false,
//       area: false,
//       city: false,
//       state: false,
//       pincode: false,
//       coordinates: false,
//       general: "",
//     };

//     switch (step) {
//       case 1:
//         if (!formData.pgName.trim()) {
//           newErrors.pgName = true;
//           newErrors.general ||= "Please enter a name for the property";
//         }

//         if (formData.monthlyRent <= 0) {
//           newErrors.monthlyRent = true;
//           newErrors.general ||= "Monthly rent must be greater than 0";
//         }

//         if (formData.securityDeposit < 0) {
//           newErrors.securityDeposit = true;
//           newErrors.general ||= "Security deposit cannot be negative";
//         }

//         if (formData.numberOfRooms <= 0) {
//           newErrors.numberOfRooms = true;
//           newErrors.general ||= "Please enter the number of rooms";
//         }

//         if (formData.capacityPerRoom <= 0) {
//           newErrors.capacityPerRoom = true;
//           newErrors.general ||= "Please enter the capacity per room";
//         }

//         if (!["male", "female", "both"].includes(formData.genderPreference)) {
//           newErrors.genderPreference = true;
//           newErrors.general ||= "Please select a valid gender preference";
//         }

//         break;

//       case 2:
//         if (!formData.location.area.trim()) {
//           newErrors.area = true;
//           newErrors.general ||= "Please enter a valid address";
//         }

//         if (!formData.location.city.trim()) {
//           newErrors.city = true;
//           newErrors.general ||= "Please enter a valid city";
//         }

//         if (!formData.location.state.trim()) {
//           newErrors.state = true;
//           newErrors.general ||= "Please enter a valid state";
//         }

//         if (!/^\d{5,6}$/.test(formData.location.pincode.trim())) {
//           newErrors.pincode = true;
//           newErrors.general ||= "Please enter a valid pincode";
//         }
//         if (!formData.location.coordinates) {
//           newErrors.coordinates = true;
//           newErrors.general ||= "Please select a location on map";
//         }

//         break;

//       case 3:
//         // Validate Additional Details
//         if (
//           !Array.isArray(formData.additionalDetails) ||
//           formData.additionalDetails.length === 0
//         ) {
//           newErrors.additionalDetails = true;
//           newErrors.general ||= "Add at least one additional detail";
//         }

//         // if (formData.amenities.length === 0) {
//         //   newErrors.general ||= "Select at least one amenity";
//         // }

//         break;

//       case 4:
//         if (
//           !Array.isArray(formData.rulesAndRegulations) ||
//           formData.rulesAndRegulations.length === 0
//         ) {
//           newErrors.rulesAndRegulations = true;
//           newErrors.general ||= "Please enter at least one rule and regulation";
//         }
//         break;

//       case 5:
//         if (!formData.images || formData.images.length === 0) {
//           newErrors.images = true;
//           newErrors.general = "Please upload at least one image";
//         }
//         break;

//       default:
//         break;
//     }

//     setErrors(newErrors);

//     // ✅ Only passes if all individual fields are valid
//     return Object.values(newErrors).every((val) => val === false || val === "");
//   };

//   const handleNext = () => {
//     if (validateStep(currentStep)) {
//       setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
//     }
//   };

//   const handlePrevious = () => {
//     setCurrentStep((prev) => Math.max(prev - 1, 1));
//   };
//   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files) return;

//     const validFiles: File[] = [];
//     let errorMessage = "";

//     for (let i = 0; i < files.length; i++) {
//       const file = files[i];

//       if (file.size > 3 * 1024 * 1024) {
//         errorMessage = "Each image must be under 3MB";
//         break;
//       }

//       validFiles.push(file);
//     }

//     if (!errorMessage && validFiles.length + formData.images.length > 5) {
//       errorMessage = "Maximum 5 images allowed";
//     }

//     if (errorMessage) {
//       setErrors((prev: any) => ({
//         ...prev,
//         images: true,
//         general: errorMessage,
//       }));
//       return;
//     }

//     setErrors((prev: any) => ({ ...prev, images: false, general: "" }));

//     setFormData((prev) => ({
//       ...prev,
//       images: [...prev.images, ...validFiles].slice(0, 5),
//     }));
//   };

//   const removeImage = (index: number) => {
//     setFormData((prev) => ({
//       ...prev,
//       images: prev.images.filter((_, i) => i !== index),
//     }));
//   };

//   // const handleLocationPick = (e: any) => {
//   //   e.preventDefault();
//   //   // Simulate map picker - in real app, integrate with Google Maps or similar
//   //   setFormData((prev) => ({
//   //     ...prev,
//   //     location: {
//   //       ...prev.location,
//   //       coordinates: { lat: 28.6139, lng: 77.209 }, // Delhi coordinates as example
//   //     },
//   //   }));
//   // };

//   const handlePayment = async (payNow: boolean) => {
//     setIsSubmitting(true);

//     // Simulate payment processing
//     await new Promise((resolve) => setTimeout(resolve, 2000));

//     if (payNow) {
//       // Simulate payment success/failure
//       const success = Math.random() > 0.2; // 80% success rate
//       setPaymentStatus(success ? "paid" : "failed");
//     } else {
//       setPaymentStatus("pending");
//     }

//     setIsSubmitting(false);

//     // Close modal after 2 seconds
//     setTimeout(() => {
//       setIsPaymentModalOpen(false);
//       // Redirect to listings page
//       router.replace("/routes/dashboard/listings");
//     }, 2000);
//   };

//   const toBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.readAsDataURL(file);
//       reader.onload = () => resolve(reader.result as string);
//       reader.onerror = (error) => reject(error);
//     });
//   };

//   const handleSubmit = async () => {
//     if (isSubmitting || !validateStep(currentStep)) return; // ✅ prevent spamming
//     setIsSubmitting(true);

//     const loadingToast = toast.loading("Uploading documents...", {
//       closeButton: true,
//     });

//     try {
//       const imagesBase64 = await Promise.all(
//         formData.images.map((file) => toBase64(file))
//       );

//       const res = await axios.post("/api/owner/listPg", {
//         pgName: formData.pgName,
//         monthlyRent: formData.monthlyRent,
//         securityDeposit: formData.securityDeposit,
//         numberOfRooms: formData.numberOfRooms,
//         capacityPerRoom: formData.capacityPerRoom,
//         genderPreference: formData.genderPreference,
//         additionalDetails: formData.additionalDetails,
//         location: {
//           area: formData.location.area,
//           city: formData.location.city,
//           state: formData.location.state,
//           pincode: formData.location.pincode,
//           coordinates: formData.location.coordinates,
//         },
//         rulesAndRegulations: formData.rulesAndRegulations,
//         amenities: formData.amenities,
//         foodIncluded: formData.foodIncluded,
//         electricityIncluded: formData.electricityIncluded,
//         maintenanceIncluded: formData.maintenanceIncluded,
//         images: imagesBase64,
//       });

//       if (res?.data?.success) {
//         toast.success(res.data.message || "PG listed successfully!", {
//           duration: 3000,
//           closeButton: true,
//         });
//         // setIsListingCreated(true);
//         setIsPaymentModalOpen(true);
//       } else {
//         toast.error(res?.data?.message || "Something went wrong", {
//           duration: 3000,
//           closeButton: true,
//         });
//         setErrors((prev: any) => ({
//           ...prev,
//           general: res?.data?.message || "Unknown error",
//         }));
//       }
//     } catch (error) {
//       console.error("submitPGStep error:", error);
//       toast.error("Failed to submit PG. Try again.", {
//         duration: 3000,
//         closeButton: true,
//       });
//       setErrors((prev: any) => ({
//         ...prev,
//         general: "Failed to submit PG. Try again.",
//       }));
//     } finally {
//       toast.dismiss(loadingToast);
//       setIsSubmitting(false); // ✅ unlock again
//     }
//   };

//   useEffect(() => {
//     if ("geolocation" in navigator) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           getAddressFromCoords(
//             position.coords.latitude,
//             position.coords.longitude
//           );
//           setFormData((prev) => ({
//             ...prev,
//             location: {
//               ...prev.location,
//               coordinates: {
//                 lat: position.coords.latitude,
//                 lng: position.coords.longitude,
//               },
//             },
//           }));
//         },
//         (err) => {
//           console.warn("Geolocation denied or unavailable", err);
//         }
//       );
//     } else {
//       alert("Geolocation is not supported by this browser try to enable it");
//     }
//   }, []);

//   const [isLoading, setIsLoading] = useState(false);

//   const [mapKey, setMapKey] = useState(0); // Force map re-render

//   // Reverse geocoding - get address from coordinates
//   const getAddressFromCoords = useCallback(async (lat: number, lng: number) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
//       );
//       const data = await response.json();

//       if (data && data.address) {
//         const addr = data.address;
//         const area = [
//           addr.house_number,
//           addr.road,
//           addr.neighbourhood,
//           addr.suburb,
//           addr.city_district,
//         ]
//           .filter(Boolean)
//           .join(", ");
//         setFormData((prev) => ({
//           ...prev,
//           location: {
//             ...prev.location,
//             coordinates: { lat, lng },
//             area: area || prev.location.area,
//             city: addr.city || addr.town || addr.village || prev.location.city,
//             state: addr.state || prev.location.state,
//             pincode: addr.postcode || prev.location.pincode,
//           },
//         }));
//       }
//     } catch (error) {
//       console.error("Failed to get address:", error);
//       // Still update coordinates even if address fetch fails
//       setFormData((prev) => ({
//         ...prev,
//         location: {
//           ...prev.location,
//           coordinates: { lat, lng },
//         },
//       }));
//     }
//   }, []);

//   const getCoordsFromAddress = useCallback(async () => {
//     const { area, city, state, pincode } = formData.location;

//     // Build query priority list: full → city+state+pincode → state+pincode → pincode only
//     const queryLevels = [
//       [area, city, state, pincode],
//       [city, state, pincode],
//       [state, pincode],
//       [pincode],
//     ];

//     setIsLoading(true);

//     try {
//       for (const level of queryLevels) {
//         const query = level.filter(Boolean).join(", ");
//         if (!query.trim()) continue;

//         const response = await fetch(
//           `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
//             query
//           )}&limit=1&addressdetails=1`
//         );
//         const data = await response.json();

//         if (data && data[0]) {
//           const lat = parseFloat(data[0].lat);
//           const lng = parseFloat(data[0].lon);

//           setFormData((prev) => ({
//             ...prev,
//             location: {
//               ...prev.location,
//               coordinates: { lat, lng },
//             },
//           }));

//           setMapKey((prev) => prev + 1); // Force map update
//           break; // Exit loop on first success
//         }
//       }
//     } catch (error) {
//       console.error("Failed to get coordinates:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [formData]);

//   // Handle map location changes (click or drag)
//   const handleMapLocationChange = useCallback(
//     (lat: number, lng: number) => {
//       getAddressFromCoords(lat, lng);
//     },
//     [getAddressFromCoords]
//   );

//   // Get current location
//   const getCurrentLocation = useCallback(() => {
//     if (!navigator.geolocation) {
//       alert("Geolocation is not supported by this browser");
//       return;
//     }

//     setIsLoading(true);
//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         const { latitude, longitude } = position.coords;
//         getAddressFromCoords(latitude, longitude);
//         setMapKey((prev) => prev + 1); // Force map update
//         setIsLoading(false);
//       },
//       (error) => {
//         console.error("Error getting location:", error);
//         alert("Unable to get your current location");
//         setIsLoading(false);
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     );
//   }, [getAddressFromCoords]);

//   const renderStep = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           <>
//             <form>
//               <div className="space-y-4 text-left pb-10 ">
//                 <FormInput
//                   id="pgName"
//                   label="PG Name"
//                   type="text"
//                   value={formData.pgName}
//                   onChange={(value) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       pgName: value,
//                     }))
//                   }
//                   placeholder="Enter your PG name"
//                   hasError={errors.pgName}
//                   icon={Building}
//                 />

//                 <div className="flex gap-4 flex-col md:flex-row">
//                   <FormInput
//                     id="monthlyRent"
//                     label="Monthly Rent (₹)"
//                     type="number"
//                     value={
//                       formData.monthlyRent === 0
//                         ? ""
//                         : formData.monthlyRent.toString()
//                     }
//                     onChange={(value) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         monthlyRent: Number.parseInt(value) || 0,
//                       }))
//                     }
//                     placeholder="Enter Monthly Rent"
//                     hasError={errors.monthlyRent}
//                     icon={IndianRupee}
//                   />
//                   <FormInput
//                     id="securityDeposit"
//                     label="Security Deposit (₹)"
//                     type="number"
//                     value={
//                       formData.securityDeposit === 0
//                         ? ""
//                         : formData.securityDeposit.toString()
//                     }
//                     onChange={(value) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         securityDeposit: Number.parseInt(value) || 0,
//                       }))
//                     }
//                     placeholder="Enter Security Deposit"
//                     hasError={errors.securityDeposit}
//                     icon={Shield}
//                   />
//                 </div>

//                 <div className="flex gap-4">
//                   <FormInput
//                     id="numberOfRooms"
//                     label="Number of Rooms"
//                     type="number"
//                     value={
//                       formData.numberOfRooms === 0
//                         ? ""
//                         : formData.numberOfRooms.toString()
//                     }
//                     onChange={(value) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         numberOfRooms: parseInt(value) || 0,
//                       }))
//                     }
//                     placeholder="e.g. 5"
//                     hasError={errors.numberOfRooms}
//                     icon={BedDouble}
//                   />

//                   <FormInput
//                     id="capacityPerRoom"
//                     label="Capacity per Room"
//                     type="number"
//                     value={
//                       formData.capacityPerRoom === 0
//                         ? ""
//                         : formData.capacityPerRoom.toString()
//                     }
//                     onChange={(value) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         capacityPerRoom: parseInt(value) || 0,
//                       }))
//                     }
//                     placeholder="e.g. 2"
//                     hasError={errors.capacityPerRoom}
//                     icon={Users}
//                   />
//                 </div>

//                 {/* <div className="space-y-1">
//   <Label className="text-gray-700 text-[14px] font-inter">Room Types</Label>
//   <div className="flex flex-wrap gap-2">
//     {["Single", "Double", "Triple"].map((type) => {
//       const isSelected = formData.roomTypes.includes(type);
//       return (
//         <button
//           key={type}
//           type="button"
//           onClick={() =>
//             setFormData((prev) => ({
//               ...prev,
//               roomTypes: isSelected
//                 ? prev.roomTypes.filter((t) => t !== type)
//                 : [...prev.roomTypes, type],
//             }))
//           }
//           className={`px-3 py-1 rounded-full text-sm border ${
//             isSelected
//               ? "bg-HG-500 text-white border-HG-500"
//               : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
//           }`}
//         >
//           {type}
//         </button>
//       );
//     })}
//   </div>
//   {errors.roomTypes && (
//     <p className="text-red-500 text-sm">{errors.roomTypes}</p>
//   )}
// </div> */}

//                 <div className="space-y-1 font-inter">
//                   <Label className="text-gray-700 text-[14px] font-inter">
//                     Gender Preference
//                   </Label>
//                   <div className="flex gap-4">
//                     {["male", "female", "both"].map((gender) => (
//                       <label
//                         key={gender}
//                         className="flex items-center gap-2 text-sm cursor-pointer"
//                       >
//                         <input
//                           type="radio"
//                           name="genderPreference"
//                           value={gender}
//                           checked={formData.genderPreference === gender}
//                           onChange={(e) =>
//                             setFormData((prev) => ({
//                               ...prev,
//                               genderPreference: e.target.value as
//                                 | "male"
//                                 | "female"
//                                 | "both",
//                             }))
//                           }
//                         />
//                         <span className="capitalize">{gender}</span>
//                       </label>
//                     ))}
//                   </div>
//                   {/* {errors.genderPreference && (
//                     <p className="text-red-500 text-sm">
//                       {errors.genderPreference}
//                     </p>
//                   )} */}
//                 </div>
//               </div>
//             </form>
//           </>
//         );

//       case 3:
//         return (
//           <form>
//             <div className="space-y-6 text-left pb-10">
//               {/* --- Available Amenities --- */}
//               <div className="space-y-1">
//                 <Label className="text-gray-700 text-[14px] font-inter">
//                   Available Amenities
//                 </Label>

//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                   {/* Predefined amenities */}
//                   {predefinedAmenities.map((amenity) => {
//                     const isSelected = formData.amenities.includes(amenity.id);
//                     return (
//                       <div
//                         key={amenity.id}
//                         onClick={() =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             amenities: isSelected
//                               ? prev.amenities.filter((a) => a !== amenity.id)
//                               : [...prev.amenities, amenity.id],
//                           }))
//                         }
//                         className={`flex items-center space-x-3 p-3 overflow-hidden text-nowrap rounded-md cursor-pointer text-sm border font-inter transition-all ${
//                           isSelected
//                             ? "bg-HG-50 bg-HG-400/10 border-transparent text-HG-500"
//                             : "bg-white border-gray-200 hover:border-HG-300"
//                         }`}
//                       >
//                         <amenity.icon className="w-5 h-5" />
//                         <span>{amenity.label}</span>
//                       </div>
//                     );
//                   })}

//                   {/* Custom amenities only */}
//                   {formData.amenities
//                     .filter(
//                       (amenityId) =>
//                         !predefinedAmenities.some((a) => a.id === amenityId)
//                     )
//                     .map((amenityId) => (
//                       <div
//                         key={amenityId}
//                         onClick={() =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             amenities: prev.amenities.filter(
//                               (a) => a !== amenityId
//                             ),
//                           }))
//                         }
//                         className={`flex items-center space-x-3 p-3 overflow-hidden text-nowrap rounded-md cursor-pointer text-sm border font-inter transition-all bg-HG-400/10 border-transparent text-HG-500`}
//                       >
//                         <span className="w-5 h-5 inline-block bg-HG-500/70 rounded-full" />
//                         <span className="capitalize">{amenityId}</span>
//                       </div>
//                     ))}
//                 </div>
//               </div>

//               {/* --- Add Custom Amenities --- */}
//               <div className="relative">
//                 <Input
//                   id="customAmenities"
//                   value={formData.customAmenities}
//                   onChange={(e) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       customAmenities: e.target.value,
//                     }))
//                   }
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") {
//                       e.preventDefault();
//                       const value = formData.customAmenities.trim();
//                       const alreadyExists = formData.amenities.includes(value);
//                       if (value && !alreadyExists) {
//                         setFormData((prev) => ({
//                           ...prev,
//                           amenities: [...prev.amenities, value],
//                           customAmenities: "",
//                         }));
//                       }
//                     }
//                   }}
//                   placeholder="Type and press Enter or Tap +"
//                   className="h-11 bg-white rounded-md border-gray-200 focus:border-HG-400 focus:ring-HG-400 pl-4 pr-10"
//                 />

//                 {/* Add Button */}
//                 <button
//                   type="button"
//                   onClick={() => {
//                     const value = formData.customAmenities.trim();
//                     const alreadyExists = formData.amenities.includes(value);
//                     if (value && !alreadyExists) {
//                       setFormData((prev) => ({
//                         ...prev,
//                         amenities: [...prev.amenities, value],
//                         customAmenities: "",
//                       }));
//                     }
//                   }}
//                   className="absolute inset-y-0 right-3 flex items-center justify-center text-HG-500 hover:text-HG-600"
//                   title="Add Custom Amenity"
//                 >
//                   <Plus className="h-5 w-5" />
//                 </button>
//               </div>

//               <ul className="space-y-2">
//                 {Array.isArray(formData.additionalDetails) &&
//                   formData.additionalDetails.map((item, idx) => (
//                     <li
//                       key={idx}
//                       className="flex items-center justify-between bg-HG-400/10 px-3 py-1 rounded-md text-sm -tracking-wide"
//                     >
//                       <span className="list-disc list-inside">{item}</span>
//                       <button
//                         type="button"
//                         onClick={() =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             additionalDetails: prev.additionalDetails.filter(
//                               (_, i) => i !== idx
//                             ),
//                           }))
//                         }
//                         className="text-gray-400 hover:text-red-500 transition"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     </li>
//                   ))}
//               </ul>

//               <motion.div
//                 variants={{
//                   hidden: { opacity: 0, y: 10 },
//                   visible: {
//                     opacity: 1,
//                     y: 0,
//                     transition: { type: "spring", stiffness: 300, damping: 24 },
//                   },
//                 }}
//                 className="w-full"
//               >
//                 <Label
//                   htmlFor={"additionalDetails"}
//                   className={`${
//                     errors.additionalDetails ? "text-red-400" : "text-gray-700"
//                   } text-[14px] font-inter font-normal block`}
//                 >
//                   Additional Details
//                 </Label>

//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <ListCollapse className="h-5 w-5 text-gray-400" />
//                   </div>

//                   <Input
//                     id="additionalDetails"
//                     type="text"
//                     value={formData.additionalDetailsInput || ""}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         additionalDetailsInput: e.target.value,
//                       }))
//                     }
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter") {
//                         e.preventDefault();
//                         const value = formData.additionalDetailsInput?.trim();
//                         if (value) {
//                           setFormData((prev) => ({
//                             ...prev,
//                             additionalDetails: [
//                               ...(prev.additionalDetails || []),
//                               value,
//                             ],
//                             additionalDetailsInput: "",
//                           }));
//                         }
//                       }
//                     }}
//                     placeholder="Type and Press Enter or Tap +"
//                     className={`h-11 pl-10 pr-10 bg-white rounded-md text-[15px]
//         ${
//           errors.additionalDetails
//             ? "border-red-400 border-2"
//             : "border-gray-200"
//         } border focus:border-HG-400 placeholder:font-inter focus:outline-none placeholder:opacity-80 focus-visible:ring-HG-400 focus-visible:ring-1`}
//                   />

//                   {/* Add Button */}
//                   <button
//                     type="button"
//                     onClick={() => {
//                       const value = formData.additionalDetailsInput?.trim();
//                       if (value) {
//                         setFormData((prev) => ({
//                           ...prev,
//                           additionalDetails: [
//                             ...(prev.additionalDetails || []),
//                             value,
//                           ],
//                           additionalDetailsInput: "",
//                         }));
//                       }
//                     }}
//                     className="absolute inset-y-0 right-3 flex items-center justify-center text-HG-500 hover:text-HG-600"
//                     title="Add"
//                   >
//                     <Plus className="h-5 w-5" />
//                   </button>
//                 </div>
//               </motion.div>

//               {/* --- Included in Rent --- */}
//               <div className="space-y-2">
//                 <Label className="text-gray-700 text-[14px] font-inter">
//                   Included in Rent
//                 </Label>
//                 <div className=" flex items-center gap-8">
//                   {[
//                     { key: "foodIncluded", label: "Food/Meals" },
//                     { key: "electricityIncluded", label: "Electricity" },
//                     { key: "maintenanceIncluded", label: "Maintenance" },
//                   ].map((item) => (
//                     <label
//                       key={item.key}
//                       className="flex items-center gap-2 text-sm cursor-pointer font-inter"
//                     >
//                       <input
//                         type="checkbox"
//                         checked={
//                           formData[item.key as keyof PGFormData] as boolean
//                         }
//                         onChange={(e) =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             [item.key]: e.target.checked,
//                           }))
//                         }
//                         className="accent-HG-400/40 w-4 h-4  rounded-sm border-gray-300"
//                       />
//                       <span>{item.label}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </form>
//         );

//       case 5:
//         return (
//           <form>
//             <div className="space-y-2 pt-2 text-left pb-10">
//               {/* --- Upload Image Heading --- */}
//               <div className="space-y-1">
//                 <Label className="text-gray-700 text-[14px] font-inter">
//                   Upload 1–5 high-quality images of your PG. First image will be
//                   primary.
//                 </Label>
//               </div>

//               {/* --- Upload Dropzone --- */}
//               <div
//                 onClick={() => fileInputRef.current?.click()}
//                 className="border-2  border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-HG-400 transition-colors"
//               >
//                 <Upload className="w-10 h-10 mx-auto text-HG-400 mb-3" />
//                 <p className="text-gray-600 text-sm font-inter">
//                   Click to upload images
//                 </p>
//                 <p className="text-xs text-gray-400 mt-1 font-inter">
//                   JPG, PNG up to 5MB each • Max 5 images
//                 </p>
//               </div>

//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/*"
//                 multiple
//                 onChange={handleImageUpload}
//                 className="hidden"
//               />

//               {/* --- Preview Uploaded Images --- */}
//               {formData.images.length > 0 && (
//                 <motion.div
//                   variants={{
//                     hidden: { opacity: 0, y: 10 },
//                     visible: {
//                       opacity: 1,
//                       y: 0,
//                       transition: {
//                         type: "spring",
//                         stiffness: 260,
//                         damping: 20,
//                       },
//                     },
//                   }}
//                   initial="hidden"
//                   animate="visible"
//                   className="grid pt-4 grid-cols-2 md:grid-cols-3 gap-4"
//                 >
//                   {formData.images.map((file, index) => (
//                     <div
//                       key={index}
//                       className="relative group overflow-hidden rounded-lg border border-gray-200"
//                     >
//                       <BlurImage
//                         src={URL.createObjectURL(file)}
//                         alt={`PG Image ${index + 1}`}
//                         className="w-full h-40 object-cover rounded-lg"
//                         width={400}
//                         height={400}
//                       />

//                       {/* Remove button */}
//                       <button
//                         type="button"
//                         onClick={() => removeImage(index)}
//                         className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                       {/* Primary badge */}
//                       {index === 0 && (
//                         <div className="absolute bottom-2 left-2 bg-HG-500 text-white text-xs px-2 py-0.5 rounded-full font-inter">
//                           Primary
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </motion.div>
//               )}
//             </div>
//           </form>
//         );

//       case 2:
//         return (
//           <form>
//             <div className="space-y-4 text-left pb-5">
//               <FormInput
//                 id="area"
//                 label="Area"
//                 type="textarea"
//                 value={formData.location.area}
//                 onChange={(value) =>
//                   setFormData((prev) => ({
//                     ...prev,
//                     location: { ...prev.location, area: value },
//                   }))
//                 }
//                 placeholder="Enter complete address with landmarks"
//                 hasError={errors.area}
//                 icon={MapPin}
//               />

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <FormInput
//                   id="city"
//                   label="City"
//                   type="text"
//                   value={formData.location.city}
//                   onChange={(value) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       location: { ...prev.location, city: value },
//                     }))
//                   }
//                   placeholder="e.g. Delhi"
//                   hasError={errors.city}
//                   icon={MapPin}
//                 />

//                 <FormInput
//                   id="state"
//                   label="State"
//                   type="text"
//                   value={formData.location.state}
//                   onChange={(value) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       location: { ...prev.location, state: value },
//                     }))
//                   }
//                   placeholder="e.g. Delhi"
//                   hasError={errors.state}
//                   icon={MapPin}
//                 />

//                 <FormInput
//                   id="pincode"
//                   label="Pincode"
//                   type="text"
//                   value={formData.location.pincode}
//                   onChange={(value) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       location: { ...prev.location, pincode: value },
//                     }))
//                   }
//                   placeholder="e.g. 110001"
//                   hasError={errors.pincode}
//                   icon={MapPin}
//                 />
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-2 pb-5 justify-between">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={getCoordsFromAddress}
//                 disabled={isLoading}
//                 className="flex items-center gap-2 bg-transparent text-gray-500 font-inter"
//               >
//                 {isLoading ? (
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                 ) : (
//                   <MapPin className="w-4 h-4" />
//                 )}
//                 Find on Map
//               </Button>
//               <Button
//                 type="button"
//                 onClick={getCurrentLocation}
//                 disabled={isLoading}
//                 className="flex items-center gap-2  font-inter"
//               >
//                 {isLoading ? (
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                 ) : (
//                   <Navigation className="w-4 h-4" />
//                 )}
//                 Current Location
//               </Button>
//             </div>

//             {/* Map */}
//             <div className="h-[300px] sm:h-[400px] w-full rounded-lg overflow-hidden border-2 border-dashed border-HG-400">
//               <MapContainer
//                 key={mapKey}
//                 center={[
//                   formData.location.coordinates.lat,
//                   formData.location.coordinates.lng,
//                 ]}
//                 zoom={13}
//                 scrollWheelZoom={true}
//                 className="h-full w-full"
//                 style={{ minHeight: "300px" }}
//               >
//                 <TileLayer
//                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                 />
//                 <MapUpdater
//                   center={[
//                     formData.location.coordinates.lat,
//                     formData.location.coordinates.lng,
//                   ]}
//                 />
//                 <MapController
//                   position={[
//                     formData.location.coordinates.lat,
//                     formData.location.coordinates.lng,
//                   ]}
//                   onLocationChange={handleMapLocationChange}
//                 />
//               </MapContainer>
//             </div>

//             <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2 mb-10">
//               <strong>Instructions:</strong> Click anywhere on map or drag the
//               red marker to select location. Use "Find on Map" to locate typed
//               address or "Current Location" for GPS.
//             </div>

//             {/* --- Map Location Picker --- */}
//             {/* <div className="space-y-2 font-inter">
//                 <Label className="text-gray-700 text-[14px]">
//                   Pick Location on Map
//                 </Label>
//                 <div
//                   className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${
//                     errors.coordinates ? "border-red-400" : ""
//                   }`}
//                 >
//                   <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
//                   <p className="text-gray-600 mb-4">
//                     Click the button below to pick your PG location
//                   </p>
//                   <Button
//                     onClick={handleLocationPick}
//                     variant="outline"
//                     className="text-HG-500 border-HG-500 hover:bg-HG-500/20 transition"
//                   >
//                     {formData.location.coordinates
//                       ? "Location Selected ✓"
//                       : "Pick Location"}
//                   </Button>
//                   {formData.location.coordinates && (
//                     <p className="text-sm text-green-600 mt-2">
//                       Coordinates:{" "}
//                       {formData.location.coordinates.lat.toFixed(4)},{" "}
//                       {formData.location.coordinates.lng.toFixed(4)}
//                     </p>
//                   )}
//                 </div>
//               </div> */}
//           </form>
//         );

//       case 4:
//         return (
//           <form>
//             <div className="space-y-6 text-left pb-10 font-inter">
//               {/* Display Existing Rules */}
//               <ul className="space-y-2">
//                 {Array.isArray(formData.rulesAndRegulations) &&
//                   formData.rulesAndRegulations.map((item, idx) => (
//                     <li
//                       key={idx}
//                       className="flex items-center justify-between bg-HG-400/10 px-3 py-1 rounded-md text-sm -tracking-wide"
//                     >
//                       <span className="list-disc list-inside">{item}</span>
//                       <button
//                         type="button"
//                         onClick={() =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             rulesAndRegulations:
//                               prev.rulesAndRegulations.filter(
//                                 (_, i) => i !== idx
//                               ),
//                           }))
//                         }
//                         className="text-gray-400 hover:text-red-500 transition"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     </li>
//                   ))}
//               </ul>

//               {/* Input to Add Rule */}
//               <motion.div
//                 variants={{
//                   hidden: { opacity: 0, y: 10 },
//                   visible: {
//                     opacity: 1,
//                     y: 0,
//                     transition: {
//                       type: "spring" as const,
//                       stiffness: 300,
//                       damping: 24,
//                     },
//                   },
//                 }}
//                 className="w-full"
//               >
//                 <Label
//                   htmlFor="rulesAndRegulations"
//                   className={`${
//                     errors.rulesAndRegulations
//                       ? "text-red-400"
//                       : "text-gray-700"
//                   } text-[14px] font-inter font-normal block`}
//                 >
//                   Rules & Regulations
//                 </Label>

//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                     <ListCollapse className="h-5 w-5 text-gray-400" />
//                   </div>

//                   <Input
//                     id="rulesAndRegulations"
//                     type="text"
//                     value={formData.newRuleInput || ""}
//                     onChange={(e) =>
//                       setFormData((prev) => ({
//                         ...prev,
//                         newRuleInput: e.target.value,
//                       }))
//                     }
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter") {
//                         e.preventDefault();
//                         const value = formData.newRuleInput?.trim();
//                         if (value) {
//                           setFormData((prev) => ({
//                             ...prev,
//                             rulesAndRegulations: [
//                               ...(prev.rulesAndRegulations || []),
//                               value,
//                             ],
//                             newRuleInput: "",
//                           }));
//                         }
//                       }
//                     }}
//                     placeholder="Type and Press Enter or Tap +"
//                     className={`h-11 pl-10 pr-10 bg-white rounded-md text-[15px] ${
//                       errors.rulesAndRegulations
//                         ? "border-red-400 border-2"
//                         : "border-gray-200"
//                     } border focus:border-HG-400 placeholder:font-inter focus:outline-none placeholder:opacity-80 focus-visible:ring-HG-400 focus-visible:ring-1`}
//                     aria-invalid={errors.rulesAndRegulations}
//                     aria-describedby={
//                       errors.rulesAndRegulations
//                         ? `rulesAndRegulations-error`
//                         : undefined
//                     }
//                   />

//                   {/* Add Button for Mobile */}
//                   <button
//                     type="button"
//                     onClick={() => {
//                       const value = formData.newRuleInput?.trim();
//                       if (value) {
//                         setFormData((prev) => ({
//                           ...prev,
//                           rulesAndRegulations: [
//                             ...(prev.rulesAndRegulations || []),
//                             value,
//                           ],
//                           newRuleInput: "",
//                         }));
//                       }
//                     }}
//                     className="absolute inset-y-0 right-3 flex items-center justify-center text-HG-500 hover:text-HG-600"
//                     title="Add Rule"
//                   >
//                     <Plus className="h-5 w-5" />
//                   </button>
//                 </div>
//               </motion.div>

//               {/* Suggested Rules */}
//               <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
//                 <h4 className="font-semibold text-blue-800 mb-2 text-[15px]">
//                   Suggested Rules to Include:
//                 </h4>
//                 <ul className="text-sm text-blue-700 space-y-1 font-inter list-disc list-inside">
//                   <li>Visitor timings and policies</li>
//                   <li>Noise and music restrictions</li>
//                   <li>Smoking and drinking policies</li>
//                   <li>Rent payment terms and late fees</li>
//                   <li>Notice period for leaving</li>
//                   <li>Maintenance and cleanliness expectations</li>
//                   <li>Security deposit refund conditions</li>
//                 </ul>
//               </div>
//             </div>
//           </form>
//         );

//       case 6:
//         return (
//           <form>
//             <div className="space-y-8 text-left pb-10 font-inter">
//               {/* --- Basic Information --- */}
//               <motion.div
//                 variants={{
//                   hidden: { opacity: 0, y: 10 },
//                   visible: {
//                     opacity: 1,
//                     y: 0,
//                     transition: { type: "spring", stiffness: 300, damping: 24 },
//                   },
//                 }}
//                 className="space-y-4"
//               >
//                 <h3 className="text-lg font-semibold text-HG-500">
//                   Basic Information
//                 </h3>
//                 <div className="grid grid-cols-2 text-xs md:grid-cols-3 gap-4 md:text-sm text-gray-700">
//                   <p>
//                     <strong>Name:</strong> {formData.pgName}
//                   </p>
//                   <p>
//                     <strong>Monthly Rent:</strong> ₹
//                     {formData.monthlyRent.toLocaleString()}
//                   </p>
//                   <p>
//                     <strong>Security Deposit:</strong> ₹
//                     {formData.securityDeposit.toLocaleString()}
//                   </p>
//                   <p>
//                     <strong>No. of Rooms:</strong> {formData.numberOfRooms}
//                   </p>
//                   <p>
//                     <strong>Capacity/Room:</strong> {formData.capacityPerRoom}
//                   </p>
//                   <p>
//                     <strong>Gender Preference:</strong>{" "}
//                     {formData.genderPreference}
//                   </p>
//                 </div>
//               </motion.div>

//               {/* --- Location --- */}
//               <motion.div
//                 variants={{
//                   hidden: { opacity: 0, y: 10 },
//                   visible: {
//                     opacity: 1,
//                     y: 0,
//                     transition: { type: "spring", stiffness: 300, damping: 24 },
//                   },
//                 }}
//                 className="space-y-4"
//               >
//                 <h3 className="text-lg font-semibold text-HG-500">Location</h3>
//                 <div className="grid grid-cols-2 text-xs md:grid-cols-2 gap-4  md:text-sm text-gray-700">
//                   <p>
//                     <strong>Area:</strong> {formData.location.area}
//                   </p>
//                   <p>
//                     <strong>City:</strong> {formData.location.city}
//                   </p>
//                   <p>
//                     <strong>State:</strong> {formData.location.state}
//                   </p>
//                   <p>
//                     <strong>Pincode:</strong> {formData.location.pincode}
//                   </p>
//                   {formData.location.coordinates && (
//                     <p>
//                       <strong>Coordinates:</strong>{" "}
//                       {formData.location.coordinates.lat.toFixed(4)},{" "}
//                       {formData.location.coordinates.lng.toFixed(4)}
//                     </p>
//                   )}
//                 </div>
//               </motion.div>

//               {/* --- Images --- */}
//               <motion.div
//                 variants={{
//                   hidden: { opacity: 0, y: 10 },
//                   visible: {
//                     opacity: 1,
//                     y: 0,
//                     transition: { type: "spring", stiffness: 300, damping: 24 },
//                   },
//                 }}
//                 className="space-y-2"
//               >
//                 <h3 className="text-lg font-semibold text-HG-500">
//                   Uploaded Images
//                 </h3>
//                 <div className="text-sm text-gray-700 overflow-hidden">
//                   {formData.images.length > 0 ? (
//                     <div className="grid grid-cols-2  overflow-hidden md:grid-cols-3 gap-4">
//                       {formData.images.map((file, idx) => (
//                         <BlurImage
//                           key={idx}
//                           src={URL.createObjectURL(file)}
//                           alt={`Image ${idx + 1}`}
//                           className="w-full h-32 border overflow-hidden object-cover rounded-lg"
//                           width={400}
//                           height={400}
//                         />
//                       ))}
//                     </div>
//                   ) : (
//                     <p>No images uploaded</p>
//                   )}
//                 </div>
//               </motion.div>

//               {/* --- Amenities --- */}
//               <motion.div
//                 variants={{
//                   hidden: { opacity: 0, y: 10 },
//                   visible: {
//                     opacity: 1,
//                     y: 0,
//                     transition: { type: "spring", stiffness: 300, damping: 24 },
//                   },
//                 }}
//                 className="space-y-2"
//               >
//                 <h3 className="text-lg font-semibold text-HG-500">Amenities</h3>
//                 <div className="flex flex-wrap gap-2 text-sm">
//                   {formData.amenities.map((id, idx) => {
//                     const label =
//                       predefinedAmenities.find((a) => a.id === id)?.label || id;
//                     return (
//                       <span
//                         key={idx}
//                         className="bg-HG-50 border text-HG-500 border-HG-200 rounded-full px-3 py-1"
//                       >
//                         {label}
//                       </span>
//                     );
//                   })}
//                 </div>
//               </motion.div>

//               {/* --- Additional Details --- */}
//               {formData.additionalDetails.length > 0 && (
//                 <motion.div
//                   variants={{
//                     hidden: { opacity: 0, y: 10 },
//                     visible: {
//                       opacity: 1,
//                       y: 0,
//                       transition: {
//                         type: "spring",
//                         stiffness: 300,
//                         damping: 24,
//                       },
//                     },
//                   }}
//                   className="space-y-2"
//                 >
//                   <h3 className="text-lg font-semibold text-HG-500">
//                     Additional Details
//                   </h3>
//                   <ul className="text-sm text-gray-700 list-disc list-inside">
//                     {formData.additionalDetails.map((detail, idx) => (
//                       <li key={idx}>{detail}</li>
//                     ))}
//                   </ul>
//                 </motion.div>
//               )}

//               {/* --- Inclusions --- */}
//               <motion.div
//                 variants={{
//                   hidden: { opacity: 0, y: 10 },
//                   visible: {
//                     opacity: 1,
//                     y: 0,
//                     transition: { type: "spring", stiffness: 300, damping: 24 },
//                   },
//                 }}
//                 className="space-y-2"
//               >
//                 <h3 className="text-lg font-semibold text-HG-500">
//                   Included in Rent
//                 </h3>
//                 <div className="flex flex-wrap gap-4 text-sm text-gray-700">
//                   {formData.foodIncluded && <span>🍱 Food/Meals</span>}
//                   {formData.electricityIncluded && <span>⚡ Electricity</span>}
//                   {formData.maintenanceIncluded && <span>🧹 Maintenance</span>}
//                   {!formData.foodIncluded &&
//                     !formData.electricityIncluded &&
//                     !formData.maintenanceIncluded && (
//                       <span className="text-gray-400">None selected</span>
//                     )}
//                 </div>
//               </motion.div>

//               {/* --- Rules & Regulations --- */}
//               <motion.div
//                 variants={{
//                   hidden: { opacity: 0, y: 10 },
//                   visible: {
//                     opacity: 1,
//                     y: 0,
//                     transition: { type: "spring", stiffness: 300, damping: 24 },
//                   },
//                 }}
//                 className="space-y-2"
//               >
//                 <h3 className="text-lg font-semibold text-HG-500">
//                   Rules & Regulations
//                 </h3>
//                 {formData.rulesAndRegulations.length > 0 ? (
//                   <ul className="text-sm text-gray-700 list-disc list-inside">
//                     {formData.rulesAndRegulations.map((rule, idx) => (
//                       <li key={idx}>{rule}</li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <p className="text-sm text-gray-400">No rules provided</p>
//                 )}
//               </motion.div>

//               {/* --- Payment Alert --- */}
//               <motion.div
//                 variants={{
//                   hidden: { opacity: 0, y: 10 },
//                   visible: {
//                     opacity: 1,
//                     y: 0,
//                     transition: { type: "spring", stiffness: 300, damping: 24 },
//                   },
//                 }}
//                 className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"
//               >
//                 <div className="flex items-start gap-3">
//                   <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
//                   <div>
//                     <h4 className="font-semibold text-yellow-800">
//                       Listing Fee Required
//                     </h4>
//                     <p className="text-sm text-yellow-700 mt-1">
//                       A listing fee of ₹299 is required to publish your PG. You
//                       can pay now or submit with fee pending.
//                     </p>
//                   </div>
//                 </div>
//               </motion.div>
//             </div>
//           </form>
//         );

//       default:
//         return null;
//     }
//   };

//   const stepTitles = {
//     1: "Basic Information", // PG name, rent, capacity
//     2: "Location", // Address, map, locality
//     3: "Amenities & Details", // WiFi, meals, extras, etc.
//     4: "Rules & Regulations", // Curfews, guest policy
//     5: "Upload Images", // Upload after all details
//     6: "Review & Submit", // Final confirmation
//   };

//   return (
//     <div className="flex flex-col gap-6 min-h-[calc(100vh-15px)] ">
//       <div className="flex flex-col gap-2 md:pt-5">
//         <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
//           Add a New <span className="text-HG-500">PG Listing</span>
//         </h1>
//         <p className="text-muted-foreground text-sm md:text-lg font-inter">
//           Provide all the necessary details to publish your PG and reach
//           potential tenants.
//         </p>
//       </div>

//       <div className="text-center space-y-4 pt-5">
//         <div className="max-w-3xl mx-auto space-y-3">
//           <Progress value={progress} className="h-2 " />
//           <p className="text-sm text-gray-500">
//             Step {currentStep} of {totalSteps}
//           </p>
//         </div>
//       </div>

//       <motion.div
//         initial="hidden"
//         animate="visible"
//         exit={{ opacity: 0, x: -20 }}
//         transition={{ type: "spring", stiffness: 300, damping: 30 }}
//         className="w-full text-center mx-auto max-w-[700px] "
//       >
//         <div className="flex justify-between items-center">
//           <h2
//             onClick={() => {
//               if (currentStep === 1 || isSubmitting) return;
//               handlePrevious();
//             }}
//             className={`${
//               currentStep == 2
//                 ? "cursor-not-allowed hover:text-gray-900"
//                 : "cursor-pointer hover:text-HG-400"
//             }  md:text-[18px] font-medium text-gray-900 mb-5 font-poppins flex gap-1 items-center `}
//           >
//             <ArrowLeft className="w-6 h-6" /> Back
//           </h2>

//           <h2 className="md:text-[22px] font-medium text-gray-900 mb-5 font-poppins">
//             {stepTitles[currentStep as keyof typeof stepTitles]}
//           </h2>

//           {currentStep < totalSteps ? (
//             <h2
//               onClick={handleNext}
//               className="md:text-[18px] select-none font-medium text-gray-900 mb-5 font-poppins flex gap-1 items-center hover:text-HG-400 cursor-pointer"
//             >
//               Next <ArrowRight className="w-6 h-6" />
//             </h2>
//           ) : (
//             <h2
//               onClick={() => {
//                 if (isSubmitting) return;
//                 handleSubmit();
//               }}
//               className="md:text-[18px] select-none font-medium text-gray-900 mb-5 font-poppins flex gap-1 items-center hover:text-HG-400 cursor-pointer"
//             >
//               Submit <ArrowRight className="w-6 h-6" />
//             </h2>
//           )}
//         </div>

//         <ErrorMessage message={errors.general} />

//         {renderStep()}
//       </motion.div>

//       <Dialog open={isPaymentModalOpen}>
//         <DialogContent className="max-w-md font-inter">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2 text-HG-500 text-[17px] font-semibold">
//               <CreditCard className="w-5 h-5" />
//               Listing Fee Payment
//             </DialogTitle>
//             <DialogDescription className="text-[13px] text-gray-600 mt-1">
//               Choose your payment option to complete the listing submission.
//             </DialogDescription>
//           </DialogHeader>

//           {/* PAYMENT OPTIONS */}
//           {paymentStatus === "pending" && !isSubmitting && (
//             <div className="space-y-6 py-4">
//               <div className="text-center space-y-1.5">
//                 <div className="text-3xl font-poppins font-bold text-HG-500">
//                   ₹299
//                 </div>
//                 <p className="text-[13px] text-gray-600">
//                   One-time listing fee
//                 </p>
//               </div>

//               <div className="space-y-3">
//                 <Button
//                   onClick={() => handlePayment(true)}
//                   className="w-full bg-HG-400 hover:bg-HG-500 text-white"
//                 >
//                   Pay Now & Publish Immediately
//                 </Button>
//               </div>

//               <p className="text-[12px] text-gray-500 text-center leading-snug">
//                 Listings with pending fees will be published after payment
//                 confirmation.
//               </p>
//             </div>
//           )}

//           {/* LOADING */}
//           {isSubmitting && (
//             <div className="py-10 text-center space-y-4">
//               <div className="animate-spin rounded-full h-12 w-12 border-2 border-HG-400 border-t-transparent mx-auto" />
//               <p className="text-gray-600 text-sm">
//                 Processing your submission...
//               </p>
//             </div>
//           )}

//           {/* PAYMENT SUCCESS */}
//           {paymentStatus === "paid" && (
//             <div className="py-10 text-center space-y-4">
//               <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
//               <h3 className="text-[16px] font-semibold text-green-700">
//                 Payment Successful!
//               </h3>
//               <p className="text-[13px] text-gray-600">
//                 Your PG listing has been published.
//               </p>
//               <Button
//                 onClick={() => router.replace("/routes/dashboard/listings")}
//                 className="mt-4 w-full bg-HG-400 hover:bg-HG-500 text-white"
//               >
//                 Go to My Listings
//               </Button>
//             </div>
//           )}

//           {/* PAYMENT FAILURE */}
//           {paymentStatus === "failed" && (
//             <div className="py-10 text-center space-y-4">
//               <X className="w-12 h-12 text-red-500 mx-auto" />
//               <h3 className="text-[16px] font-semibold text-red-700">
//                 Payment Failed
//               </h3>
//               <p className="text-[13px] text-gray-600">
//                 Please try again after some time.
//               </p>
//             </div>
//           )}

//           {/* SUBMITTED WITH FEE PENDING */}
//           {paymentStatus === "pending" && !isSubmitting && (
//             <div className="py-10 text-center space-y-4">
//               <Clock className="w-12 h-12 text-yellow-500 mx-auto" />
//               <h3 className="text-[16px] font-semibold text-yellow-700">
//                 Submission Successful!
//               </h3>
//               <p className="text-[13px] text-gray-600">
//                 Your listing is saved with fee pending.
//               </p>
//               <Button
//                 onClick={() => {
//                   router.replace("/routes/dashboard/listings");
//                 }}
//                 className="mt-4 w-full bg-HG-400 hover:bg-HG-500 text-white"
//               >
//                 Go to My Listings
//               </Button>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// "use client"

// import { useState, useRef } from "react"
// import { motion } from "framer-motion"
// import { Progress } from "@/components/ui/progress"
// import { ArrowLeft, ArrowRight } from "lucide-react"
// import { toast } from "sonner"
// import axios from "axios"
// import { useUserStore } from "@/store/userStore"
// import { useRouter } from "next/navigation"

// import { ErrorMessage } from "@/app/routes/auth/error-message"
// import { useFormValidation } from "./hooks/useFormValidation"
// import { useImageUpload } from "./hooks/useImageUpload"
// import { Step1BasicInfo } from "./components/Step1BasicInfo"
// import { Step2Location } from "./components/Step2Location"
// import { Step3Amenities } from "./components/Step3Amenities"
// import { Step4Rules } from "./components/Step4Rules"
// import { Step5Images } from "./components/Step5Images"
// import { Step6Review } from "./components/Step6Review"
// import { PaymentModal } from "./components/PaymentModal"
// import { initialFormData, stepTitles } from "./constants"
// import type { PGFormData } from "./types"

// export default function AddNewPGPage() {
//   const [currentStep, setCurrentStep] = useState(1)
//   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "failed">("pending")
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const [formData, setFormData] = useState<PGFormData>(initialFormData)

//   const { user } = useUserStore()
//   const router = useRouter()

//   const { errors, setErrors, validateStep } = useFormValidation(formData)
//   const { handleImageUpload, removeImage } = useImageUpload(formData, setFormData, setErrors)

//   const totalSteps = 6
//   const progress = (currentStep / totalSteps) * 100

//   const handleNext = () => {
//     if (validateStep(currentStep)) {
//       setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
//     }
//   }

//   const handlePrevious = () => {
//     setCurrentStep((prev) => Math.max(prev - 1, 1))
//   }

//   const handlePayment = async (payNow: boolean) => {
//     setIsSubmitting(true)
//     await new Promise((resolve) => setTimeout(resolve, 2000))

//     if (payNow) {
//       const success = Math.random() > 0.2
//       setPaymentStatus(success ? "paid" : "failed")
//     } else {
//       setPaymentStatus("pending")
//     }

//     setIsSubmitting(false)
//     setTimeout(() => {
//       setIsPaymentModalOpen(false)
//       router.replace("/routes/dashboard/listings")
//     }, 2000)
//   }

//   const toBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader()
//       reader.readAsDataURL(file)
//       reader.onload = () => resolve(reader.result as string)
//       reader.onerror = (error) => reject(error)
//     })
//   }

//   const handleSubmit = async () => {
//     if (isSubmitting || !validateStep(currentStep)) return
//     setIsSubmitting(true)

//     const loadingToast = toast.loading("Uploading documents...", {
//       closeButton: true,
//     })

//     try {
//       const imagesBase64 = await Promise.all(formData.images.map((file) => toBase64(file)))

//       const res = await axios.post("/api/owner/listPg", {
//         pgName: formData.pgName,
//         monthlyRent: formData.monthlyRent,
//         securityDeposit: formData.securityDeposit,
//         numberOfRooms: formData.numberOfRooms,
//         capacityPerRoom: formData.capacityPerRoom,
//         genderPreference: formData.genderPreference,
//         additionalDetails: formData.additionalDetails,
//         location: {
//           area: formData.location.area,
//           city: formData.location.city,
//           state: formData.location.state,
//           pincode: formData.location.pincode,
//           coordinates: formData.location.coordinates,
//         },
//         rulesAndRegulations: formData.rulesAndRegulations,
//         amenities: formData.amenities,
//         foodIncluded: formData.foodIncluded,
//         electricityIncluded: formData.electricityIncluded,
//         maintenanceIncluded: formData.maintenanceIncluded,
//         images: imagesBase64,
//       })

//       if (res?.data?.success) {
//         toast.success(res.data.message || "PG listed successfully!", {
//           duration: 3000,
//           closeButton: true,
//         })
//         setIsPaymentModalOpen(true)
//       } else {
//         toast.error(res?.data?.message || "Something went wrong", {
//           duration: 3000,
//           closeButton: true,
//         })
//         setErrors((prev: any) => ({
//           ...prev,
//           general: res?.data?.message || "Unknown error",
//         }))
//       }
//     } catch (error) {
//       console.error("submitPGStep error:", error)
//       toast.error("Failed to submit PG. Try again.", {
//         duration: 3000,
//         closeButton: true,
//       })
//       setErrors((prev: any) => ({
//         ...prev,
//         general: "Failed to submit PG. Try again.",
//       }))
//     } finally {
//       toast.dismiss(loadingToast)
//       setIsSubmitting(false)
//     }
//   }

//   const renderStep = () => {
//     const stepProps = {
//       formData,
//       setFormData,
//       errors,
//       setErrors,
//     }

//     switch (currentStep) {
//       case 1:
//         return <Step1BasicInfo {...stepProps} />
//       case 2:
//         return <Step2Location {...stepProps} />
//       case 3:
//         return <Step3Amenities {...stepProps} />
//       case 4:
//         return <Step4Rules {...stepProps} />
//       case 5:
//         return (
//           <Step5Images
//             {...stepProps}
//             fileInputRef={fileInputRef}
//             handleImageUpload={handleImageUpload}
//             removeImage={removeImage}
//           />
//         )
//       case 6:
//         return <Step6Review formData={formData} />
//       default:
//         return null
//     }
//   }

//   return (
//     <div className="flex flex-col gap-6 min-h-[calc(100vh-15px)]">
//       <div className="flex flex-col gap-2 md:pt-5">
//         <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
//           Add a New <span className="text-HG-500">PG Listing</span>
//         </h1>
//         <p className="text-muted-foreground text-sm md:text-lg font-inter">
//           Provide all the necessary details to publish your PG and reach potential tenants.
//         </p>
//       </div>

//       <div className="text-center space-y-4 pt-5">
//         <div className="max-w-3xl mx-auto space-y-3">
//           <Progress value={progress} className="h-2" />
//           <p className="text-sm text-gray-500">
//             Step {currentStep} of {totalSteps}
//           </p>
//         </div>
//       </div>

//       <motion.div
//         initial="hidden"
//         animate="visible"
//         exit={{ opacity: 0, x: -20 }}
//         transition={{ type: "spring", stiffness: 300, damping: 30 }}
//         className="w-full text-center mx-auto max-w-[700px]"
//       >
//         <div className="flex justify-between items-center">
//           <h2
//             onClick={() => {
//               if (currentStep === 1 || isSubmitting) return
//               handlePrevious()
//             }}
//             className={`${
//               currentStep == 1 ? "cursor-not-allowed hover:text-gray-900" : "cursor-pointer hover:text-HG-400"
//             } md:text-[18px] font-medium text-gray-900 mb-5 font-poppins flex gap-1 items-center`}
//           >
//             <ArrowLeft className="w-6 h-6" /> Back
//           </h2>

//           <h2 className="md:text-[22px] font-medium text-gray-900 mb-5 font-poppins">
//             {stepTitles[currentStep as keyof typeof stepTitles]}
//           </h2>

//           {currentStep < totalSteps ? (
//             <h2
//               onClick={handleNext}
//               className="md:text-[18px] select-none font-medium text-gray-900 mb-5 font-poppins flex gap-1 items-center hover:text-HG-400 cursor-pointer"
//             >
//               Next <ArrowRight className="w-6 h-6" />
//             </h2>
//           ) : (
//             <h2
//               onClick={() => {
//                 if (isSubmitting) return
//                 handleSubmit()
//               }}
//               className="md:text-[18px] select-none font-medium text-gray-900 mb-5 font-poppins flex gap-1 items-center hover:text-HG-400 cursor-pointer"
//             >
//               Submit <ArrowRight className="w-6 h-6" />
//             </h2>
//           )}
//         </div>

//         <ErrorMessage message={errors.general} />
//         {renderStep()}
//       </motion.div>

//       <PaymentModal
//         isOpen={isPaymentModalOpen}
//         paymentStatus={paymentStatus}
//         isSubmitting={isSubmitting}
//         onPayment={handlePayment}
//         onNavigate={() => router.replace("/routes/dashboard/listings")}
//       />
//     </div>
//   )
// }

"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

import { ErrorMessage } from "@/app/routes/auth/error-message";
import { useFormValidation } from "./hooks/useFormValidation";
import { useImageUpload } from "./hooks/useImageUpload";
import { useVideoUpload } from "./hooks/useVideoUpload";
import { Step1BasicInfo } from "./components/Step1BasicInfo";
import { Step3Amenities } from "./components/Step3Amenities";
import { Step4Rules } from "./components/Step4Rules";
import { Step5Images } from "./components/Step5Images";
import { Step6Review } from "./components/Step6Review";
import { PaymentModal } from "./components/PaymentModal";
import { initialFormData, stepTitles } from "./constants";
import type { PGFormData } from "./types";
import dynamic from "next/dynamic";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useLoadingStore } from "@/store/loading";

// Dynamic import with proper loading component and error handling
const Step2Location = dynamic(() => import("./components/Step2Location"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading location picker...</p>
      </div>
    </div>
  ),
});

export default function AddNewPG() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const listingId = searchParams.get("id");
  // const payNow = searchParams.get("payNow");

  const [currentStep, setCurrentStep] = useState(1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "paid" | "failed"
  >("pending");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<PGFormData>(initialFormData); // 👈 initialFormData is a constant

  // const { user } = useUserStore()
  const router = useRouter();

  const { errors, setErrors, validateStep } = useFormValidation(formData);
  const { handleImageUpload, removeImage } = useImageUpload(
    formData,
    setFormData,
    setErrors
  );
  const { handleVideoUpload, removeVideo } = useVideoUpload(
    formData,
    setFormData,
    setErrors
  );

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const { setLoading } = useLoadingStore();

  useEffect(() => {
    let ignore = false;
    const fetchListingForEdit = async () => {
      if (mode !== "edit" || !listingId) {
        setLoading(false);
        setFormData(initialFormData);
        return;
      }

      setLoading(true);
      const payNow = searchParams.get("payNow") === "true"; // 👈

      try {
        const res = await axios.get(`/api/listing/${listingId}`);

        if (res?.data?.success && res.data.data && !ignore) {
          const listing = res.data.data.listing;

          // console.log(listing);

          setFormData((prev: any) => ({
            ...prev,
            pgName: listing?.pgName,
            type: listing?.type || "",
            subType: listing?.subType || "",
            roomTypes: listing?.roomTypes || [],
            genderPreference: listing.genderPreference,
            additionalDetails: listing.additionalDetails,
            additionalDetailsInput: "",
            location: {
              area: listing.location?.area,
              city: listing.location?.city,
              state: listing.location?.state,
              pincode: listing.location?.pincode,
              nearbyPlaces: listing.location?.nearbyPlaces || [],
              nearbyPlacesInput: "",
              coordinates: {
                lat: listing.location?.coordinates.coordinates[0],
                lng: listing.location?.coordinates.coordinates[1],
              },
            },
            rulesAndRegulations: listing.rulesAndRegulations,
            newRuleInput: "",
            detailedRules: listing.detailedRules || {
              lockInPeriod: "",
              noticePeriod: "",
              maintenanceCharges: "",
              entryTiming: "",
              exitTiming: "",
              guestStayPolicy: "",
              smokingAlcoholPolicy: "",
            },
            amenities: listing.amenities,
            customAmenities: "",
            foodIncluded: listing?.rentInclusions?.foodIncluded || false,
            electricityIncluded:
              listing?.rentInclusions?.electricityIncluded || false,
            maintenanceIncluded:
              listing?.rentInclusions?.maintenanceIncluded || false,
            images: [],
            existingImageUrls:
              listing.images?.map((img: { url: string }) => img.url) || [],
            videos: [],
            existingVideoUrls:
              listing.videos?.map((video: { url: string }) => video.url) || [],
          }));

          // 👇 Automatically move to payment step if `payNow=true`
          if (payNow) {
            setTimeout(() => {
              setCurrentStep(6);
              setIsPaymentModalOpen(true); // 👈 or 4 if you want to jump to Payment directly
            }, 200); // slight delay after form is populated
          }
        } else if (!ignore) {
          toast.error(res?.data?.message || "Listing not found", {
            duration: 1500,
          });
          router.replace("/routes/dashboard/owners/listings");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        if (!ignore) {
          toast.error("Failed to fetch listing", { duration: 1500 });
          router.replace("/");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchListingForEdit();
    return () => {
      ignore = true;
    };
  }, [mode, listingId, router, searchParams, setLoading]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePayment = async (payNow: boolean, proofFile?: File | null) => {
    setIsSubmitting(true);

    try {
      if (payNow && proofFile) {
        const base64 = await toBase64(proofFile);

        const res = await axios.put("/api/owner/listPg/payment", {
          proof: base64,
          listingId: listingId || formData.id, // Use formData.id if listingId is not available
        });

        // console.log(res);

        if (res?.data?.success) {
          setPaymentStatus("paid");
        } else {
          setPaymentStatus("failed");
          toast.error("Payment proof upload failed.");
          return;
        }
      } else {
        // User selected "Submit with fee pending"
        setPaymentStatus("pending");
      }

      setIsPaymentModalOpen(false);
      router.replace("/routes/dashboard/owners/listings");
    } catch (error) {
      console.error("Payment handling failed:", error);
      setPaymentStatus("failed");
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRemoveExistingImage = (index: number) => {
    setFormData((prev: any) => {
      const updated = [...prev.existingImageUrls];
      updated.splice(index, 1);
      return { ...prev, existingImageUrls: updated };
    });
  };

  const handleRemoveExistingVideo = (index: number) => {
    setFormData((prev: any) => {
      const updated = [...prev.existingVideoUrls];
      updated.splice(index, 1);
      return { ...prev, existingVideoUrls: updated };
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validateStep(currentStep)) return;
    setIsSubmitting(true);

    const loadingToast = toast.loading(
      mode === "edit" ? "Updating listing..." : "Uploading documents...",
      {
        closeButton: true,
      }
    );

    try {
      const newImagesBase64 = await Promise.all(
        formData.images.map((file: any) => toBase64(file))
      );

      const newVideosBase64 = await Promise.all(
        formData.videos.map((file: any) => toBase64(file))
      );

      const allImages = [...formData.existingImageUrls, ...newImagesBase64];
      const allVideos = [...formData.existingVideoUrls, ...newVideosBase64];

      const payload = {
        ...formData,
        images: allImages,
        videos: allVideos,
      };

      const res =
        mode === "edit"
          ? await axios.put(`/api/owner/listPg/${listingId}`, payload)
          : await axios.post("/api/owner/listPg", payload);

      if (res?.data?.success) {
        setFormData((prev: any) => ({
          ...prev,
          id: res.data.data || prev.id, // Update ID if available
        }));
        toast.success(res.data.message || "Success!", {
          duration: 3000,
          closeButton: true,
        });

        if (mode === "edit") {
          router.replace("/routes/dashboard/owners/listings");
        }
        setIsPaymentModalOpen(true);
      } else {
        toast.error(res?.data?.message || "Something went wrong", {
          duration: 3000,
          closeButton: true,
        });
        setErrors((prev: any) => ({
          ...prev,
          general: res?.data?.message || "Unknown error",
        }));
      }
    } catch (error) {
      console.error("submitPGStep error:", error);
      toast.error("Failed . Try again.", {
        duration: 3000,
        closeButton: true,
      });
      setErrors((prev: any) => ({
        ...prev,
        general: "Failed . Try again.",
      }));
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const stepProps = {
      formData,
      setFormData,
      errors,
      setErrors,
    };

    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            key={formData?.roomTypes?.length || 0} // 👈 This forces re-render when roomTypes load
            {...stepProps}
          />
        );
      case 2:
        return <Step2Location {...stepProps} />;
      case 3:
        return <Step3Amenities {...stepProps} />;
      case 4:
        return <Step4Rules {...stepProps} />;
      case 5:
        return (
          <Step5Images
            {...stepProps}
            fileInputRef={fileInputRef}
            videoInputRef={videoInputRef}
            handleImageUpload={handleImageUpload}
            handleVideoUpload={handleVideoUpload}
            removeImage={removeImage}
            removeVideo={removeVideo}
            existingImageUrls={formData?.existingImageUrls}
            existingVideoUrls={formData?.existingVideoUrls}
            handleRemoveExistingImage={handleRemoveExistingImage}
            handleRemoveExistingVideo={handleRemoveExistingVideo}
          />
        );
      case 6:
        return <Step6Review formData={formData} isEditMode={mode === "edit"} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-15px)]">
      <div className="flex flex-col gap-2 md:pt-5">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
          {listingId ? "Edit " : "Add a New "}
          <span className="text-HG-500">PG Listing</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-lg font-inter">
          {listingId
            ? "Edit your PG details and images."
            : "Provide all the necessary details to publish your PG and reach potential tenants."}
        </p>
      </div>

      <div className="text-center space-y-4 pt-5">
        <div className="max-w-3xl mx-auto space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </p>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, x: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full text-center mx-auto max-w-[700px]"
      >
        <div className="flex justify-between items-center">
          <h2
            onClick={() => {
              if (currentStep === 1 || isSubmitting) return;
              handlePrevious();
            }}
            className={`${
              currentStep == 1
                ? "cursor-not-allowed hover:text-gray-900"
                : "cursor-pointer hover:text-HG-400"
            } md:text-[18px] font-medium text-gray-900 mb-5 font-poppins flex gap-1 items-center`}
          >
            <ArrowLeft className="w-6 h-6" /> Back
          </h2>

          <h2 className="md:text-[22px] font-medium text-gray-900 mb-5 font-poppins">
            {stepTitles[currentStep as keyof typeof stepTitles]}
          </h2>

          {currentStep < totalSteps ? (
            <h2
              onClick={handleNext}
              className="md:text-[18px] select-none font-medium text-gray-900 mb-5 font-poppins flex gap-1 items-center hover:text-HG-400 cursor-pointer"
            >
              Next <ArrowRight className="w-6 h-6" />
            </h2>
          ) : (
            <h2
              onClick={() => {
                if (isSubmitting) return;
                handleSubmit();
              }}
              className="md:text-[18px] select-none font-medium text-gray-900 mb-5 font-poppins flex gap-1 items-center hover:text-HG-400 cursor-pointer"
            >
              {mode === "edit" ? "Update" : "Submit"}{" "}
              <ArrowRight className="w-6 h-6" />
            </h2>
          )}
        </div>

        <ErrorMessage message={errors.general} />
        {renderStep()}
      </motion.div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        paymentStatus={paymentStatus}
        isSubmitting={isSubmitting}
        onPayment={handlePayment}
        onNavigate={() => router.replace("/routes/dashboard/owners/listings")}
      />
    </div>
  );
}
