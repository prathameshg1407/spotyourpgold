// app/routes/dashboard/admin/top-properties/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Star,
  Building,
  MapPin,
  DollarSign,
  Users,
  Percent,
  Clock,
  Award,
  BarChart3,
  Calendar,
} from "lucide-react";
import { BlurImage } from "@/components/BlurImage";

interface TopProperty {
  listing: {
    _id: string;
    pgName: string;
    type: string;
    location: { area: string; city: string };
    primaryImage: string;
    isFeatured: boolean;
    ownerId: { fullName: string; email: string };
  };
  metrics: {
    bookingCount?: number;
    totalRevenue?: number;
    avgBookingValue?: number;
    occupancyRate?: number;
    totalBeds?: number;
    occupiedBeds?: number;
    availableBeds?: number;
  };
}

export default function TopPropertiesPage() {
  const [topProperties, setTopProperties] = useState<TopProperty[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [recentlyApproved, setRecentlyApproved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState("bookings");
  const [period, setPeriod] = useState("month");

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/admin/top-properties?metric=${metric}&period=${period}`
      );
      if (response.data.success) {
        setTopProperties(response.data.data.topProperties);
        setFeaturedProperties(response.data.data.featuredProperties);
        setRecentlyApproved(response.data.data.recentlyApproved);
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [metric, period]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getMetricLabel = () => {
    switch (metric) {
      case "bookings":
        return "Bookings";
      case "occupancy":
        return "Occupancy Rate";
      case "revenue":
        return "Revenue";
      default:
        return "Performance";
    }
  };

  const getMetricIcon = () => {
    switch (metric) {
      case "bookings":
        return <Users className="h-5 w-5" />;
      case "occupancy":
        return <Percent className="h-5 w-5" />;
      case "revenue":
        return <DollarSign className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading top properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-poppins">
          Top <span className="text-HG-500">Properties</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Track high-performing and featured properties
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <BarChart3 className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select Metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bookings">By Bookings</SelectItem>
            <SelectItem value="occupancy">By Occupancy</SelectItem>
            <SelectItem value="revenue">By Revenue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Featured Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Featured Properties
          </CardTitle>
          <CardDescription>
            Currently featured properties on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuredProperties.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No featured properties</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {featuredProperties.map((property: any) => (
                <div
                  key={property._id}
                  className="relative rounded-lg overflow-hidden bg-gray-100 aspect-square"
                >
                  <BlurImage
                    src={property.primaryImage}
                    alt={property.pgName}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-sm font-medium truncate">
                      {property.pgName}
                    </p>
                    <p className="text-white/80 text-xs truncate">
                      {property.location?.city}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Properties by Selected Metric */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-HG-500" />
            Top Properties by {getMetricLabel()}
          </CardTitle>
          <CardDescription>
            Ranked by {metric} in the last {period}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topProperties.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No data available for the selected period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Location</TableHead>
                    {metric === "bookings" && (
                      <>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </>
                    )}
                    {metric === "occupancy" && (
                      <>
                        <TableHead className="text-right">Occupancy</TableHead>
                        <TableHead className="text-right">Beds</TableHead>
                      </>
                    )}
                    {metric === "revenue" && (
                      <>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Avg Value</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProperties.map((item, index) => (
                    <TableRow key={item.listing?._id || index}>
                      <TableCell>
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : index === 1
                              ? "bg-gray-100 text-gray-700"
                              : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <BlurImage
                              src={item.listing?.primaryImage}
                              alt={item.listing?.pgName}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{item.listing?.pgName}</p>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {item.listing?.type}
                              </Badge>
                              {item.listing?.isFeatured && (
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{item.listing?.ownerId?.fullName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.listing?.location?.city}
                        </p>
                      </TableCell>
                      {metric === "bookings" && (
                        <>
                          <TableCell className="text-right font-medium">
                            {item.metrics.bookingCount}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(item.metrics.totalRevenue || 0)}
                          </TableCell>
                        </>
                      )}
                      {metric === "occupancy" && (
                        <>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{
                                    width: `${item.metrics.occupancyRate}%`,
                                  }}
                                />
                              </div>
                              <span className="font-medium">
                                {item.metrics.occupancyRate}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600">
                              {item.metrics.occupiedBeds}
                            </span>
                            /{item.metrics.totalBeds}
                          </TableCell>
                        </>
                      )}
                      {metric === "revenue" && (
                        <>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatCurrency(item.metrics.totalRevenue || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.metrics.avgBookingValue || 0)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Approved */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Recently Approved
          </CardTitle>
          <CardDescription>Latest properties added to the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {recentlyApproved.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recently approved properties</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentlyApproved.map((property: any) => (
                <div
                  key={property._id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <BlurImage
                      src={property.primaryImage}
                      alt={property.pgName}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{property.pgName}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.location?.area}, {property.location?.city}
                    </p>
                    <p className="text-xs text-gray-400">
                      Added {formatDate(property.createdAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize flex-shrink-0">
                    {property.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}