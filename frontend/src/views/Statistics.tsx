import { useEffect, useMemo, useState } from 'react';
import { localDateKey } from '../utils';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { Habit, HabitStats, HeatmapEntry } from '../types';
import { getHabitStats, getHeatmap } from '../api';
import { Card } from '../components/ui';

interface Props {
  habits: Habit[];
}

type Range = '4w' | '8w' | '12w';

export default function Statistics({ habits }: Props) {
  const activeHabits = habits.filter(h => h.is_active);
  const [selectedId, setSelectedId] = useState<number | null>(activeHabits[0]?.id ?? null);
  const [range, setRange] = useState<Range>('12w');
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [heatmapEntries, setHeatmapEntries] = useState<HeatmapEntry[]>([]);

  const habit = habits.find(h => h.id === selectedId) ?? null;
  const catColor = habit?.category?.color ?? 'var(--accent-amber)';

  useEffect(() => {
    if (!selectedId) return;
    const year = new Date().getFullYear();
    Promise.all([
      getHabitStats(selectedId, 'year'),
      getHeatmap(selectedId, year),
    ]).then(([s, hm]) => {
      setStats(s);
      setHeatmapEntries(hm.entries);
    }).catch(() => {});
  }, [selectedId]);

  // Build a date→count lookup from heatmap entries
  const heatmapByDate = useMemo(() => {
    const m: Record<string, number> = {};
    heatmapEntries.forEach(e => { m[e.date] = e.completed ? 1 : 0; });
    return m;
  }, [heatmapEntries]);

  // Weekly completion data from heatmap
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weeks = range === '4w' ? 4 : range === '8w' ? 8 : 12;
    const result = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() - w * 7);
      let done = 0, total = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + d);
        if (date > today) break;
        const key = localDateKey(date);
        total++;
        if (heatmapByDate[key]) done++;
      }
      result.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        rate: total > 0 ? Math.round(done / total * 100) : 0,
        done, total,
      });
    }
    return result;
  }, [heatmapByDate, range]);

  // 91-day heatmap cells
  const heatmapCells = useMemo(() => {
    const today = new Date();
    const cells: { key: string; date: Date; done: boolean; isFuture: boolean; col: number; row: number }[] = [];
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - 12 * 7);
    for (let i = 0; i < 91; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = localDateKey(date);
      const isFuture = date > today;
      cells.push({ key, date, done: !isFuture && !!heatmapByDate[key], isFuture, col: Math.floor(i / 7), row: i % 7 });
    }
    return cells;
  }, [heatmapByDate]);

  const heatmapMonths = useMemo(() => {
    const seen: Record<string, number> = {};
    heatmapCells.forEach(c => {
      const m = c.date.toLocaleDateString('en-US', { month: 'short' });
      if (!(m in seen)) seen[m] = c.col;
    });
    return Object.entries(seen).map(([m, col]) => ({ m, col }));
  }, [heatmapCells]);

  const tooltipStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 };

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Analytics</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Statistics</h1>
      </div>

      {/* Habit selector */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
        {activeHabits.map(h => {
          const c = h.category?.color ?? '#888';
          const sel = selectedId === h.id;
          return (
            <button key={h.id} onClick={() => setSelectedId(h.id)} style={{
              flexShrink: 0,
              border: `1.5px solid ${sel ? c : 'var(--border)'}`,
              background: sel ? c + '22' : 'transparent',
              color: sel ? c : 'var(--text-secondary)',
              borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              {h.name}
            </button>
          );
        })}
      </div>

      {activeHabits.length === 0 && (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No active habits to show stats for.
        </div>
      )}

      {stats && (
        <>
          {/* Summary cards */}
          <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Completion', value: `${Math.round(stats.completion_rate * 100)}%` },
              { label: 'Best Streak', value: `${stats.longest_streak}d` },
              { label: 'Total Done', value: stats.days_completed },
            ].map(s => (
              <Card key={s.label} style={{ padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontFamily: 'Space Mono, monospace', fontWeight: 700, color: catColor, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Range selector */}
          <div style={{ padding: '0 16px', display: 'flex', gap: 6, marginBottom: 12 }}>
            {([['4w', '4 Weeks'], ['8w', '8 Weeks'], ['12w', '12 Weeks']] as [Range, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setRange(v)} style={{
                border: `1.5px solid ${range === v ? 'var(--accent-amber)' : 'var(--border)'}`,
                background: range === v ? 'var(--accent-amber)22' : 'transparent',
                color: range === v ? 'var(--accent-amber)' : 'var(--text-secondary)',
                borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>{l}</button>
            ))}
          </div>

          {/* Line chart */}
          <div style={{ padding: '0 16px', marginBottom: 8 }}>
            <Card style={{ padding: '16px 12px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, paddingLeft: 4 }}>
                Weekly Completion Rate
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                    <div style={tooltipStyle}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                      <div style={{ color: catColor, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>{payload[0].value}%</div>
                    </div>
                  ) : null} />
                  <Line type="monotone" dataKey="rate" stroke={catColor} strokeWidth={2.5}
                    dot={{ fill: catColor, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: catColor }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Bar chart */}
          <div style={{ padding: '0 16px', marginBottom: 16 }}>
            <Card style={{ padding: '16px 12px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, paddingLeft: 4 }}>
                Days Completed Per Week
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 7]} tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                    <div style={tooltipStyle}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                      <div style={{ color: catColor, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>
                        {payload[0].value}/{(payload[0].payload as { total: number }).total} days
                      </div>
                    </div>
                  ) : null} />
                  <Bar dataKey="done" radius={[4, 4, 0, 0]}>
                    {weeklyData.map((entry, i) => (
                      <Cell key={i} fill={entry.rate >= 70 ? catColor : catColor + '77'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Heatmap */}
          <div style={{ padding: '0 16px' }}>
            <Card style={{ padding: '16px', overflowX: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                90-Day Heatmap
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', marginBottom: 4, position: 'relative', height: 14 }}>
                  {heatmapMonths.map(({ m, col }) => (
                    <span key={m} style={{ position: 'absolute', left: col * 14, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace', whiteSpace: 'nowrap' }}>{m}</span>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 12px)', gridTemplateRows: 'repeat(7, 12px)', gap: 2 }}>
                  {heatmapCells.map(cell => (
                    <div key={cell.key} title={cell.key} style={{
                      width: 12, height: 12, borderRadius: 2,
                      gridColumn: cell.col + 1, gridRow: cell.row + 1,
                      background: cell.isFuture ? 'transparent' : cell.done ? catColor : 'var(--bg-elevated)',
                      border: `1px solid ${cell.isFuture ? 'transparent' : cell.done ? catColor + '88' : 'var(--border)'}`,
                      opacity: cell.isFuture ? 0 : 1,
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }}>
                  <span>Less</span>
                  {[0.2, 0.4, 0.65, 0.85, 1].map(o => (
                    <div key={o} style={{ width: 10, height: 10, borderRadius: 2, background: catColor, opacity: o }} />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
