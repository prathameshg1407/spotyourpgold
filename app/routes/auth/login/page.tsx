"use server";

import { BrandPanel } from "../brand-panel";

import Login from "@/app/clientComponents/Login";

export default async function page() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <BrandPanel />

      <div className="w-full md:w-7/12 flex items-center justify-center p-6 md:p-20 bg-white">
        <Login />
      </div>
    </div>
  );
}





