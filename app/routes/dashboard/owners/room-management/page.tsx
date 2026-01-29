"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useLoadingStore } from "@/store/loading"
import { Building2, Search, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface RoomType {
  _id: string
  type: "single" | "double" | "triple" | "dormitory"
  numberOfRooms: number
  availableRooms: number
  isAC?: boolean
  monthlyRent?: number
  capacityPerRoom?: number
}

interface PGWithRooms {
  _id: string
  pgName: string
  location?: {
    area?: string
    city?: string
  }
  roomTypes: RoomType[]
  isActive?: boolean
  isApproved?: boolean
}

export default function RoomManagementPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [pgFilter, setPgFilter] = useState("all")
  const [pgsWithRooms, setPgsWithRooms] = useState<PGWithRooms[]>([])
  const [updatingRooms, setUpdatingRooms] = useState<{ [key: string]: { [key: string]: number } }>({})
  const { containerLoading, setContainerLoading } = useLoadingStore()

  useEffect(() => {
    fetchPGsWithRooms()
    
    return () => {
      setContainerLoading("ownerListings", false)
    }
  }, [setContainerLoading])

  const fetchPGsWithRooms = async () => {
    setContainerLoading("ownerListings", true)
    try {
      const res = await axios.get("/api/owner/getOwnerPgRooms")

      if (res?.data?.success) {
        const pgsData = res.data.data || []
        setPgsWithRooms(pgsData)
        
        // Initialize updating rooms state
        const initialState: { [key: string]: { [key: string]: number } } = {}
        pgsData.forEach((pg: PGWithRooms) => {
          initialState[pg._id] = {}
          if (pg.roomTypes && pg.roomTypes.length > 0) {
            pg.roomTypes.forEach((room) => {
              initialState[pg._id][room._id] = room.availableRooms || 0
            })
          }
        })
        setUpdatingRooms(initialState)
      } else {
        toast.error("Failed to fetch room data")
      }
    } catch (error: any) {
      console.error("Error fetching PGs:", error)
      toast.error(error.response?.data?.message || "Something went wrong")
    } finally {
      setContainerLoading("ownerListings", false)
    }
  }

  const handleAvailabilityChange = (pgId: string, roomId: string, value: string) => {
    const numValue = Number.parseInt(value) || 0
    setUpdatingRooms((prev) => ({
      ...prev,
      [pgId]: {
        ...prev[pgId],
        [roomId]: numValue,
      },
    }))
  }

  const handleUpdateAvailability = async (pgId: string, roomId: string) => {
    const newAvailability = updatingRooms[pgId]?.[roomId]
    if (newAvailability === undefined) return

    const loadingToast = toast.loading("Updating room availability...", {
      closeButton: true,
    })

    try {
      const res = await axios.put(`/api/owner/updateRoomAvailability`, {
        pgId,
        roomTypeId: roomId,
        availableRooms: newAvailability,
      })

      if (res?.data?.success) {
        toast.dismiss(loadingToast)
        toast.success("Room availability updated successfully!", {
          closeButton: true,
          duration: 2000,
        })

        // Update local state
        setPgsWithRooms((prev) =>
          prev.map((pg) =>
            pg._id === pgId
              ? {
                  ...pg,
                  roomTypes: pg.roomTypes.map((room) =>
                    room._id === roomId ? { ...room, availableRooms: newAvailability } : room,
                  ),
                }
              : pg,
          ),
        )
      } else {
        toast.dismiss(loadingToast)
        toast.error(res?.data?.message || "Failed to update availability", {
          closeButton: true,
          duration: 2000,
        })
      }
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toast.error(error.response?.data?.message || "Failed to update room availability. Try again.", {
        closeButton: true,
        duration: 2000,
      })
    }
  }

  const getRoomTypeDisplayName = (type: string) => {
    switch (type?.toLowerCase()) {
      case "single":
        return "Single Room"
      case "double":
        return "2-Bed Sharing"
      case "triple":
        return "3-Bed Sharing"
      case "dormitory":
        return "Dormitory"
      default:
        return type ? type.charAt(0).toUpperCase() + type.slice(1) : "Unknown"
    }
  }

  const filteredPGs = pgsWithRooms.filter((pg) => {
    const search = searchQuery.toLowerCase()
    const matchesSearch = pg.pgName.toLowerCase().includes(search) ||
                         pg.location?.area?.toLowerCase().includes(search) ||
                         pg.location?.city?.toLowerCase().includes(search)
    
    if (pgFilter === "all") return matchesSearch
    if (pgFilter === "active") return matchesSearch && pg.isActive
    if (pgFilter === "inactive") return matchesSearch && !pg.isActive
    if (pgFilter === "approved") return matchesSearch && pg.isApproved
    if (pgFilter === "unapproved") return matchesSearch && !pg.isApproved
    
    return matchesSearch
  })

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-15px)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div className="flex flex-col gap-2 md:pt-5">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
            Room <span className="text-HG-500">Management</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-inter">
            Manage room availability across all your properties
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-start">
        <div className="flex items-center gap-2 md:w-[30%] md:min-w-[300px] justify-between">
          {/* Search Box */}
          <div className="relative w-full max-w-[300px] md:min-w-[300px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PGs..."
              className="w-full px-10 py-2 font-poppins text-sm md:text-base rounded-lg bg-[#faf4eb] text-black focus:outline-HG-400/40"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            {searchQuery && (
              <div
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex justify-end flex-wrap gap-3 text-gray-600 font-inter">
          <Select value={pgFilter} onValueChange={setPgFilter}>
            <SelectTrigger className="w-32 md:w-[130px] border-gray-200">
              <SelectValue placeholder="PG Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All PGs</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="unapproved">Unapproved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Room Management Cards */}
      <div className="w-full pb-14 space-y-6">
        {containerLoading.ownerListings ? (
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
        ) : filteredPGs.length === 0 ? (
          <Card className="h-[60vh] w-full flex justify-center items-center shadow-none border-none">
            <CardContent className="p-12 text-center font-inter">
              <Building2 className="w-20 h-20 mx-auto text-HG-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchQuery || pgFilter !== "all" ? "No PGs found" : "No properties yet"}
              </h3>
              <p className="text-gray-500">
                {searchQuery || pgFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first PG listing to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredPGs.map((pg) => (
              <Card key={pg._id} className="shadow-lg border border-gray-200 bg-white">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold font-poppins text-gray-900">
                        {pg.pgName}
                      </CardTitle>
                      {pg.location && (
                        <p className="text-sm text-gray-500 font-inter mt-1">
                          {pg.location.area}, {pg.location.city}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {pg.isActive !== undefined && (
                        <Badge
                          variant="outline"
                          className={`text-xs flex items-center gap-1 ${
                            pg.isActive
                              ? "text-green-600 bg-green-50 border-green-200"
                              : "text-red-600 bg-red-50 border-red-200"
                          }`}
                        >
                          {pg.isActive ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {pg.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                      {pg.isApproved !== undefined && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            pg.isApproved
                              ? "text-blue-600 bg-blue-50 border-blue-200"
                              : "text-yellow-600 bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          {pg.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!pg.roomTypes || pg.roomTypes.length === 0 ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                      <p className="text-gray-600 font-inter">
                        No room types configured for this property
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Please add room types in the listing settings
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {pg.roomTypes.map((room, index) => (
                        <div
                          key={room._id}
                          className={`flex items-center justify-between px-6 py-4 ${
                            index !== pg.roomTypes.length - 1 ? "border-b border-gray-100" : ""
                          } hover:bg-gray-50 transition-colors`}
                        >
                          <div className="flex-1">
                            <h4 className="text-base font-medium text-gray-900 font-inter">
                              {getRoomTypeDisplayName(room.type)}
                            </h4>
                            {room.monthlyRent && (
                              <p className="text-xs text-gray-500 mt-1">
                                ₹{room.monthlyRent.toLocaleString()}/month
                                {room.isAC && " • AC"}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-8">
                            <div className="text-center">
                              <p className="text-xs text-gray-500 font-inter mb-1">Total Beds</p>
                              <p className="text-2xl font-bold text-gray-900 font-poppins">
                                {room.numberOfRooms || 0}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-xs text-gray-500 font-inter mb-1">Available</p>
                              <Input
                                type="number"
                                min="0"
                                max={room.numberOfRooms || 0}
                                value={updatingRooms[pg._id]?.[room._id] ?? room.availableRooms ?? 0}
                                onChange={(e) => handleAvailabilityChange(pg._id, room._id, e.target.value)}
                                className="w-24 h-10 text-center text-xl font-bold font-poppins border-gray-300 focus:border-HG-400"
                              />
                            </div>

                            <Button
                              onClick={() => handleUpdateAvailability(pg._id, room._id)}
                              className="bg-HG-400 hover:bg-HG-500 text-white font-poppins px-8 py-2 rounded-lg transition-colors"
                              disabled={
                                updatingRooms[pg._id]?.[room._id] === room.availableRooms ||
                                (updatingRooms[pg._id]?.[room._id] ?? 0) > (room.numberOfRooms || 0) ||
                                (updatingRooms[pg._id]?.[room._id] ?? 0) < 0
                              }
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}