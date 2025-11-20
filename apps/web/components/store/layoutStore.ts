import { useState } from "react";

type Layout = any;

export function useLayoutStore() {
  const [layout, setLayout] = useState<Layout>({});

  const addWidget = (slotId: string, widget: any) => {
    setLayout((prev: any) => ({
      ...prev,
      [slotId]: widget,
    }));
  };

  const moveWidget = (from: string, to: string) => {
    setLayout((prev: any) => {
      const next = { ...prev };
      next[to] = prev[from];
      delete next[from];
      return next;
    });
  };

  const removeWidget = (slotId: string) => {
    setLayout((prev: any) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  return {
    layout,
    setLayout,
    addWidget,
    moveWidget,
    removeWidget,
  };
}
