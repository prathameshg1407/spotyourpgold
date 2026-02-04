// app/routes/dashboard/dashboard.ts
// Dashboard utility functions and data

import { NavItem } from "@/components/sidebar";

export type UserRole = "user" | "owner" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface PGListing {
  id: string;
  name: string;
  ownerId: string;
  location: string;
  rent: number;
  amenities: string[];
  rules: string[];
  images: string[];
  featured: boolean;
  status: "active" | "pending" | "rejected";
  createdAt: string;
  geolocation: {
    lat: number;
    lng: number;
  };
}

export interface Booking {
  id: string;
  userId: string;
  pgId: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "pending" | "cancelled";
  amount: number;
}

export interface Review {
  id: string;
  userId: string;
  pgId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface OwnerRequest {
  id: string;
  userId: string;
  documents: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

export interface Ticket {
  id: string;
  oderId: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed" | "escalated";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: "user" | "owner" | "admin";
  message: string;
  createdAt: string;
}

// Navigation items for different roles
export const getNavigationItems = (role: UserRole): NavItem[] => {
  const baseItems: NavItem[] = [
    { name: "Dashboard", href: "/routes/dashboard", icon: "LayoutDashboard" },
  ];

  switch (role) {
    case "user":
      return [
        ...baseItems,
        {
          name: "My Room",
          href: "/routes/dashboard/user/my-room",
          icon: "Home",
        },
        {
          name: "Visit Requests",
          href: "/routes/dashboard/user/visit-requests",
          icon: "Calendar",
        },
        {
          name: "Payments",
          href: "/routes/dashboard/user/payments",
          icon: "CreditCard",
        },
        {
          name: "Move-in Support",
          href: "/routes/dashboard/user/move-in",
          icon: "Home",
        },
        {
          name: "Support",
          href: "/routes/dashboard/user/support",
          icon: "Headphones",
        },
        {
          name: "My Reviews",
          href: "/routes/dashboard/user/reviews",
          icon: "Star",
        },
        {
          name: "Favorites",
          href: "/routes/dashboard/user/favorites",
          icon: "Heart",
        },
        {
          name: "Profile",
          href: "/routes/dashboard/user/profile",
          icon: "User",
        },
      ];

    case "owner":
      return [
        ...baseItems,
        {
          name: "My Listings",
          href: "/routes/dashboard/owners/listings",
          icon: "Building",
        },
        {
          name: "Add New PG",
          href: "/routes/dashboard/owners/add-pg",
          icon: "Plus",
        },
        {
          name: "Room Management",
          href: "/routes/dashboard/owners/room-management",
          icon: "Bed",
        },
        {
          name: "Room Allocation",
          href: "/routes/dashboard/owners/room-allocation",
          icon: "Bed",
        },
        {
          name: "Tenants",
          href: "/routes/dashboard/owners/tenants",
          icon: "Users",
        },
        {
          name: "Rent Collection",
          href: "/routes/dashboard/owners/rent-collection",
          icon: "Wallet",
        },
        {
          name: "Settlement",
          href: "/routes/dashboard/owners/settlement",
          icon: "TrendingUp",
        },
        {
          name: "Bank Details",
          href: "/routes/dashboard/owners/bank-details",
          icon: "CreditCard",
        },
        {
          name: "Statements",
          href: "/routes/dashboard/owners/statements",
          icon: "FileText",
        },
        {
          name: "Visit Requests",
          href: "/routes/dashboard/owners/visit-requests",
          icon: "Calendar",
        },
        {
          name: "Booking Requests",
          href: "/routes/dashboard/owners/booking-requests",
          icon: "UserCheck",
        },
        {
          name: "Support Tickets",
          href: "/routes/dashboard/owners/tickets",
          icon: "Headphones",
        },
        {
          name: "Subscription",
          href: "/routes/dashboard/owners/subscription",
          icon: "Crown",
        },
        {
          name: "Profile",
          href: "/routes/dashboard/owners/profile",
          icon: "User",
        },
      ];

    case "admin":
      return [
        ...baseItems,
        // ============ USER MANAGEMENT ============
        {
          name: "Students",
          href: "/routes/dashboard/admin/students",
          icon: "Users",
        },
        {
          name: "Owner Requests",
          href: "/routes/dashboard/admin/owner-management",
          icon: "UserCheck",
        },
        {
          name: "KYC Verification",
          href: "/routes/dashboard/admin/kyc",
          icon: "Shield",
        },
        
        // ============ PROPERTY MANAGEMENT ============
        {
          name: "Property Verification",
          href: "/routes/dashboard/admin/property-verification",
          icon: "Building2",
        },
        {
          name: "Top Properties",
          href: "/routes/dashboard/admin/top-properties",
          icon: "Award",
        },
        {
          name: "All Listings",
          href: "/routes/dashboard/admin/listings",
          icon: "Building2",
        },
        
        // ============ BOOKINGS & VISITS ============
        {
          name: "Booking Requests",
          href: "/routes/dashboard/admin/booking-requests",
          icon: "Calendar",
        },
        {
          name: "Visit Requests",
          href: "/routes/dashboard/admin/visit-requests",
          icon: "Calendar",
        },
        
        // ============ PAYMENTS & COMMISSIONS ============
        {
          name: "Cash Payments",
          href: "/routes/dashboard/admin/cash-payments",
          icon: "DollarSign",
        },
        {
          name: "Owner Payouts",
          href: "/routes/dashboard/admin/owner-payouts",
          icon: "Wallet",
        },
        {
          name: "Commissions",
          href: "/routes/dashboard/admin/commissions",
          icon: "TrendingUp",
        },
        {
          name: "Settlement Dashboard",
          href: "/routes/dashboard/admin/settlement",
          icon: "BarChart3",
        },
        {
          name: "Commission Settings",
          href: "/routes/dashboard/admin/commission-settings",
          icon: "Settings",
        },
        
        // ============ MARKETING ============
        {
          name: "Coupon Management",
          href: "/routes/dashboard/admin/coupons",
          icon: "Megaphone",
        },
        
        // ============ SUPPORT ============
        {
          name: "Support Tickets",
          href: "/routes/dashboard/admin/tickets",
          icon: "Headphones",
        },
        {
          name: "Tenants Management",
          href: "/routes/dashboard/admin/tenants",
          icon: "Users",
        },
        
        // ============ OWNER FEATURES (Admin can also use) ============
        {
          name: "My Listings",
          href: "/routes/dashboard/owners/listings",
          icon: "Building",
        },
        {
          name: "Add New PG",
          href: "/routes/dashboard/owners/add-pg",
          icon: "Plus",
        },
        {
          name: "Room Management",
          href: "/routes/dashboard/owners/room-management",
          icon: "Bed",
        },
        {
          name: "Room Allocation",
          href: "/routes/dashboard/owners/room-allocation",
          icon: "Bed",
        },
        {
          name: "Rent Collection",
          href: "/routes/dashboard/owners/rent-collection",
          icon: "Wallet",
        },
        {
          name: "Favorites",
          href: "/routes/dashboard/admin/favorites",
          icon: "Heart",
        },
      ];

    default:
      return baseItems;
  }
};

// Statistics functions
export const getUserStats = () => ({
  totalBookings: 0,
  activeBookings: 0,
  totalReviews: 0,
  favoritesPGs: 0,
});

export const getOwnerStats = () => ({
  totalListings: 0,
  activeListings: 0,
  featuredListings: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  totalReviews: 0,
  averageRating: 0,
  pendingVisitRequests: 0,
  totalWishlist: 0,
  openTickets: 0,
  pendingSettlements: 0,
  totalCommissionDue: 0,
  totalTenants: 0,
  activeTenants: 0,
  // New commission-related stats
  pendingPayoutFromAdmin: 0,
  pendingCommissionToAdmin: 0,
  totalPayoutReceived: 0,
  totalCommissionPaid: 0,
});

export const getAdminStats = () => ({
  totalUsers: 0,
  totalOwners: 0,
  totalListings: 0,
  pendingRequests: 0,
  monthlyRevenue: 0,
  featuredListings: 0,
  openTickets: 0,
  escalatedTickets: 0,
  pendingCommissions: 0,
  totalCommissionAmount: 0,
  settledThisMonth: 0,
  pendingKYC: 0,
  approvedKYC: 0,
  rejectedKYC: 0,
  totalTenants: 0,
  // New commission-related stats
  totalRevenueCollected: 0,
  pendingRevenueToCollect: 0,
  pendingOwnerPayouts: 0,
  totalOwnerPayoutsPaid: 0,
  firstMonthAdminCommission: 0,
  monthlyRentCommission: 0,
});

// Commission types for reference
export type CommissionType = 
  | "first_month_admin"   // 10% admin receives from first payment
  | "first_month_owner"   // 90% admin pays to owner
  | "monthly_rent";       // 10% owner owes to admin

// Commission status
export type CommissionStatus = 
  | "pending"
  | "completed"
  | "overdue"
  | "waived";

// Payout status for first month owner payouts
export type PayoutStatus = 
  | "pending"
  | "processing"
  | "completed";

// Helper function to get commission type label
export const getCommissionTypeLabel = (type: CommissionType): string => {
  switch (type) {
    case "first_month_admin":
      return "First Month (Admin 10%)";
    case "first_month_owner":
      return "First Month (Owner 90%)";
    case "monthly_rent":
      return "Monthly Rent (10%)";
    default:
      return type;
  }
};

// Helper function to get commission type description
export const getCommissionTypeDescription = (type: CommissionType): string => {
  switch (type) {
    case "first_month_admin":
      return "Admin receives 10% from first payment";
    case "first_month_owner":
      return "Admin pays 90% to owner from first payment";
    case "monthly_rent":
      return "Owner owes 10% to admin from monthly rent";
    default:
      return "";
  }
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return `₹${Math.abs(amount).toLocaleString("en-IN")}`;
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Helper function to format date with time
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Dashboard card colors
export const cardColors = {
  green: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
  yellow: "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200",
  red: "bg-gradient-to-br from-red-50 to-red-100 border-red-200",
  blue: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
  orange: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200",
  purple: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
  primary: "bg-gradient-to-br from-primary/10 to-primary/20 border-primary/30",
};

// Status badge colors
export const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  waived: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  processing: "bg-blue-100 text-blue-800",
};

// Commission rate default
export const DEFAULT_COMMISSION_RATE = 0.10; // 10%

// Due date defaults (in days)
export const DUE_DATE_DEFAULTS = {
  firstMonthOwnerPayout: 7,  // Admin should pay owner within 7 days
  monthlyRentCommission: 7,  // Owner should pay admin within 7 days of rent collection
  rentDueDay: 5,             // Rent due on 5th of each month
  lateFeeDay: 10,            // Late fee added after 10th
};

// Late fee percentage
export const LATE_FEE_PERCENTAGE = 0.05; // 5%