import { useState } from 'react';
import type { Completions, Habit } from '../types';
import { localDateKey } from '../utils';
import { Icons } from '../components/Icons';

interface Props {
  habits: Habit[];
  completions: Completions;
  onToggle: (habitId: number, dateKey: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

export default function MonthlyGrid({ habits, completions, onToggle, onMonthChange }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const today = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const activeHabits = habits.filter(h => h.is_active);

  const prevMonth = () => {
    let ny = year, nm = month - 1;
    if (nm < 0) { nm = 11; ny--; }
    setYear(ny); setMonth(nm);
    onMonthChange(ny, nm);
  };

  const nextMonth = () => {
    let ny = year, nm = month + 1;
    if (nm > 11) { nm = 0; ny++; }
    if (new Date(ny, nm, 1) <= new Date(today.getFullYear(), today.getMonth() + 1, 1)) {
      setYear(ny); setMonth(nm);
      onMonthChange(ny, nm);
    }
  };

  const dateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const isFuture = (day: number) => new Date(year, month, day) > today;
  const isToday = (day: number) => dateKey(day) === localDateKey(today);

  const habitRate = (habitId: number) => {
    const daysSoFar = (year === today.getFullYear() && month === today.getMonth())
      ? today.getDate() : daysInMonth;
    let done = 0;
    for (let d = 1; d <= daysSoFar; d++) {
      if ((completions[dateKey(d)] ?? []).includes(habitId)) done++;
    }
    return Math.round((done / daysSoFar) * 100);
  };

  const dayLabel = (day: number) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(year, month, day).getDay()];

  const overallRate = () => {
    const daysSoFar = (year === today.getFullYear() && month === today.getMonth()) ? today.getDate() : daysInMonth;
    if (!activeHabits.length) return '–';
    let done = 0, total = 0;
    for (let d = 1; d <= daysSoFar; d++) {
      const k = dateKey(d);
      activeHabits.forEach(h => {
        total++;
        if ((completions[k] ?? []).includes(h.id)) done++;
      });
    }
    return `${Math.round(done / total * 100)}%`;
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Tracker</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{monthName}</h1>
          <div style={{ display: 'flex', gap: 4 }}>
            <NavBtn onClick={prevMonth}><Icons.ChevLeft size={16} /></NavBtn>
            <NavBtn onClick={nextMonth}><Icons.ChevRight size={16} /></NavBtn>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', padding: '0 16px' }}>
        <div style={{ minWidth: 'max-content' }}>
          {/* Day header */}
          <div style={{ display: 'flex', marginBottom: 6, paddingLeft: 130 }}>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
              <div key={day} style={{
                width: 26, flexShrink: 0, textAlign: 'center',
                fontSize: 9, fontFamily: 'Space Mono, monospace',
                color: isToday(day) ? 'var(--accent-amber)' : 'var(--text-muted)',
                fontWeight: isToday(day) ? 700 : 400,
              }}>
                <div>{day}</div>
                <div style={{ opacity: 0.5 }}>{dayLabel(day)}</div>
              </div>
            ))}
            <div style={{ width: 44, flexShrink: 0 }} />
          </div>

          {/* Habit rows */}
          {activeHabits.map(habit => {
            const color = habit.category?.color ?? '#888';
            const rate = habitRate(habit.id);
            return (
              <div key={habit.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ width: 130, flexShrink: 0, paddingRight: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {habit.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }}>
                      {habit.category?.name}
                    </span>
                  </div>
                </div>

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const k = dateKey(day);
                  const done = (completions[k] ?? []).includes(habit.id);
                  const future = isFuture(day);
                  const tod = isToday(day);
                  return (
                    <div
                      key={day}
                      onClick={() => !future && onToggle(habit.id, k)}
                      title={`${habit.name} — ${k}`}
                      style={{
                        width: 22, height: 22, flexShrink: 0, margin: '0 2px',
                        borderRadius: 5, cursor: future ? 'default' : 'pointer',
                        background: future ? 'transparent' : done ? color : 'var(--bg-elevated)',
                        border: `1px solid ${future ? 'transparent' : tod ? color + 'aa' : done ? color + '66' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                        opacity: future ? 0.2 : 1,
                        boxShadow: tod && !future ? `0 0 0 1px ${color}44` : 'none',
                      }}
                    />
                  );
                })}

                <div style={{ width: 44, flexShrink: 0, textAlign: 'right', paddingLeft: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', fontWeight: 700, color }}>{rate}%</span>
                </div>
              </div>
            );
          })}

          {/* Overall row */}
          {activeHabits.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <div style={{ width: 130, flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', paddingRight: 12 }}>
                Overall
              </div>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const k = dateKey(day);
                const future = isFuture(day);
                const dayDone = future ? 0 : activeHabits.filter(h => (completions[k] ?? []).includes(h.id)).length;
                const dayPct = activeHabits.length ? dayDone / activeHabits.length : 0;
                return (
                  <div key={day} style={{
                    width: 22, height: 22, margin: '0 2px', borderRadius: 5, flexShrink: 0,
                    background: future ? 'transparent' : `rgba(77,111,227,${dayPct * 0.85})`,
                    border: `1px solid ${future ? 'transparent' : dayPct > 0 ? 'var(--accent-amber)44' : 'var(--border)'}`,
                    opacity: future ? 0 : 1,
                  }} title={future ? '' : `${Math.round(dayPct * 100)}%`} />
                );
              })}
              <div style={{ width: 44, flexShrink: 0, textAlign: 'right', paddingLeft: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', fontWeight: 700, color: 'var(--accent-amber)' }}>
                  {overallRate()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {activeHabits.length > 0 && (
        <div style={{ padding: '16px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {activeHabits.map(h => h.category).filter((c, i, arr) =>
            c && arr.findIndex(x => x?.id === c.id) === i
          ).map(cat => cat && (
            <span key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: cat.color, display: 'inline-block' }} />
              {cat.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const NavBtn = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button onClick={onClick} style={{
    background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '7px 8px', cursor: 'pointer', color: 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>{children}</button>
);
