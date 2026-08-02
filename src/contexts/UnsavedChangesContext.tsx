import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface UnsavedChangesContextValue {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  // Callers pass their own translated message (this context has no
  // access to i18next's t() outside a component render) — returns true
  // if it's safe to proceed (nothing dirty, or the user confirmed).
  confirmDiscard: (message: string) => boolean;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  // beforeunload's handler is only ever attached once, so it needs a
  // ref to read the *current* value rather than closing over a stale one.
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (isDirtyRef.current) {
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  function confirmDiscard(message: string) {
    if (!isDirtyRef.current) return true;
    return window.confirm(message);
  }

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setDirty: setIsDirty, confirmDiscard }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) throw new Error("useUnsavedChanges must be used within UnsavedChangesProvider");
  return ctx;
}
