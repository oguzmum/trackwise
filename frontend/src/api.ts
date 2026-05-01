import type { Category, Entry, Habit, HabitStats, HeatmapData, ScanResult } from './types';

const BASE = '/api';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Categories
export const getCategories = () => req<Category[]>('GET', '/categories/');
export const createCategory = (data: { name: string; color: string }) =>
  req<Category>('POST', '/categories/', data);
export const deleteCategory = (id: number) => req<void>('DELETE', `/categories/${id}`);

// Habits
export const getHabits = (active?: boolean) =>
  req<Habit[]>('GET', `/habits/${active !== undefined ? `?active=${active}` : ''}`);
export const createHabit = (data: { name: string; frequency: string; category_id?: number }) =>
  req<Habit>('POST', '/habits/', data);
export const updateHabit = (id: number, data: { name: string; frequency: string; category_id?: number | null }) =>
  req<Habit>('PUT', `/habits/${id}`, data);
export const toggleHabit = (id: number) => req<Habit>('PATCH', `/habits/${id}/toggle`);
export const deleteHabit = (id: number) => req<void>('DELETE', `/habits/${id}`);

// Entries
export const getEntriesByDate = (date: string) =>
  req<Entry[]>('GET', `/entries/?date=${date}`);
export const getEntriesByMonth = (month: string) =>
  req<Entry[]>('GET', `/entries/?month=${month}`);
export const upsertEntry = (data: { habit_id: number; date: string; completed: boolean; note?: string }) =>
  req<Entry>('POST', '/entries/', data);
export const patchEntry = (id: number, data: { completed?: boolean; note?: string }) =>
  req<Entry>('PATCH', `/entries/${id}`, data);

export const scanImage = async (file: File): Promise<ScanResult> => {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE}/scan/`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`POST /api/scan/ → ${res.status}`);
  return res.json() as Promise<ScanResult>;
};

// Stats
export const getHabitStats = (id: number, period: 'month' | 'quarter' | 'year' = 'month') =>
  req<HabitStats>('GET', `/stats/habit/${id}?period=${period}`);
export const getHeatmap = (habitId: number, year: number) =>
  req<HeatmapData>('GET', `/stats/heatmap?habit_id=${habitId}&year=${year}`);
