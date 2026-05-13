"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface LayoutContextValue {
  isLandscape: boolean;
}

const LayoutContext = createContext<LayoutContextValue>({ isLandscape: false });

// Mirrors the `desktop:` Tailwind variant in globals.css (min-height: 600px).
// When the viewport height is below that threshold, we treat the app as
// running in mobile-landscape mode.
const LANDSCAPE_QUERY = "(max-height: 599.98px)";

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(LANDSCAPE_QUERY);
    const update = () => setIsLandscape(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return (
    <LayoutContext.Provider value={{ isLandscape }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
