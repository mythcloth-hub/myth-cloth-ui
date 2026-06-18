import { useState, useCallback, useEffect } from "react";

export function useBulkSelection<T extends { id: number }>(items: T[]) {
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

  const getSelectedItems = useCallback(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  // Reset selection when items change
  useEffect(() => {
    // Keep only selected IDs that are still in the items list
    const validIds = new Set(
      Array.from(selectedIds).filter((id) =>
        items.some((item) => item.id === id)
      )
    );
    if (validIds.size !== selectedIds.size) {
      setSelectedIds(validIds);
    }
  }, [items, selectedIds]);

  return {
    selectedIds,
    isSelected,
    toggleSelect,
    selectAll,
    clearAll,
    getSelectedItems,
    selectedCount: selectedIds.size,
  };
}
