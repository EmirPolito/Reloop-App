import {
  createContext,
  useCallback,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from "react";

import { useRequiredContext } from "@/hooks/useRequiredContext";

type Drafts = Record<string, string>;
type DraftAction = { key: string; value: string };

interface DraftsValue {
  drafts: Drafts;
  setDraft: (key: string, value: string) => void;
}

const DraftsContext = createContext<DraftsValue | null>(null);

function draftsReducer(drafts: Drafts, { key, value }: DraftAction): Drafts {
  return drafts[key] === value ? drafts : { ...drafts, [key]: value };
}

/**
 * Textos a medio escribir (comentarios, mensajes, búsquedas). Viven fuera de las
 * pantallas para que no se pierdan al navegar, y van por clave para que el borrador
 * de un chat o de un producto nunca aparezca en otro.
 */
export function DraftsProvider({ children }: PropsWithChildren) {
  const [drafts, dispatch] = useReducer(draftsReducer, {});
  const setDraft = useCallback(
    (key: string, value: string) => dispatch({ key, value }),
    [],
  );
  const value = useMemo(() => ({ drafts, setDraft }), [drafts, setDraft]);

  return (
    <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>
  );
}

/** Texto en borrador asociado a `key` y su setter, como un `useState` persistente. */
export function useDraft(key: string): [string, (value: string) => void] {
  const { drafts, setDraft } = useRequiredContext(
    DraftsContext,
    "DraftsProvider",
  );
  const update = useCallback(
    (value: string) => setDraft(key, value),
    [key, setDraft],
  );
  return [drafts[key] ?? "", update];
}
