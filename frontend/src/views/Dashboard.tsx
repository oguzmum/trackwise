import { useMemo } from 'react';
import type { Completions, Habit } from '../types';
import { localDateKey } from '../utils';
import { Icons } from '../components/Icons';
import { Card, CategoryBadge, CircleProgress, ProgressBar } from '../components/ui';

interface Props {
  habits: Habit[];
  completions: Completions;
  onNavigate: (view: string) => void;
}

export default function Dashboard({ habits, completions, onNavigate }: Props) {
  const today = new Date();
  const todayKey = localDateKey(today);

  const activeHabits = habits.filter(h => h.is_active);

  const todayDone = activeHabits.filter(h => (completions[todayKey] ?? []).includes(h.id)).length;
  const todayPct = activeHabits.length ? Math.round((todayDone / activeHabits.length) * 100) : 0;

  const monthRate = useMemo(() => {
    const y = today.getFullYear(), m = today.getMonth();
    const daysSoFar = today.getDate();
    if (!activeHabits.length) return 0;
    let total = 0, done = 0;
    for (let d = 1; d <= daysSoFar; d++) {
      const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      activeHabits.forEach(h => {
        total++;
        if ((completions[k] ?? []).includes(h.id)) done++;
      });
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [completions, activeHabits, today]);

  const habitMonthRate = (habitId: number) => {
    const y = today.getFullYear(), m = today.getMonth();
    const daysSoFar = today.getDate();
    let done = 0;
    for (let d = 1; d <= daysSoFar; d++) {
      const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if ((completions[k] ?? []).includes(habitId)) done++;
    }
    return Math.round((done / daysSoFar) * 100);
  };

  const getStreak = (habitId: number) => {
    const d = new Date(today);
    if (!(completions[todayKey] ?? []).includes(habitId)) {
      d.setDate(d.getDate() - 1);
    }
    let streak = 0;
    while (streak < 365) {
      const k = localDateKey(d);
      if ((completions[k] ?? []).includes(habitId)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  };

  return (
    <div style={{ padding: '0 0 24px' }}>
      <div style={{ padding: '28px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            {today.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </h1>
        </div>
        <button onClick={() => onNavigate('checkin')} style={{
          background: 'var(--accent-amber)', color: '#100f0e',
          border: 'none', borderRadius: 10, padding: '10px 18px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icons.Check size={15} /> Check In
        </button>
      </div>

      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 22px' }}>
          <CircleProgress value={todayPct} size={76} stroke={7}
            color={todayPct === 100 ? 'var(--accent-sage)' : 'var(--accent-amber)'}>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>
              {todayPct}<span style={{ fontSize: 9, fontWeight: 400 }}>%</span>
            </span>
          </CircleProgress>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {todayDone === 0 ? "Let's get started" :
               todayDone === activeHabits.length ? 'All done today!' :
               `${todayDone} of ${activeHabits.length} done`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Today's habits</div>
            <ProgressBar value={todayPct} color={todayPct === 100 ? 'var(--accent-sage)' : 'var(--accent-amber)'} height={5} />
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Mono, monospace', color: 'var(--accent-amber)' }}>{monthRate}%</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>this month</div>
          </div>
        </Card>
      </div>

      {activeHabits.length === 0 && (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No active habits yet. Go to <strong style={{ color: 'var(--text-secondary)' }}>Habits</strong> to add some.
        </div>
      )}

      {activeHabits.length > 0 && (
        <>
          <div style={{ padding: '8px 20px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Habit Overview
          </div>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeHabits.map(habit => {
              const streak = getStreak(habit.id);
              const rate = habitMonthRate(habit.id);
              const color = habit.category?.color ?? '#888';
              const doneToday = (completions[todayKey] ?? []).includes(habit.id);
              return (
                <Card key={habit.id} style={{ padding: '14px 16px', borderLeft: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      background: doneToday ? color : 'transparent',
                      border: `2px solid ${doneToday ? color : 'var(--border-strong)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {doneToday && <Icons.Check size={12} stroke="#100f0e" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{habit.name}</span>
                        <span style={{ fontSize: 12, fontFamily: 'Space Mono, monospace', color, fontWeight: 700 }}>{rate}%</span>
                      </div>
                      <ProgressBar value={rate} color={color} height={3} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 }}>
                        <CategoryBadge category={habit.category} small />
                        {streak > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--accent-amber)', fontWeight: 600 }}>
                            <Icons.Flame size={12} stroke="var(--accent-amber)" /> {streak}d
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
