"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  DiaryEntry,
  Goals,
  Recipe,
  WeightEntry,
} from "@/lib/types";
import {
  addDiaryEntry,
  createDefaultData,
  deleteDiaryEntry,
  deleteRecipe,
  deleteWeight,
  loadAppData,
  saveAppData,
  updateGoals,
  upsertRecipe,
  upsertWeight,
} from "@/lib/storage";

type StoreContextValue = {
  data: AppData;
  ready: boolean;
  saveRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  logEntry: (entry: DiaryEntry) => void;
  removeEntry: (id: string) => void;
  saveWeight: (entry: WeightEntry) => void;
  removeWeight: (id: string) => void;
  setGoals: (goals: Goals) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(createDefaultData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(loadAppData());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveAppData(data);
  }, [data, ready]);

  const saveRecipe = useCallback((recipe: Recipe) => {
    setData((prev) => upsertRecipe(prev, recipe));
  }, []);

  const removeRecipe = useCallback((id: string) => {
    setData((prev) => deleteRecipe(prev, id));
  }, []);

  const logEntry = useCallback((entry: DiaryEntry) => {
    setData((prev) => addDiaryEntry(prev, entry));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setData((prev) => deleteDiaryEntry(prev, id));
  }, []);

  const saveWeight = useCallback((entry: WeightEntry) => {
    setData((prev) => upsertWeight(prev, entry));
  }, []);

  const removeWeight = useCallback((id: string) => {
    setData((prev) => deleteWeight(prev, id));
  }, []);

  const setGoals = useCallback((goals: Goals) => {
    setData((prev) => updateGoals(prev, goals));
  }, []);

  const value = useMemo(
    () => ({
      data,
      ready,
      saveRecipe,
      removeRecipe,
      logEntry,
      removeEntry,
      saveWeight,
      removeWeight,
      setGoals,
    }),
    [
      data,
      ready,
      saveRecipe,
      removeRecipe,
      logEntry,
      removeEntry,
      saveWeight,
      removeWeight,
      setGoals,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
