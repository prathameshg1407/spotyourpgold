"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building,
  Calendar,
  Star,
  Heart,
  BarChart3,
  Crown,
  UserCheck,
  Building2,
  TrendingUp,
  CheckCircle,
  XCircle,
  DollarSign,
  Home,
  Clock,
  Award,
  Pin,
} from "lucide-react";
import {
  mockUser,
  getUserStats,
  getOwnerStats,
  getAdminStats,
  mockPGListings,
  mockBookings,
  mockReviews,
  mockOwnerRequests,
  UserRole,
} from "@/app/routes/dashboard/dashboard";
import Link from "next/link";
import { useUserStore } from "@/store/userStore";
import { FormInput } from "../auth/form-input";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

export default function DashboardPage() {
  // const user =
  const { user } = useUserStore();
  const userRole = user?.role as UserRole;

  // Get real-time metrics from API
  const { metrics, loading, error } = useDashboardMetrics(
    userRole || "",
    user?.id
  );

  // Fallback to mock data if API fails
  const ownerStats =
    metrics && userRole === "owner" ? (metrics as any) : getOwnerStats();
  const adminStats =
    metrics && userRole === "admin" ? (metrics as any) : getAdminStats();

  const [adminAd, setAdminAd] = useState("");

  const handleAdSubmit = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    const res = await axios.post("/api/admin/ad", {
      title: adminAd,
    });
    if (res?.data?.success) {
      toast.success("Ad submitted successfully");
      setAdminAd("");
    } else {
      toast.error("Failed to submit ad");
    }
  };

  // const renderUserDashboard = () => (
  //   <div className="space-y-6">
  //     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  //       <Card className="border-golden/20">
  //         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
  //           <Calendar className="h-4 w-4 text-golden" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className="text-2xl font-bold text-golden">{userStats.totalBookings}</div>
  //           <p className="text-xs text-muted-foreground">All time bookings</p>
  //         </CardContent>
  //       </Card>

  //       <Card className="border-golden/20">
  //         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
  //           <Home className="h-4 w-4 text-golden" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className="text-2xl font-bold text-golden">{userStats.activeBookings}</div>
  //           <p className="text-xs text-muted-foreground">Currently staying</p>
  //         </CardContent>
  //       </Card>

  //       <Card className="border-golden/20">
  //         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <CardTitle className="text-sm font-medium">Reviews Given</CardTitle>
  //           <Star className="h-4 w-4 text-golden" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className="text-2xl font-bold text-golden">{userStats.totalReviews}</div>
  //           <p className="text-xs text-muted-foreground">Your feedback</p>
  //         </CardContent>
  //       </Card>

  //       <Card className="border-golden/20">
  //         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <CardTitle className="text-sm font-medium">Favorite PGs</CardTitle>
  //           <Heart className="h-4 w-4 text-golden" />
  //         </CardHeader>
  //         <CardContent>
  //           <div className="text-2xl font-bold text-golden">{userStats.favoritesPGs}</div>
  //           <p className="text-xs text-muted-foreground">Saved for later</p>
  //         </CardContent>
  //       </Card>
  //     </div>

  //     <div className="grid gap-6 md:grid-cols-2">
  //       <Card>
  //         <CardHeader>
  //           <CardTitle className="text-golden">Recent Bookings</CardTitle>
  //           <CardDescription>Your latest PG bookings</CardDescription>
  //         </CardHeader>
  //         <CardContent>
  //           <div className="space-y-4">
  //             {mockBookings.slice(0, 3).map((booking) => {
  //               const pg = mockPGListings.find((p) => p.id === booking.pgId)
  //               return (
  //                 <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
  //                   <div>
  //                     <p className="font-medium">{pg?.name}</p>
  //                     <p className="text-sm text-muted-foreground">{pg?.location}</p>
  //                     <p className="text-xs text-muted-foreground">
  //                       {booking.checkIn} to {booking.checkOut}
  //                     </p>
  //                   </div>
  //                   <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>{booking.status}</Badge>
  //                 </div>
  //               )
  //             })}
  //           </div>
  //           <Button asChild className="w-full mt-4 bg-golden-gradient hover:opacity-90">
  //             <Link href="/bookings">View All Bookings</Link>
  //           </Button>
  //         </CardContent>
  //       </Card>

  //       <Card>
  //         <CardHeader>
  //           <CardTitle className="text-golden">Your Reviews</CardTitle>
  //           <CardDescription>Recent reviews you've written</CardDescription>
  //         </CardHeader>
  //         <CardContent>
  //           <div className="space-y-4">
  //             {mockReviews.slice(0, 3).map((review) => {
  //               const pg = mockPGListings.find((p) => p.id === review.pgId)
  //               return (
  //                 <div key={review.id} className="p-3 border rounded-lg">
  //                   <div className="flex items-center justify-between mb-2">
  //                     <p className="font-medium">{pg?.name}</p>
  //                     <div className="flex items-center">
  //                       {[...Array(5)].map((_, i) => (
  //                         <Star
  //                           key={i}
  //                           className={`h-3 w-3 ${i < review.rating ? "fill-golden text-golden" : "text-gray-300"}`}
  //                         />
  //                       ))}
  //                     </div>
  //                   </div>
  //                   <p className="text-sm text-muted-foreground">{review.comment}</p>
  //                 </div>
  //               )
  //             })}
  //           </div>
  //           <Button
  //             asChild
  //             variant="outline"
  //             className="w-full mt-4 border-golden text-golden hover:bg-golden/10 bg-transparent"
  //           >
  //             <Link href="/reviews">View All Reviews</Link>
  //           </Button>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   </div>
  // )

  const renderOwnerDashboard = () => (
    <div className="space-y-6 pt-4 pb-14">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
          <span className="ml-2 text-muted-foreground">Loading metrics...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading metrics: {error}</p>
        </div>
      )}
      <div className="grid gap-4 md:gap-8 md:grid-cols-3 ">
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Listings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {ownerStats.totalListings}
              </h2>
              <p className="text-xs text-muted-foreground  font-inter">
                Active PG listings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Building className="md:h-8 md:w-8 " />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Monthly Revenue
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                ₹{ownerStats.monthlyRevenue.toLocaleString()}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                This month&apos;s earnings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <DollarSign className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Revenue
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                ₹{ownerStats.totalRevenue?.toLocaleString() || 0}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                All time earnings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <TrendingUp className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Visit Requests
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {ownerStats.pendingVisitRequests}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Pending requests
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Calendar className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Average Rating
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {ownerStats.averageRating}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                From {ownerStats.totalReviews} reviews
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Star className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Wishlist Count
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {ownerStats.totalWishlist}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                People saved your listings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Heart className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>
      </div>

      {/* <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-golden">Your PG Listings</CardTitle>
            <CardDescription>Manage your properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPGListings.slice(0, 3).map((pg) => (
                <div key={pg.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{pg.name}</p>
                    <p className="text-sm text-muted-foreground">{pg.location}</p>
                    <p className="text-sm font-medium text-golden">₹{pg.rent}/month</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pg.featured && <Badge className="bg-golden-gradient">Featured</Badge>}
                    <Badge variant={pg.status === "active" ? "default" : "secondary"}>{pg.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button asChild className="flex-1 bg-golden-gradient hover:opacity-90">
                <Link href="/listings">Manage Listings</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 border-golden text-golden hover:bg-golden/10 bg-transparent"
              >
                <Link href="/add-pg">Add New PG</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-golden">Recent Activity</CardTitle>
            <CardDescription>Latest updates on your properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">New booking confirmed</p>
                  <p className="text-xs text-muted-foreground">Cozy Downtown PG - 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Star className="h-4 w-4 text-golden" />
                <div>
                  <p className="text-sm font-medium">New review received</p>
                  <p className="text-xs text-muted-foreground">4.5 stars - Student Friendly PG</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <DollarSign className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Payment received</p>
                  <p className="text-xs text-muted-foreground">₹15,000 - Monthly rent</p>
                </div>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full mt-4 border-golden text-golden hover:bg-golden/10 bg-transparent"
            >
              <Link href="/analytics">View Detailed Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6 pt-4 pb-14">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500"></div>
          <span className="ml-2 text-muted-foreground">Loading metrics...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading metrics: {error}</p>
        </div>
      )}
      {/* Stat Cards */}
      <div className="grid gap-4 md:gap-8 md:grid-cols-3">
        {/* Total Users */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Users
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.totalUsers}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Registered users
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Users className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        {/* Total Owners */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Owners
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.totalOwners}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Verified owners
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <UserCheck className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        {/* Total Listings */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Total Listings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.totalListings}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Active PG listings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Building2 className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        {/* Pending Requests */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Pending Requests
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.pendingRequests}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Awaiting approval
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Clock className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        {/* Monthly Revenue */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Monthly Revenue
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                ₹{adminStats.monthlyRevenue.toLocaleString()}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Platform earnings
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <TrendingUp className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>

        {/* Featured Listings */}
        <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-black font-inter">
                Featured Listings
              </p>
              <h2 className="text-3xl font-poppins font-semibold text-HG-500">
                {adminStats.featuredListings}
              </h2>
              <p className="text-xs text-muted-foreground font-inter">
                Premium placements
              </p>
            </div>
            <div className="p-2 rounded-full bg-golden/10 text-HG-500">
              <Award className="md:h-8 md:w-8" />
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Owner Requests + Recent Activity */}
      {/* <div className="grid gap-6 md:grid-cols-2"> */}
      {/* Pending Owner Requests */}
      <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white w-full">
        <CardHeader>
          <CardTitle className="text-HG-500 font-semibold">
            Ad Management
          </CardTitle>
          <CardDescription>
            Add a promotional ad to display on the platform
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleAdSubmit}>
            <FormInput
              id="ad"
              label="Enter Ad"
              type="textarea"
              value={adminAd}
              onChange={(value) => setAdminAd(value)}
              placeholder="Enter the ad to show on home page"
              hasError={false}
              icon={Pin}
            />

            <div className=" w-full flex justify-end">
              <Button type="submit" className=" hover:opacity-90 px-8">
                Submit Ad
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {/* <Card className="border border-HG-400/20 shadow-sm md:shadow-lg rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-HG-500">Recent Activity</CardTitle>
            <CardDescription>Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <UserCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">New owner verified</p>
                  <p className="text-xs text-muted-foreground">
                    John Smith - 1 hour ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Building className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">New PG listing added</p>
                  <p className="text-xs text-muted-foreground">
                    Premium Hostel - Mumbai
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Star className="h-5 w-5 text-HG-500" />
                <div>
                  <p className="text-sm font-medium">
                    Featured request approved
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cozy Downtown PG
                  </p>
                </div>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full mt-4 border-HG-500 text-HG-500 hover:bg-HG-100 bg-transparent"
            >
              <Link href="/admin-analytics">View System Analytics</Link>
            </Button>
          </CardContent>
        </Card> */}
    </div>
    // </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:pt-5">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
          Welcome back, <br className="md:hidden block" />{" "}
          <span className="text-HG-500">{user?.fullName}</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-lg font-inter">
          {userRole === "user" && "Here's your PG booking overview"}
          {userRole === "owner" &&
            "Manage your PG listings and track performance"}
          {userRole === "admin" && "Monitor platform activity and manage users"}
        </p>
      </div>

      {/* {userRole === "user" && renderUserDashboard()} */}
      {userRole === "owner" && renderOwnerDashboard()}
      {userRole === "admin" && renderAdminDashboard()}
    </div>
  );
}
