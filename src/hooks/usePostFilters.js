import { useState, useCallback } from "react";

export function usePostFilters(activeTab) {
  const [allCounts, setAllCounts] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    scheduled: 0,
    posted: 0,
    rejected: 0,
    videos: 0,
  });

  const updateCounts = useCallback((serverCounts) => {
    if (!serverCounts) return;
    setAllCounts(prev => ({
      ...prev,
      total: serverCounts.total || 0,
      approved: serverCounts.approved || 0,
      pending: serverCounts.pending || 0,
      scheduled: serverCounts.scheduled || 0,
      posted: serverCounts.posted || 0,
      rejected: serverCounts.rejected || 0,
      videos: serverCounts.videos !== undefined ? serverCounts.videos : prev.videos, // If video count isn't returned, keep old
    }));
  }, []);

  return {
    allCounts,
    updateCounts
  };
}
