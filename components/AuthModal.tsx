"use client";

import { useState } from "react";
import Login from "@/app/clientComponents/Login";
import Signup from "@/app/clientComponents/Signup";

interface AuthModalProps {
  onSuccess?: () => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 py-2 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
            mode === "login"
              ? "border-HG-500 text-HG-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`flex-1 py-2 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
            mode === "signup"
              ? "border-HG-500 text-HG-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Content */}
      {mode === "login" ? (
        <Login onSuccess={onSuccess} />
      ) : (
        <Signup onSuccess={onSuccess} />
      )}
    </div>
  );
}