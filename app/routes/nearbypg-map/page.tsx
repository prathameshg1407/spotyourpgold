// "use client";

// import dynamic from "next/dynamic";
// import { useEffect, useState } from "react";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import { ArrowLeft } from "lucide-react";
// import { Button } from "@/components/ui/button";

// const MapContainer = dynamic(
//   () => import("react-leaflet").then((mod) => mod.MapContainer),
//   { ssr: false }
// );
// const TileLayer = dynamic(
//   () => import("react-leaflet").then((mod) => mod.TileLayer),
//   { ssr: false }
// );
// const Marker = dynamic(
//   () => import("react-leaflet").then((mod) => mod.Marker),
//   { ssr: false }
// );
// const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
//   ssr: false,
// });
// const Tooltip = dynamic(
//   () => import("react-leaflet").then((mod) => mod.Tooltip),
//   { ssr: false }
// );

// // Fix marker icon issue with Leaflet in Next.js
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconUrl: "/marker-icon.png",
//   iconRetinaUrl: "/marker-icon-2x.png",
//   shadowUrl: "/marker-shadow.png",
// });

// type PGData = {
//   id: string;
//   pgName: string;
//   monthlyRent: number;
//   genderPreference: string;
//   lat: number;
//   lng: number;
// };

// export default function NearbyPGMap() {
//   const [pgs, setPgs] = useState<PGData[]>([]);

//   useEffect(() => {
//     // Simulated dummy data
//     const dummyPGs: PGData[] = [
//       {
//         id: "1",
//         pgName: "Sunrise PG",
//         monthlyRent: 5000,
//         genderPreference: "Male",
//         lat: 28.6139,
//         lng: 77.209,
//       },
//       {
//         id: "2",
//         pgName: "Bluebell Residency",
//         monthlyRent: 6500,
//         genderPreference: "Female",
//         lat: 28.6189,
//         lng: 77.215,
//       },
//       {
//         id: "3",
//         pgName: "GreenNest PG",
//         monthlyRent: 5500,
//         genderPreference: "Unisex",
//         lat: 28.6109,
//         lng: 77.204,
//       },
//     ];

//     setPgs(dummyPGs);
//   }, []);

//   return (
//     <div className="h-screen w-full  ">
//       <Button
//         onClick={() => window.history.back()}
//         className="flex absolute top-5 right-14 z-[999999999] items-center px-5 py-5 "
//       >
//         <ArrowLeft className="w-7 h-7" />
//         <span className="sm:inline text-xs md:text-lg font-poppins">HOME</span>
//       </Button>

//       <MapContainer
//         center={[28.6139, 77.209]}
//         zoom={13}
//         style={{ height: "100%", width: "100%" }}
//       >
//         <TileLayer
//           attribution="&copy; OpenStreetMap contributors"
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//         {pgs.map((pg) => (
//           <Marker key={pg.id} position={[pg.lat, pg.lng]}>
//             <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
//               {pg.pgName}
//             </Tooltip>
//             <Popup>
//               <div className="text-sm space-y-1">
//                 <p className="font-bold">{pg.pgName}</p>
//                 <p>₹{pg.monthlyRent} / month</p>
//                 <p>{pg.genderPreference}</p>
//                 <button
//                   className="text-blue-600 underline mt-1"
//                   onClick={() => (window.location.href = `/routes/pg/${pg.id}`)}
//                 >
//                   View Details
//                 </button>
//               </div>
//             </Popup>
//           </Marker>
//         ))}
//       </MapContainer>
//     </div>
//   );
// }

"use client";

import dynamic from "next/dynamic";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamic import with proper loading component and error handling
const MapClient = dynamic(() => import("./MapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-HG-500 mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading MAP...</p>
      </div>
    </div>
  ),
});

export default function NearbyPGMap() {
  return (
    <div className="h-screen w-full relative">
      <Button
        onClick={() => window.history.back()}
        className="absolute top-5 right-14 z-[999999999] flex items-center px-4 py-5 shadow-lg hover:shadow-xl transition-shadow"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline text-sm font-medium">HOME</span>
      </Button>

      <MapClient />
    </div>
  );
}
