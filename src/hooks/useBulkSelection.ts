import { useState, useCallback, useEffect } from "react";

type UseBulkSelectionOptions = {
  preserveSelectionOnItemsChange?: boolean;
};

export function useBulkSelection<T extends { id: number }>(
  items: T[],
  options?: UseBulkSelectionOptions
) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const isSelected = useCallback(
    (id: number) => selectedIds.has(id),
    [selectedIds]
  );

  const toggleSelect = useCallback(
    (id: number) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
    },
    [selectedIds]
  );

  const selectAll = useCallback(() => {
    const allIds = new Set(items.map((item) => item.id));
    setSelectedIds(allIds);
  }, [items]);

  const clearAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectByIds = useCallback((ids: number[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const getSelectedItems = useCallback(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  // By default, prune selection to visible items when the source list changes.
  // Some screens (like cross-page selection) can opt out.
  useEffect(() => {
    if (options?.preserveSelectionOnItemsChange) {
      return;
    }

    // Keep only selected IDs that are still in the items list
    const validIds = new Set(
      Array.from(selectedIds).filter((id) =>
        items.some((item) => item.id === id)
      )
    );
    if (validIds.size !== selectedIds.size) {
      setSelectedIds(validIds);
    }
  }, [items, selectedIds, options?.preserveSelectionOnItemsChange]);

  return {
    selectedIds,
    isSelected,
    toggleSelect,
    selectAll,
    selectByIds,
    clearAll,
    getSelectedItems,
    selectedCount: selectedIds.size,
  };
}
