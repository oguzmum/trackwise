export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Habit {
  id: number;
  name: string;
  category_id: number | null;
  category: Category | null;
  frequency: string;
  frequency_target: number | null;
  is_active: boolean;
}

export interface Entry {
  id: number;
  habit_id: number;
  date: string;
  completed: boolean;
  note: string | null;
}

export interface HabitStats {
  habit_id: number;
  period: string;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  days_completed: number;
  days_total: number;
}

export interface HeatmapEntry {
  date: string;
  completed: boolean;
}

export interface HeatmapData {
  habit_id: number | null;
  year: number;
  entries: HeatmapEntry[];
}

// {dateKey: completedHabitId[]}
export type Completions = Record<string, number[]>;

export interface ScanResult {
  success: boolean;
  n_rows: number;
  n_cols: number;
  habit_names: string[];
  marks_matrix: boolean[][];
  result_image?: string;
  error?: string;
}
