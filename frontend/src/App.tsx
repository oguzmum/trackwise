import { useCallback, useEffect, useRef, useState } from 'react';
import type { Category, Completions, Habit } from './types';
import {
  getCategories, getHabits,
  getEntriesByMonth,
  upsertEntry,
  createHabit, updateHabit, toggleHabit, deleteHabit,
} from './api';
import { Icons } from './components/Icons';
import Dashboard from './views/Dashboard';
import CheckIn from './views/CheckIn';
import MonthlyGrid from './views/MonthlyGrid';
import Statistics from './views/Statistics';
import Management from './views/Management';

type View = 'dashboard' | 'checkin' | 'monthly' | 'stats' | 'manage';

const VIEWS: { id: View; label: string; Icon: (p: { size: number }) => JSX.Element }[] = [
  { id: 'dashboard', label: 'Home',    Icon: p => <Icons.Home {...p} /> },
  { id: 'checkin',   label: 'Today',   Icon: p => <Icons.CheckList {...p} /> },
  { id: 'monthly',   label: 'Tracker', Icon: p => <Icons.Grid {...p} /> },
  { id: 'stats',     label: 'Stats',   Icon: p => <Icons.Chart {...p} /> },
  { id: 'manage',    label: 'Habits',  Icon: p => <Icons.Settings {...p} /> },
];

function toMonthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function entriesToCompletions(entries: { habit_id: number; date: string; completed: boolean }[]): Completions {
  const out: Completions = {};
  for (const e of entries) {
    if (!e.completed) continue;
    (out[e.date] ??= []).push(e.habit_id);
  }
  return out;
}

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [completions, setCompletions] = useState<Completions>({});
  const loadedMonths = useRef(new Set<string>());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().slice(0, 10);

  // Initial load
  useEffect(() => {
    Promise.all([getCategories(), getHabits()]).then(([cats, hbs]) => {
      setCategories(cats);
      setHabits(hbs);
    });
    // Load today + current month entries
    const nowMonthKey = toMonthKey(today.getFullYear(), today.getMonth());
    loadMonth(today.getFullYear(), today.getMonth(), nowMonthKey);
  }, []);

  const loadMonth = useCallback((year: number, month: number, key?: string) => {
    const mk = key ?? toMonthKey(year, month);
    if (loadedMonths.current.has(mk)) return;
    loadedMonths.current.add(mk);
    getEntriesByMonth(mk).then(entries => {
      setCompletions(prev => {
        const patch = entriesToCompletions(entries);
        const next = { ...prev };
        for (const [date, ids] of Object.entries(patch)) {
          next[date] = ids;
        }
        // Also clear days in this month that had no completed entries
        const y = year, m = month;
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const dk = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (!(dk in patch)) next[dk] = [];
        }
        return next;
      });
    });
  }, []);

  const handleToggle = useCallback(async (habitId: number, dateKey: string) => {
    const current = completions[dateKey] ?? [];
    const nowDone = current.includes(habitId);
    const newCompleted = !nowDone;

    // Optimistic update
    setCompletions(prev => {
      const list = prev[dateKey] ?? [];
      return {
        ...prev,
        [dateKey]: newCompleted
          ? [...list, habitId]
          : list.filter(id => id !== habitId),
      };
    });

    try {
      await upsertEntry({ habit_id: habitId, date: dateKey, completed: newCompleted });
    } catch {
      // Revert on error
      setCompletions(prev => {
        const list = prev[dateKey] ?? [];
        return {
          ...prev,
          [dateKey]: nowDone
            ? [...list, habitId]
            : list.filter(id => id !== habitId),
        };
      });
    }
  }, [completions]);

  const handleNote = useCallback(async (habitId: number, dateKey: string, note: string) => {
    const completed = (completions[dateKey] ?? []).includes(habitId);
    try {
      await upsertEntry({ habit_id: habitId, date: dateKey, completed, note });
    } catch { /* silent */ }
  }, [completions]);

  const handleAddHabit = async (name: string, frequency: string, categoryId: number | null) => {
    const habit = await createHabit({ name, frequency, ...(categoryId ? { category_id: categoryId } : {}) });
    setHabits(prev => [...prev, habit]);
  };

  const handleEditHabit = async (id: number, name: string, frequency: string, categoryId: number | null) => {
    const habit = await updateHabit(id, { name, frequency, category_id: categoryId });
    setHabits(prev => prev.map(h => h.id === id ? habit : h));
  };

  const handleToggleHabit = async (id: number) => {
    const habit = await toggleHabit(id);
    setHabits(prev => prev.map(h => h.id === id ? habit : h));
  };

  const handleDeleteHabit = async (id: number) => {
    await deleteHabit(id);
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const activeHabits = habits.filter(h => h.is_active);
  const todayDone = activeHabits.filter(h => (completions[todayKey] ?? []).includes(h.id)).length;
  const allDoneToday = todayDone === activeHabits.length && activeHabits.length > 0;

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard habits={habits} completions={completions} onNavigate={(v) => setView(v as View)} />;
      case 'checkin':   return <CheckIn habits={habits} completions={completions} onToggle={handleToggle} onNote={handleNote} />;
      case 'monthly':   return <MonthlyGrid habits={habits} completions={completions} onToggle={handleToggle} onMonthChange={loadMonth} />;
      case 'stats':     return <Statistics habits={habits} />;
      case 'manage':    return (
        <Management
          habits={habits}
          categories={categories}
          onAdd={handleAddHabit}
          onEdit={handleEditHabit}
          onToggle={handleToggleHabit}
          onDelete={handleDeleteHabit}
        />
      );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', fontFamily: 'Space Grotesk, sans-serif' }}>

      {/* Sidebar — desktop */}
      <aside className="sidebar" style={{
        width: 220, flexShrink: 0, background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        flexDirection: 'column', padding: '28px 0',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            track<span style={{ color: 'var(--accent-amber)' }}>wise</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Personal Habit Log</div>
        </div>
        {VIEWS.map(v => (
          <SidebarItem key={v.id} v={v} active={view === v.id} onClick={() => setView(v.id)}
            badge={v.id === 'checkin' && !allDoneToday && activeHabits.length > 0
              ? `${todayDone}/${activeHabits.length}` : null}
          />
        ))}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 80, maxWidth: 680, minWidth: 0 }}>
        {renderView()}
      </main>

      {/* Bottom nav — mobile */}
      <nav className="bottomnav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
        flexDirection: 'row', zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {VIEWS.map(v => {
          const active = view === v.id;
          return (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, padding: '10px 4px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: active ? 'var(--accent-amber)' : 'var(--text-muted)',
              fontFamily: 'inherit', transition: 'color 0.15s', position: 'relative',
            }}>
              <v.Icon size={20} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, letterSpacing: '0.04em' }}>{v.label}</span>
              {active && (
                <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, borderRadius: 1, background: 'var(--accent-amber)' }} />
              )}
              {v.id === 'checkin' && !allDoneToday && activeHabits.length > 0 && (
                <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(10px)', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-coral)' }} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

interface SidebarItemProps {
  v: { id: string; label: string; Icon: (p: { size: number }) => JSX.Element };
  active: boolean;
  onClick: () => void;
  badge: string | null;
}

function SidebarItem({ v, active, onClick, badge }: SidebarItemProps) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 20px', margin: '1px 8px', borderRadius: 9,
      background: active ? 'var(--accent-amber)18' : 'transparent',
      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      color: active ? 'var(--accent-amber)' : 'var(--text-secondary)',
      fontSize: 13, fontWeight: active ? 700 : 500,
      transition: 'all 0.15s', textAlign: 'left', width: 'calc(100% - 16px)',
    }}>
      <v.Icon size={17} />
      <span style={{ flex: 1 }}>{v.label}</span>
      {badge && (
        <span style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: active ? 'var(--accent-amber)' : 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 5, padding: '1px 6px' }}>{badge}</span>
      )}
    </button>
  );
}
