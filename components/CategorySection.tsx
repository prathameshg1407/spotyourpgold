"use client";
import { useRouter } from "next/navigation";
import { Home, Building2, DoorOpen, Building, Store } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const categories: Category[] = [
  {
    id: "hostels",
    name: "Hostels",
    description: "",
    icon: Home,
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  {
    id: "pgs",
    name: "PG",
    description: "",
    icon: Building2,
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
  {
    id: "rooms",
    name: "Rooms",
    description: "",
    icon: DoorOpen,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  {
    id: "flats",
    name: "Flats",
    description: "",
    icon: Building,
    color: "bg-gradient-to-br from-orange-500 to-orange-600",
  },
  {
    id: "commercial",
    name: "Commercial Properties",
    description: "",
    icon: Store,
    color: "bg-gradient-to-br from-red-500 to-red-600",
  },
];

const CategorySection = () => {
  const router = useRouter();

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/routes/all-listings?category=${categoryId}`);
  };

  return (
    <section className="py-4 md:py-10 lg:py-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4 md:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 md:mb-4 font-poppins">
            Explore Property Categories
          </h2>
        </div>

        {/* Mobile: Horizontal scrollable row */}
        <div className="md:hidden">
          <div className="flex py-2 overflow-x-auto scrollbar-hide px-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="cursor-pointer transition-all duration-300 hover:scale-105 group flex-shrink-0 min-w-[80px] text-center"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-HG-400 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <category.icon className="w-6 h-6 text-HG-400" />
                </div>
                <h3 className="text-xs font-semibold text-gray-800 group-hover:text-HG-500 transition-colors duration-300 font-poppins leading-tight max-w-[80px]">
                  {category.name}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="cursor-pointer transition-all duration-300 hover:scale-105 group text-center"
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-HG-400 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <category.icon className="w-7 h-7 text-HG-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 group-hover:text-HG-500 transition-colors duration-300 font-poppins">
                {category.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
