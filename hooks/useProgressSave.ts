import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";

interface ProgressData {
  formData: any;
  currentStep: number;
  totalSteps: number;
  isCompleted?: boolean;
}

interface UseProgressSaveOptions {
  autoSaveDelay?: number; // Auto-save delay in milliseconds
  enableAutoSave?: boolean; // Enable/disable auto-save
  onSaveSuccess?: (data: any) => void;
  onSaveError?: (error: any) => void;
}

export const useProgressSave = (options: UseProgressSaveOptions = {}) => {
  const {
    autoSaveDelay = 30000, // 30 seconds default
    enableAutoSave = true,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedProgress, setSavedProgress] = useState<any>(null);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>("");

  // Load existing progress on mount
  const loadProgress = useCallback(async () => {
    try {
      console.log("🔄 Loading progress...");
      const response = await axios.get("/api/listing/progress");
      console.log("📥 Progress response:", response.data);

      if (response.data.success && response.data.data) {
        setSavedProgress(response.data.data);
        setLastSaved(new Date(response.data.data.lastSavedAt));
        console.log("✅ Progress loaded successfully:", response.data.data);
        return response.data.data;
      } else {
        console.log("ℹ️ No saved progress found");
      }
    } catch (error) {
      console.error("❌ Failed to load progress:", error);
    }
    return null;
  }, []);

  // Save progress to server
  const saveProgress = useCallback(
    async (data: ProgressData) => {
      if (isSaving) {
        console.log("⏳ Already saving, skipping...");
        return; // Prevent multiple simultaneous saves
      }

      console.log("💾 Saving progress:", data);
      setIsSaving(true);
      try {
        const response = await axios.post("/api/listing/progress", data);
        console.log("📤 Save response:", response.data);

        if (response.data.success) {
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          setSavedProgress(response.data.data);
          lastSavedDataRef.current = JSON.stringify(data);

          onSaveSuccess?.(response.data.data);

          // Show success toast only if not auto-saving
          if (data.isCompleted) {
            toast.success("Progress saved successfully!");
          }

          console.log("✅ Progress saved successfully");
          return response.data.data;
        } else {
          throw new Error(response.data.message || "Failed to save progress");
        }
      } catch (error: any) {
        console.error("❌ Save progress error:", error);
        onSaveError?.(error);

        // Show error toast
        toast.error("Failed to save progress. Please try again.");

        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, onSaveSuccess, onSaveError]
  );

  // Auto-save with debouncing
  const autoSave = useCallback(
    (data: ProgressData) => {
      if (!enableAutoSave || data.isCompleted) {
        console.log("⏸️ Auto-save disabled or form completed");
        return;
      }

      console.log("⏰ Setting auto-save timeout...");
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        const currentDataString = JSON.stringify(data);

        // Only save if data has changed
        if (currentDataString !== lastSavedDataRef.current) {
          console.log("🔄 Data changed, triggering auto-save...");
          setHasUnsavedChanges(true);
          saveProgress(data).catch(console.error);
        } else {
          console.log("ℹ️ No changes detected, skipping auto-save");
        }
      }, autoSaveDelay);
    },
    [enableAutoSave, autoSaveDelay, saveProgress]
  );

  // Manual save (immediate)
  const saveNow = useCallback(
    async (data: ProgressData) => {
      // Clear auto-save timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      return await saveProgress(data);
    },
    [saveProgress]
  );

  // Clear saved progress
  const clearProgress = useCallback(async () => {
    try {
      await axios.delete("/api/listing/progress");
      setSavedProgress(null);
      setLastSaved(null);
      setHasUnsavedChanges(false);
      lastSavedDataRef.current = "";
      toast.success("Progress cleared successfully");
    } catch (error) {
      console.error("Failed to clear progress:", error);
      toast.error("Failed to clear progress");
    }
  }, []);

  // Check if there are unsaved changes
  const checkForChanges = useCallback((currentData: any) => {
    const currentDataString = JSON.stringify(currentData);
    const hasChanges = currentDataString !== lastSavedDataRef.current;
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    // State
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    savedProgress,

    // Actions
    saveProgress: saveNow,
    autoSave,
    loadProgress,
    clearProgress,
    checkForChanges,
  };
};
