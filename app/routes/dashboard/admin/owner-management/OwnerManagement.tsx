// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import {
//   CheckCircle,
//   XCircle,
//   Loader2,
//   User,
//   Eye,
//   FileText,
//   Phone,
//   Mail,
//   MapPin,
//   CreditCard,
//   Shield,
//   Plus,
// } from "lucide-react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { toast } from "sonner";
// import {
//   Drawer,
//   DrawerContent,
//   DrawerHeader,
//   DrawerTitle,
// } from "@/components/ui/drawer";
// import axios from "axios";
// import { BlurImage } from "@/components/BlurImage";
// import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";

// const OwnerManagement = () => {
//  const [owners, setOwners] = useState<any[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");
//   const [loading, setLoading] = useState(true);
//   const [activeOwner, setActiveOwner] = useState<any | null>(null);
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [ownerDetailsLoading, setOwnerDetailsLoading] = useState(false);

//   const searchParams = useSearchParams();
//   const mode = searchParams.get("mode");
//   const ownerId = searchParams.get("id");

//   const router = useRouter();

//   useEffect(() => {
//     const fetchOwners = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get("/api/admin/getOwner");
//         if (res?.data?.success) {
//           setOwners(res.data.data);
//         } else {
//           toast.error("Failed to fetch owners");
//         }
//       } catch {
//         toast.error("Something went wrong");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOwners();
//   }, []);

//   useEffect(() => {
//     if (mode === "view" && ownerId) {
//       handleViewOwner(ownerId);
//       const url = new URL(window.location.href);
//       url.searchParams.delete("mode");
//       url.searchParams.delete("id");
//       router.replace(url.pathname); // Replaces URL without full reload
//     }
//   }, []);

//   const fetchOwnerDetails = async (userId: string) => {
//     setOwnerDetailsLoading(true);
//     try {
//       const res = await axios.get("/api/admin/getOwner/" + userId);
//       if (res?.data?.success) {
//         setActiveOwner(res.data.data);
//       } else {
//         toast.error("Failed to fetch owner");
//       }
//     } catch {
//       toast.error("Something went wrong");
//     } finally {
//       setOwnerDetailsLoading(false);
//     }
//   };

//   const handleViewOwner = async (userId: string) => {
//     setDrawerOpen(true);
//     await fetchOwnerDetails(userId);
//   };

//   const handleApproval = async (id: string) => {
//     setDrawerOpen(false);
//     setLoading(true);

//     toast.loading("Updating owner status...");

//     try {
//       const res = await axios.put(`/api/admin/ownerStatus/${id}`);

//       if (res?.data?.success) {
//         toast.success(res.data.message || "Owner status updated");

//         setOwners((prev) =>
//           prev.map((owner) =>
//             owner._id === id
//               ? { ...owner, ownerStatus: res.data.newStatus }
//               : owner
//           )
//         );
//       } else {
//         toast.error("Failed to update owner status");
//       }
//     } catch (error) {
//       toast.error("Something went wrong");
//     } finally {
//       toast.dismiss();
//       setLoading(false);
//     }
//   };

//   const filteredOwners = owners
//     .filter((owner) => {
//       if (filter === "verified") return owner.ownerStatus === "verified";
//       if (filter === "pending") return owner.ownerStatus === "pending";
//       return true;
//     })
//     .filter((owner) => {
//       const val = searchQuery.toLowerCase();
//       return (
//         owner.fullName.toLowerCase().includes(val) ||
//         owner.email.toLowerCase().includes(val)
//       );
//     });

//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "verified":
//         return (
//           <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
//             Verified
//           </span>
//         );
//       default:
//         return (
//           <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
//             Pending
//           </span>
//         );
//     }
//   };

//   return (
//     <div className="flex flex-col gap-6 min-h-[calc(100vh-15px)]">
//       <div className="flex flex-col md:flex-row justify-between md:items-center">
//         <div className="flex flex-col gap-2 md:pt-5">
//           <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
//             Owner <span className="text-HG-500">Management</span>
//           </h1>
//           <p className="text-muted-foreground text-sm md:text-lg font-inter">
//             Review and approve owner verification requests
//           </p>
//         </div>
//           <Link href={"/routes"}>
//           <Button className="font-poppins hidden md:flex py-6 shadow-lg">
//             <Plus className="w-4 h-4 md:mr-2" />
//             Add New User
//           </Button>
//         </Link>
//       </div>

//       <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start">
//         <div className="flex items-center gap-2 md:w-[30%] md:min-w-[300px] justify-between">
//           <div className="relative w-full max-w-[300px] md:min-w-[300px]">
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search Owner..."
//               className="w-full px-10 py-2 font-poppins text-sm md:text-base rounded-lg bg-[#faf4eb] text-black focus:outline-HG-400/40"
//             />
//             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//               <svg
//                 className="w-4 h-4"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   d="M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
//                 />
//               </svg>
//             </div>
//             {searchQuery && (
//               <div
//                 onClick={() => setSearchQuery("")}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
//               >
//                 <svg
//                   className="w-4 h-4"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               </div>
//             )}
//           </div>
//         </div>
//         <div className="justify-end hidden md:flex flex-wrap gap-3 text-gray-600 font-inter">
//           <Select
//             value={filter}
//             onValueChange={(value) =>
//               setFilter(
//                 value.toLowerCase() as "all" | "verified" | "pending"
//                 // | "rejected"
//               )
//             }
//           >
//             <SelectTrigger className="w-32 md:w-[130px] border-gray-200">
//               <SelectValue placeholder="Status Filter" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All</SelectItem>
//               <SelectItem value="verified">Verified</SelectItem>
//               <SelectItem value="pending">Pending</SelectItem>
//               {/* <SelectItem value="rejected">Rejected</SelectItem> */}
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       {/* List or loader */}
//       <div className="w-full pb-14 space-y-6">
//         {loading ? (
//           <div className="h-[60vh] z-[99999] flex items-center justify-center bg-white bg-opacity-60 backdrop-blur-sm transition-opacity duration-500">
//             <svg
//               aria-hidden="true"
//               className="inline w-14 h-14 md:w-14 md:h-14 animate-spin fill-[#ffe0ae]"
//               viewBox="0 0 100 101"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" />
//               <path
//                 d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
//                 fill="#D58F24"
//               />
//             </svg>
//             <span className="sr-only">Loading...</span>
//           </div>
//         ) : filteredOwners.length === 0 ? (
//           <Card className="h-[60vh] w-full flex justify-center items-center shadow-none border-none">
//             <CardContent className="p-12 text-center font-inter">
//               <User className="w-20 h-20 mx-auto text-HG-500 mb-4" />
//               <h3 className="text-xl font-semibold text-gray-600 mb-2">
//                 No Owners found
//               </h3>
//               <p className="text-gray-500">
//                 Try adjusting your search or filters
//               </p>
//             </CardContent>
//           </Card>
//         ) : (
//           <CardContent className="p-0 pt-5">
//             <div className="w-full">
//               {/* Desktop version */}
//               <div className="hidden md:flex flex-col space-y-4">
//                 {/* Header Row */}
//                 <div className="flex justify-between items-center border-b border-gray-200 pb-2 px-2">
//                   <p className="text-sm font-medium text-gray-500 w-1/3">
//                     Name
//                   </p>
//                   <div className="flex justify-between w-2/5 pr-10 ">
//                     <p className="text-sm font-medium text-gray-500 pl-2">
//                       Status
//                     </p>
//                     <p className="text-sm font-medium text-gray-500">
//                       Documents
//                     </p>
//                   </div>
//                 </div>
//                 {/* Data Rows */}
//                 {filteredOwners.map((owner) => (
//                   <div
//                     key={owner._id}
//                     className="flex justify-between items-center bg-white border-b pr-2  pl-4 py-3 "
//                   >
//                     {/* Name */}
//                     <div className="w-1/3 font-medium text-gray-800">
//                       {owner.fullName}
//                     </div>
//                     {/* Status & Actions */}
//                     <div className="flex justify-between items-center w-2/5 pr-10 ">
//                       {/* Status */}
//                       <div>{getStatusBadge(owner.ownerStatus)}</div>
//                       {/* Documents / Actions */}
//                       <div>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() => handleViewOwner(owner._id)}
//                           className="flex items-center gap-1"
//                         >
//                           <Eye className="h-4 w-4" />
//                           View
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               {/* Mobile version */}
//               <div className="md:hidden space-y-4">
//                 {filteredOwners.map((owner) => (
//                   <div
//                     key={owner._id}
//                     className="border rounded-xl p-4 space-y-2 bg-white shadow-sm"
//                   >
//                     <p className="font-medium text-base">{owner.fullName}</p>
//                     <div className="flex justify-between items-center text-sm">
//                       <span>{getStatusBadge(owner.ownerStatus)}</span>
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         onClick={() => handleViewOwner(owner._id)}
//                         className="flex items-center gap-1"
//                       >
//                         <Eye className="h-4 w-4" />
//                         View
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </CardContent>
//         )}
//       </div>

//       {/* Drawer */}
//       <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
//         <DrawerContent className="max-h-[90vh] [scrollbar-width:none]">
//           <DrawerHeader className="flex justify-between items-center">
//             <div className="flex items-center gap-5">
//               <DrawerTitle className="text-xl font-semibold font-poppins">
//                 Owner Details
//               </DrawerTitle>
//               <div className="flex items-center text-sm md:text-lg md:pr-4 justify-between">
//                 {activeOwner && getStatusBadge(activeOwner?.ownerStatus)}
//               </div>
//             </div>

//             <Button
//               className={`${
//                 activeOwner?.ownerStatus === "verified"
//                   ? "bg-red-400 hover:bg-red-600"
//                   : "bg-green-400 hover:bg-green-600"
//               }`}
//               onClick={() => handleApproval(activeOwner?._id)}
//             >
//               {activeOwner?.ownerStatus === "verified" ? (
//                 <>
//                   <XCircle className="h-4 w-4 mr-2" />
//                   Unverify
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle className="h-4 w-4 mr-2" />
//                   Verify
//                 </>
//               )}
//             </Button>
//           </DrawerHeader>

//           <div className="px-4 pb-6 overflow-y-auto  [scrollbar-width:none]">
//             {ownerDetailsLoading ? (
//               <div className="flex items-center justify-center py-12">
//                 <Loader2 className="h-8 w-8 animate-spin text-HG-500" />
//                 <span className="ml-2 text-gray-600">
//                   Loading owner details...
//                 </span>
//               </div>
//             ) : activeOwner ? (
//               <div className="space-y-6">
//                 {/* Owner Information */}

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="bg-[#faf4eb] rounded-lg p-4">
//                     <h3 className="text-lg font-semibold mb-3 text-gray-800">
//                       Personal Information
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <div>
//                         <div className="flex gap-2 items-center">
//                           <User className="h-4 w-4 text-gray-500" />
//                           <p className="text-sm text-gray-500">Full Name</p>
//                         </div>

//                         <p>{activeOwner.fullName}</p>
//                       </div>

//                       <div>
//                         <div className="flex gap-2 items-center">
//                           <Phone className="h-4 w-4 text-gray-500" />
//                           <p className="text-sm text-gray-500">Phone</p>
//                         </div>
//                         <p>{activeOwner.ownerDetails.phone}</p>
//                       </div>

//                       <div>
//                         <div className="flex gap-2 items-center">
//                           <Shield className="h-4 w-4 text-gray-500" />
//                           <p className="text-sm text-gray-500">
//                             Aadhaar Number
//                           </p>
//                         </div>
//                         <p>{activeOwner.ownerDetails.aadhaarNumber}</p>
//                       </div>

//                       <div>
//                         <div className="flex gap-2 items-center">
//                           <Mail className="h-4 w-4 text-gray-500" />
//                           <p className="text-sm text-gray-500">Email</p>
//                         </div>
//                         <p>{activeOwner.email}</p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Address Information */}
//                   <div className="bg-[#faf4eb] h-full rounded-lg p-4">
//                     <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
//                       <MapPin className="h-5 w-5" />
//                       Address Information
//                     </h3>
//                     <div className="space-y-2">
//                       <p className="font-medium">
//                         {activeOwner.ownerDetails.address.street}
//                       </p>
//                       <p className="text-gray-600">
//                         {activeOwner.ownerDetails.address.city},{" "}
//                         {activeOwner.ownerDetails.address.state} -{" "}
//                         {activeOwner.ownerDetails.address.pincode}
//                       </p>
//                       <p className="text-gray-600">
//                         {activeOwner.ownerDetails.address.country}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Payment Details */}
//                 {activeOwner.ownerDetails?.paymentDetails && (
//                   <div className="bg-[#faf4eb] rounded-lg p-4">
//                     <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
//                       <CreditCard className="h-5 w-5" />
//                       Payment Details
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div>
//                         <p className="text-sm text-gray-500">Account Holder</p>
//                         <p className="font-medium">
//                           {
//                             activeOwner.ownerDetails.paymentDetails
//                               .accountHolderName
//                           }
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">Bank Name</p>
//                         <p className="font-medium">
//                           {activeOwner.ownerDetails.paymentDetails.bankName}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">Account Number</p>
//                         <p className="font-medium">
//                           {
//                             activeOwner.ownerDetails.paymentDetails
//                               .accountNumber
//                           }
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">IFSC Code</p>
//                         <p className="font-medium">
//                           {activeOwner.ownerDetails.paymentDetails.ifscCode}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">UPI ID</p>
//                         <p className="font-medium">
//                           {activeOwner.ownerDetails.paymentDetails.upiId}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Documents */}
//                 {activeOwner.ownerDetails?.documents && (
//                   <div>
//                     <h3 className="text-lg font-semibold mb-3 text-gray-800">
//                       Uploaded Documents
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       {/* Aadhaar Front */}
//                       <div className=" rounded-lg  p-4 bg-[#faf4eb]">
//                         <div className="flex gap-3 items-center">
//                           <FileText className="h-5 w-5 text-blue-500 mt-1" />
//                           <p className="font-medium text-gray-800">
//                             Aadhaar Card (Front)
//                           </p>
//                         </div>

//                         <div className="overflow-hidden mt-2">
//                           <BlurImage
//                             width={500}
//                             height={500}
//                             src={
//                               activeOwner?.ownerDetails?.documents
//                                 ?.aadhaarFrontUrl || "/placeholder.svg"
//                             }
//                             alt="Aadhaar Front"
//                             className=" w-full h-[300px] object-cover overflow-hidden cursor-pointer rounded border"
//                             crossOrigin="anonymous"
//                             openInNewTab={true}
//                           />
//                         </div>
//                       </div>

//                       {/* Aadhaar Back */}

//                       <div className=" rounded-lg p-4 bg-[#faf4eb]">
//                         <div className="flex gap-3 items-center">
//                           <FileText className="h-5 w-5 text-blue-500 mt-1" />
//                           <p className="font-medium text-gray-800">
//                             Aadhaar Card (Back)
//                           </p>
//                         </div>

//                         <div className="overflow-hidden mt-2">
//                           <BlurImage
//                             width={500}
//                             height={500}
//                             src={
//                               activeOwner?.ownerDetails?.documents
//                                 ?.aadhaarBackUrl || "/placeholder.svg"
//                             }
//                             alt="Aadhaar Front"
//                             className=" w-full h-[300px] object-cover overflow-hidden cursor-pointer rounded border"
//                             crossOrigin="anonymous"
//                             openInNewTab={true}
//                           />
//                         </div>
//                       </div>

//                       {/* Additional Documents */}
//                       {activeOwner.ownerDetails.documents.additionalDocuments?.map(
//                         (doc: any, index: number) => (
//                           <div
//                             key={index}
//                             className=" rounded-lg p-4 bg-[#faf4eb]"
//                           >
//                             <div className="flex gap-3 items-center">
//                               <FileText className="h-5 w-5 text-blue-500 mt-1" />
//                               <p className="font-medium text-gray-800">
//                                 Additional Document {index + 1}
//                               </p>
//                             </div>

//                             <div className="overflow-hidden mt-2">
//                               <BlurImage
//                                 width={500}
//                                 height={500}
//                                 src={
//                                   activeOwner?.ownerDetails?.documents
//                                     ?.aadhaarFrontUrl || "/placeholder.svg"
//                                 }
//                                 alt="Aadhaar Front"
//                                 className=" w-full h-[300px] object-cover overflow-hidden cursor-pointer rounded border"
//                                 crossOrigin="anonymous"
//                                 openInNewTab={true}
//                               />
//                             </div>
//                           </div>
//                         )
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="text-center py-8">
//                 <p className="text-gray-500">No owner details available</p>
//               </div>
//             )}
//           </div>
//         </DrawerContent>
//       </Drawer>
//     </div>
//   );
// }

// export default OwnerManagement

"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Eye,
  FileText,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Shield,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import axios from "axios";
import { BlurImage } from "@/components/BlurImage";
import { useRouter, useSearchParams } from "next/navigation";

const OwnerManagement = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");
  const [loading, setLoading] = useState(true);
  const [activeOwner, setActiveOwner] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ownerDetailsLoading, setOwnerDetailsLoading] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");

  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErrorDialogOpen, setDeleteErrorDialogOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const ownerId = searchParams.get("id");
  const router = useRouter();

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/getOwner");
      if (res?.data?.success) {
        setOwners(res.data.data);
      } else {
        toast.error("Failed to fetch owners");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const PASSWORD_REQUIREMENTS = {
    MIN_LENGTH: 6,
    PATTERNS: {
      LOWERCASE: /[a-z]/,
      UPPERCASE: /[A-Z]/,
      NUMBER: /\d/,
      SPECIAL_CHAR: /[!@#$%^&*(),.?":{}|<>]/,
    },
  } as const;

  const EMAIL_PATTERN = /\S+@\S+\.\S+/;

  const handleCreateUser = async () => {
    if (!newUserFullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!newUserEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!EMAIL_PATTERN.test(newUserEmail)) {
      toast.error("Invalid email format");
      return;
    }

    if (!newUserPhone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!/^\d{10}$/.test(newUserPhone.trim())) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    if (!newUserPassword.trim()) {
      toast.error("Password is required");
      return;
    }

    if (newUserPassword.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!PASSWORD_REQUIREMENTS.PATTERNS.LOWERCASE.test(newUserPassword)) {
      toast.error("Password must contain a lowercase letter");
      return;
    }

    if (!PASSWORD_REQUIREMENTS.PATTERNS.UPPERCASE.test(newUserPassword)) {
      toast.error("Password must contain an uppercase letter");
      return;
    }

    if (!PASSWORD_REQUIREMENTS.PATTERNS.NUMBER.test(newUserPassword)) {
      toast.error("Password must contain a number");
      return;
    }

    if (!PASSWORD_REQUIREMENTS.PATTERNS.SPECIAL_CHAR.test(newUserPassword)) {
      toast.error("Password must contain a special character");
      return;
    }

    setCreateUserLoading(true);
    try {
      const res = await axios.post("/api/admin/createUser", {
        fullName: newUserFullName,
        email: newUserEmail,
        password: newUserPassword,
        phone: newUserPhone,
      });

      if (res?.data?.success) {
        toast.success("User created successfully");
        setDialogOpen(false);
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserFullName("");
        setNewUserPhone("");
        fetchOwners(); // Refresh the owners list after creating a new user
        // Optionally refresh the owners list
      } else {
        toast.error(res?.data?.message || "Failed to create user");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setCreateUserLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwnerDetails = async (userId: string) => {
    setOwnerDetailsLoading(true);
    try {
      const res = await axios.get("/api/admin/getOwner/" + userId);
      if (res?.data?.success) {
        setActiveOwner(res.data.data);
      } else {
        toast.error("Failed to fetch owner");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setOwnerDetailsLoading(false);
    }
  };

  const handleViewOwner = useCallback(async (userId: string) => {
    setDrawerOpen(true);
    await fetchOwnerDetails(userId);
  }, []);

  useEffect(() => {
    if (mode === "view" && ownerId) {
      handleViewOwner(ownerId);
      const url = new URL(window.location.href);
      url.searchParams.delete("mode");
      url.searchParams.delete("id");
      router.replace(url.pathname);
    }
  }, [mode, ownerId, handleViewOwner, router]);

  const handleApproval = async (id: string) => {
    setDrawerOpen(false);
    setLoading(true);
    toast.loading("Updating owner status...");
    try {
      const res = await axios.put(`/api/admin/ownerStatus/${id}`);
      if (res?.data?.success) {
        toast.success(res.data.message || "Owner status updated");
        setOwners((prev) =>
          prev.map((owner) =>
            owner._id === id
              ? { ...owner, ownerStatus: res.data.newStatus }
              : owner
          )
        );
      } else {
        toast.error("Failed to update owner status");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      toast.dismiss();
      setLoading(false);
    }
  };

  const handleDeleteClick = (owner: any) => {
    setOwnerToDelete(owner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    setDeleteConfirmDialogOpen(true);
  };

  const handleDeleteOwner = async () => {
    if (!ownerToDelete) return;

    setDeleteLoading(true);
    toast.loading("Deleting owner...");
    try {
      const res = await axios.delete(
        `/api/admin/deleteOwner/${ownerToDelete._id}`
      );
      if (res?.data?.success) {
        toast.success("Owner deleted successfully");
        fetchOwners(); // Refresh the owners list
        setDeleteConfirmDialogOpen(false);
        setOwnerToDelete(null);
      } else {
        // Show error in dialog instead of toast
        setDeleteErrorMessage(res?.data?.message || "Failed to delete owner");
        setDeleteErrorDialogOpen(true);
        setDeleteConfirmDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      const errorMessage =
        error?.response?.data?.message || "Something went wrong";
      // Show error in dialog instead of toast
      setDeleteErrorMessage(errorMessage);
      setDeleteErrorDialogOpen(true);
      setDeleteConfirmDialogOpen(false);
      console.log("Error response:", error?.response?.data);
    } finally {
      toast.dismiss();
      setDeleteLoading(false);
    }
  };

  const filteredOwners = owners
    .filter((owner) => {
      if (filter === "verified") return owner.ownerStatus === "verified";
      if (filter === "pending") return owner.ownerStatus === "pending";
      return true;
    })
    .filter((owner) => {
      const val = searchQuery.toLowerCase();
      return (
        owner.fullName.toLowerCase().includes(val) ||
        owner.email.toLowerCase().includes(val)
      );
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
            Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-15px)]">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div className="flex flex-col gap-2 md:pt-5">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
            Owner <span className="text-HG-500">Management</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-inter">
            Review and approve owner verification requests
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-poppins hidden md:flex py-6 shadow-lg">
              <Plus className="w-4 h-4 md:mr-2" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-poppins">
                Create New User
              </DialogTitle>
              <DialogDescription className="font-inter">
                Enter the email and password for the new user account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="font-poppins">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter full name"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  className="font-inter"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="font-poppins">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="font-inter"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="font-poppins">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number (10 digits)"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="font-inter"
                  maxLength={10}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="font-poppins">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="font-inter"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewUserEmail("");
                  setNewUserPassword("");
                  setNewUserFullName("");
                  setNewUserPhone("");
                  setDialogOpen(false);
                }}
                className="font-poppins"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateUser}
                disabled={createUserLoading}
                className="font-poppins"
              >
                {createUserLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start">
        <div className="flex items-center gap-2 md:w-[30%] md:min-w-[300px] justify-between">
          <div className="relative w-full max-w-[300px] md:min-w-[300px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Owner..."
              className="w-full px-10 py-2 font-poppins text-sm md:text-base rounded-lg bg-[#faf4eb] text-black focus:outline-HG-400/40"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
                />
              </svg>
            </div>
            {searchQuery && (
              <div
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
        <div className="justify-end hidden md:flex flex-wrap gap-3 text-gray-600 font-inter">
          <Select
            value={filter}
            onValueChange={(value) =>
              setFilter(value.toLowerCase() as "all" | "verified" | "pending")
            }
          >
            <SelectTrigger className="w-32 md:w-[130px] border-gray-200">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Add User Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="font-poppins md:hidden py-6 shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </DialogTrigger>
      </Dialog>

      {/* List or loader */}
      <div className="w-full pb-14 space-y-6">
        {loading ? (
          <div className="h-[60vh] z-[99999] flex items-center justify-center bg-white bg-opacity-60 backdrop-blur-sm transition-opacity duration-500">
            <svg
              aria-hidden="true"
              className="inline w-14 h-14 md:w-14 md:h-14 animate-spin fill-[#ffe0ae]"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="#D58F24"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        ) : filteredOwners.length === 0 ? (
          <Card className="h-[60vh] w-full flex justify-center items-center shadow-none border-none">
            <CardContent className="p-12 text-center font-inter">
              <User className="w-20 h-20 mx-auto text-HG-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No Owners found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <CardContent className="p-0 pt-5">
            <div className="w-full">
              {/* Desktop version */}
              <div className="hidden md:flex flex-col space-y-4">
                {/* Header Row */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-2 px-2">
                  <p className="text-sm font-medium text-gray-500 w-1/3">
                    Name
                  </p>
                  <div className="flex justify-between w-2/5 pr-10 ">
                    <p className="text-sm font-medium text-gray-500 pl-2">
                      Status
                    </p>
                    <p className="text-sm font-medium text-gray-500">
                      Documents
                    </p>
                  </div>
                </div>
                {/* Data Rows */}
                {filteredOwners.map((owner) => (
                  <div
                    key={owner._id}
                    className="flex justify-between items-center bg-white border-b pr-2  pl-4 py-3 "
                  >
                    {/* Name */}
                    <div className="w-1/3 font-medium text-gray-800">
                      {owner.fullName}
                    </div>
                    {/* Status & Actions */}
                    <div className="flex justify-between items-center w-2/5 pr-10 ">
                      {/* Status */}
                      <div>{getStatusBadge(owner.ownerStatus)}</div>
                      {/* Documents / Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOwner(owner._id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(owner)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Mobile version */}
              <div className="md:hidden space-y-4">
                {filteredOwners.map((owner) => (
                  <div
                    key={owner._id}
                    className="border rounded-xl p-4 space-y-2 bg-white shadow-sm"
                  >
                    <p className="font-medium text-base">{owner.fullName}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span>{getStatusBadge(owner.ownerStatus)}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOwner(owner._id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(owner)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </div>

      {/* Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh] [scrollbar-width:none]">
          <DrawerHeader className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <DrawerTitle className="text-xl font-semibold font-poppins">
                Owner Details
              </DrawerTitle>
              <div className="flex items-center text-sm md:text-lg md:pr-4 justify-between">
                {activeOwner && getStatusBadge(activeOwner?.ownerStatus)}
              </div>
            </div>
            <Button
              className={`${
                activeOwner?.ownerStatus === "verified"
                  ? "bg-red-400 hover:bg-red-600"
                  : "bg-green-400 hover:bg-green-600"
              }`}
              onClick={() => handleApproval(activeOwner?._id)}
            >
              {activeOwner?.ownerStatus === "verified" ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Unverify
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify
                </>
              )}
            </Button>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto  [scrollbar-width:none]">
            {ownerDetailsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-HG-500" />
                <span className="ml-2 text-gray-600">
                  Loading owner details...
                </span>
              </div>
            ) : activeOwner ? (
              <div className="space-y-6">
                {/* Owner Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#faf4eb] rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex gap-2 items-center">
                          <User className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-500">Full Name</p>
                        </div>
                        <p>{activeOwner.fullName}</p>
                      </div>
                      <div>
                        <div className="flex gap-2 items-center">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-500">Phone</p>
                        </div>
                        <p>
                          {activeOwner.ownerDetails?.phone || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <div className="flex gap-2 items-center">
                          <Shield className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-500">
                            Aadhaar Number
                          </p>
                        </div>
                        <p>
                          {activeOwner.ownerDetails?.aadhaarNumber ||
                            "Not provided"}
                        </p>
                      </div>
                      <div>
                        <div className="flex gap-2 items-center">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <p className="text-sm text-gray-500">Email</p>
                        </div>
                        <p>{activeOwner.email}</p>
                      </div>
                    </div>
                  </div>
                  {/* Address Information */}
                  {activeOwner.ownerDetails?.address ? (
                    <div className="bg-[#faf4eb] h-full rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Address Information
                      </h3>
                      <div className="space-y-2">
                        <p className="font-medium">
                          {activeOwner.ownerDetails.address.street}
                        </p>
                        <p className="text-gray-600">
                          {activeOwner.ownerDetails.address.city},{" "}
                          {activeOwner.ownerDetails.address.state} -{" "}
                          {activeOwner.ownerDetails.address.pincode}
                        </p>
                        <p className="text-gray-600">
                          {activeOwner.ownerDetails.address.country}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#faf4eb] h-full rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Address Information
                      </h3>
                      <div className="space-y-2">
                        <p className="text-gray-600">Address not provided</p>
                        <p className="text-sm text-gray-500">
                          User created from admin panel
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Payment Details */}
                {activeOwner.ownerDetails?.paymentDetails && (
                  <div className="bg-[#faf4eb] rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Account Holder</p>
                        <p className="font-medium">
                          {
                            activeOwner.ownerDetails.paymentDetails
                              .accountHolderName
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Bank Name</p>
                        <p className="font-medium">
                          {activeOwner.ownerDetails.paymentDetails.bankName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account Number</p>
                        <p className="font-medium">
                          {
                            activeOwner.ownerDetails.paymentDetails
                              .accountNumber
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">IFSC Code</p>
                        <p className="font-medium">
                          {activeOwner.ownerDetails.paymentDetails.ifscCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">UPI ID</p>
                        <p className="font-medium">
                          {activeOwner.ownerDetails.paymentDetails.upiId}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Documents */}
                {activeOwner.ownerDetails?.documents && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      Uploaded Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Aadhaar Front */}
                      <div className=" rounded-lg  p-4 bg-[#faf4eb]">
                        <div className="flex gap-3 items-center">
                          <FileText className="h-5 w-5 text-blue-500 mt-1" />
                          <p className="font-medium text-gray-800">
                            Aadhaar Card (Front)
                          </p>
                        </div>
                        <div className="overflow-hidden mt-2">
                          <BlurImage
                            width={500}
                            height={500}
                            src={
                              activeOwner?.ownerDetails?.documents
                                ?.aadhaarFrontUrl || "/placeholder.svg"
                            }
                            alt="Aadhaar Front"
                            className=" w-full h-[300px] object-cover overflow-hidden cursor-pointer rounded border"
                            crossOrigin="anonymous"
                            openInNewTab={true}
                          />
                        </div>
                      </div>
                      {/* Aadhaar Back */}
                      <div className=" rounded-lg p-4 bg-[#faf4eb]">
                        <div className="flex gap-3 items-center">
                          <FileText className="h-5 w-5 text-blue-500 mt-1" />
                          <p className="font-medium text-gray-800">
                            Aadhaar Card (Back)
                          </p>
                        </div>
                        <div className="overflow-hidden mt-2">
                          <BlurImage
                            width={500}
                            height={500}
                            src={
                              activeOwner?.ownerDetails?.documents
                                ?.aadhaarBackUrl || "/placeholder.svg"
                            }
                            alt="Aadhaar Front"
                            className=" w-full h-[300px] object-cover overflow-hidden cursor-pointer rounded border"
                            crossOrigin="anonymous"
                            openInNewTab={true}
                          />
                        </div>
                      </div>
                      {/* Additional Documents */}
                      {activeOwner.ownerDetails.documents.additionalDocuments?.map(
                        (doc: any, index: number) => (
                          <div
                            key={index}
                            className=" rounded-lg p-4 bg-[#faf4eb]"
                          >
                            <div className="flex gap-3 items-center">
                              <FileText className="h-5 w-5 text-blue-500 mt-1" />
                              <p className="font-medium text-gray-800">
                                Additional Document {index + 1}
                              </p>
                            </div>
                            <div className="overflow-hidden mt-2">
                              <BlurImage
                                width={500}
                                height={500}
                                src={
                                  activeOwner?.ownerDetails?.documents
                                    ?.aadhaarFrontUrl || "/placeholder.svg"
                                }
                                alt="Aadhaar Front"
                                className=" w-full h-[300px] object-cover overflow-hidden cursor-pointer rounded border"
                                crossOrigin="anonymous"
                                openInNewTab={true}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No owner details available</p>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* First Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-poppins text-red-600">
              Delete Owner
            </DialogTitle>
            <DialogDescription className="font-inter">
              Are you sure you want to delete{" "}
              <strong>{ownerToDelete?.fullName}</strong>? This action will
              permanently remove the owner and all their data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="font-inter"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="font-inter"
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Second Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialogOpen}
        onOpenChange={setDeleteConfirmDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-poppins text-red-600">
              Final Confirmation
            </DialogTitle>
            <DialogDescription className="font-inter">
              <strong>WARNING:</strong> This action cannot be undone. Are you
              absolutely sure you want to delete{" "}
              <strong>{ownerToDelete?.fullName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialogOpen(false)}
              className="font-inter"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOwner}
              disabled={deleteLoading}
              className="font-inter"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete Permanently"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={deleteErrorDialogOpen}
        onOpenChange={setDeleteErrorDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-poppins text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Cannot Delete Owner
            </DialogTitle>
            <DialogDescription className="font-inter">
              {deleteErrorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteErrorDialogOpen(false);
                setOwnerToDelete(null);
              }}
              className="font-inter"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerManagement;
