"use client";

import { useState, useEffect } from "react";
import { Clock, Save, Trash2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useProgressSave } from "@/hooks/useProgressSave";
import { toast } from "sonner";

interface ProgressIndicatorProps {
  onLoadProgress?: (progress: any) => void;
  onClearProgress?: () => void;
  className?: string;
}

export default function ProgressIndicator({
  onLoadProgress,
  onClearProgress,
  className = "",
}: ProgressIndicatorProps) {
  const {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    savedProgress,
    loadProgress,
    clearProgress,
  } = useProgressSave();

  const [isLoading, setIsLoading] = useState(false);

  const handleLoadProgress = async () => {
    setIsLoading(true);
    try {
      const progress = await loadProgress();
      if (progress) {
        onLoadProgress?.(progress);
        toast.success("Progress loaded successfully!");
      } else {
        toast.info("No saved progress found");
      }
    } catch (error) {
      toast.error("Failed to load progress");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearProgress = async () => {
    if (
      confirm(
        "Are you sure you want to clear your saved progress? This action cannot be undone."
      )
    ) {
      try {
        await clearProgress();
        onClearProgress?.();
        toast.success("Progress cleared successfully!");
      } catch (error) {
        toast.error("Failed to clear progress");
      }
    }
  };

  if (!savedProgress) {
    return null;
  }

  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Save className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-900">Saved Progress</h3>
          <Badge variant="secondary" className="text-xs">
            Step {savedProgress.currentStep} of {savedProgress.totalSteps}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              Saving...
            </div>
          )}

          {!isSaving && lastSaved && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}

          {hasUnsavedChanges && !isSaving && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <AlertCircle className="w-3 h-3" />
              Unsaved changes
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm text-blue-800">
          <p className="font-medium">
            {savedProgress.formData?.pgName || "Untitled PG"}
          </p>
          <p className="text-xs text-blue-600">
            Last saved: {new Date(savedProgress.lastSavedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleLoadProgress}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="text-xs h-8"
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                Loading...
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 mr-1" />
                Continue
              </>
            )}
          </Button>

          <Button
            onClick={handleClearProgress}
            size="sm"
            variant="outline"
            className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
