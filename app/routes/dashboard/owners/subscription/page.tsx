"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { useLoadingStore } from "@/store/loading"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"

interface CurrentPlan {
  _id: string
  planType: "subscription" | "brokerage" | "partnership"
  planName: string
  price: number
  description: string
  nextRenewal: string
}

export default function MonetizationPlanPage() {
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null)
  const { containerLoading, setContainerLoading } = useLoadingStore()

  useEffect(() => {
    setContainerLoading("ownerListings", true)
    const fetchCurrentPlan = async () => {
      try {
        const res = await axios.get("/api/monetization/current-plan")
        if (res?.data?.success) {
          setCurrentPlan(res.data.data)
        } else {
          toast.error("Failed to fetch current plan")
        }
      } catch (error) {
        toast.error("Something went wrong")
      } finally {
        setContainerLoading("ownerListings", false)
      }
    }

    fetchCurrentPlan()

    return () => {
      setContainerLoading("ownerListings", false)
    }
  }, [setContainerLoading])

  const handleContactUs = (planType: string) => {
    // Handle contact us functionality
    toast.success(`We'll contact you about switching to ${planType}!`)
  }

  const handleLearnMore = (planType: string) => {
    // Handle learn more functionality
    toast.info(`Learn more about ${planType} clicked`)
  }

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-15px)] ">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div className="flex flex-col gap-2 md:pt-5">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-poppins">
            Subscription <span className="text-HG-500">Plans</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-inter">
            Choose the perfect plan to grow your PG business
          </p>
        </div>
      </div>

      {containerLoading.ownerListings ? (
        <div className="h-[60vh] flex items-center justify-center bg-white bg-opacity-60 backdrop-blur-sm transition-opacity duration-500">
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
      ) : (
        <div className="px-6 pb-8">
          <div className="grid gap-8 lg:grid-cols-2 max-w-7xl">
            {/* Your Current Plan */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700 font-inter">Your Current Plan</h2>

              <Card className="border-2 border-orange-300 bg-orange-50">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-orange-900 font-poppins">
                      {currentPlan?.planName || "Subscription Model"}
                    </h3>

                    <p className="text-gray-600 font-inter leading-relaxed">
                      {currentPlan?.description ||
                        "You are on a fixed monthly subscription. All leads are forwarded to you directly."}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900 font-poppins">
                          ₹{currentPlan?.price?.toLocaleString() || "1,999"}
                        </span>
                        <span className="text-gray-600 font-inter">/ month</span>
                      </div>

                      <p className="text-sm text-gray-500 font-inter">
                        Next renewal on:{" "}
                        {currentPlan?.nextRenewal
                          ? new Date(currentPlan.nextRenewal).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "July 1, 2025"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Available Plans */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700 font-inter">Available Plans</h2>

              <div className="space-y-6">
                {/* Brokerage Model */}
                <Card className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900 font-poppins">Brokerage Model</h3>

                      <p className="text-gray-600 font-inter leading-relaxed">
                        Pay only when you get a confirmed booking through us. We charge a small percentage of the first
                        month&apos;s rent.
                      </p>

                      <button
                        onClick={() => handleContactUs("Brokerage Model")}
                        className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium font-inter transition-colors"
                      >
                        Contact us to switch
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Partnership */}
                <Card className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900 font-poppins">Partnership</h3>

                      <p className="text-gray-600 font-inter leading-relaxed">
                        Feature your PG prominently on our homepage and search results for maximum visibility.
                      </p>

                      <button
                        onClick={() => handleLearnMore("Partnership")}
                        className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium font-inter transition-colors"
                      >
                        Learn More
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
