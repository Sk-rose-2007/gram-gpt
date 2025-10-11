"use client";

import { z } from "zod";

const historyRecordSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "voice"]),
  input: z.string(),
  output: z.any(),
  date: z.string().datetime(),
});

export type AnalysisRecord = z.infer<typeof historyRecordSchema>;

const HISTORY_KEY = "verdant-sentinel-history";

const getLocalStorage = (): Storage | undefined => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return undefined;
};

export const getHistory = (): AnalysisRecord[] => {
  const storage = getLocalStorage();
  if (!storage) return [];

  const historyJson = storage.getItem(HISTORY_KEY);
  if (!historyJson) return [];

  try {
    const history = JSON.parse(historyJson) as AnalysisRecord[];
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Failed to parse history from localStorage", error);
    return [];
  }
};

export const addToHistory = (record: Omit<AnalysisRecord, "id">): void => {
  const storage = getLocalStorage();
  if (!storage) return;

  const currentHistory = getHistory();
  const newRecord: AnalysisRecord = {
    ...record,
    id: `${new Date().getTime()}-${Math.random()}`,
  };

  const updatedHistory = [newRecord, ...currentHistory];
  storage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
};

export const getHistoryItem = (id: string): AnalysisRecord | undefined => {
  const history = getHistory();
  return history.find((item) => item.id === id);
};

export const clearHistory = (): void => {
    const storage = getLocalStorage();
    if (!storage) return;
    storage.removeItem(HISTORY_KEY);
};
