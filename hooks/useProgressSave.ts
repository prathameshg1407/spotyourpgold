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
      const response = await axios.get("/api/listing/progress");

      if (response.data.success && response.data.data) {
        setSavedProgress(response.data.data);
        setLastSaved(new Date(response.data.data.lastSavedAt));
        return response.data.data;
      }
    } catch (error) {
      // Error handled silently
    }
    return null;
  }, []);

  // Save progress to server
  const saveProgress = useCallback(
    async (data: ProgressData) => {
      if (isSaving) {
        return; // Prevent multiple simultaneous saves
      }

      setIsSaving(true);
      try {
        const response = await axios.post("/api/listing/progress", data);

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

          return response.data.data;
        } else {
          throw new Error(response.data.message || "Failed to save progress");
        }
      } catch (error: any) {
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
        return;
      }
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        const currentDataString = JSON.stringify(data);

        // Only save if data has changed
        if (currentDataString !== lastSavedDataRef.current) {
          setHasUnsavedChanges(true);
          saveProgress(data).catch(() => {});
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
