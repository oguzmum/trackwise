// Statistics View — Recharts charts + heatmap
const { useState, useMemo } = React;

const Statistics = ({ habits, categories, completions }) => {
  const [selectedHabit, setSelectedHabit] = useState(habits.filter(h => h.active)[0]?.id || '');
  const [range, setRange] = useState('12w');

  const { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = window.Recharts || {};

  const habit = habits.find(h => h.id === selectedHabit);
  const catColor = habit ? (categories[habit.category] || {}).color : '#d4933a';

  // Weekly data
  const weeklyData = useMemo(() => {
    if (!selectedHabit) return [];
    const today = new Date(); today.setHours(0,0,0,0);
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
        const key = date.toISOString().slice(0,10);
        total++;
        if ((completions[key] || []).includes(selectedHabit)) done++;
      }
      result.push({
        week: `${weekStart.getMonth()+1}/${weekStart.getDate()}`,
        rate: total > 0 ? Math.round(done/total*100) : 0,
        done, total,
      });
    }
    return result;
  }, [selectedHabit, completions, range]);

  // Stats summary
  const stats = useMemo(() => {
    if (!selectedHabit) return {};
    const today = new Date(); today.setHours(0,0,0,0);
    let totalDone = 0, totalDays = 0;
    let streak = 0, bestStreak = 0, cur = 0;

    for (let d = 89; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const key = date.toISOString().slice(0,10);
      if (date <= today) {
        totalDays++;
        const done = (completions[key] || []).includes(selectedHabit);
        if (done) { totalDone++; cur++; if (cur > bestStreak) bestStreak = cur; }
        else cur = 0;
      }
    }
    // current streak (from yesterday back)
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    let sc = 0, dd = new Date(yesterday);
    while(true) {
      const k = dd.toISOString().slice(0,10);
      if ((completions[k] || []).includes(selectedHabit)) { sc++; dd.setDate(dd.getDate()-1); }
      else break;
    }
    return {
      rate: totalDays > 0 ? Math.round((totalDone/totalDays)*100) : 0,
      totalDone,
      bestStreak,
      streak: sc,
    };
  }, [selectedHabit, completions]);

  // Heatmap: 91 days (13 weeks)
  const heatmap = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const cells = [];
    // Start from Sunday 13 weeks ago
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - 12*7);
    for (let i = 0; i < 91; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = date.toISOString().slice(0,10);
      const isFuture = date > today;
      const done = !isFuture && (completions[key] || []).includes(selectedHabit);
      cells.push({ key, date, done, isFuture, col: Math.floor(i/7), row: i%7 });
    }
    return cells;
  }, [selectedHabit, completions]);

  // Month labels for heatmap
  const heatmapMonths = useMemo(() => {
    const seen = {};
    heatmap.forEach(c => {
      const m = c.date.toLocaleDateString('en-US', { month: 'short' });
      if (!seen[m]) seen[m] = c.col;
    });
    return Object.entries(seen).map(([m, col]) => ({ m, col }));
  }, [heatmap]);

  if (!window.Recharts) {
    return <div style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>Loading charts…</div>;
  }

  const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ color: catColor, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>{payload[0].value}%</div>
      </div>
    );
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Analytics</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Statistics</h1>
      </div>

      {/* Habit selector */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
        {habits.filter(h => h.active).map(h => {
          const c = (categories[h.category] || {}).color || '#888';
          const sel = selectedHabit === h.id;
          return (
            <button key={h.id} onClick={() => setSelectedHabit(h.id)}
              style={{
                flexShrink: 0, border: `1.5px solid ${sel ? c : 'var(--border)'}`,
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

      {/* Summary cards */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Completion', value: `${stats.rate}%` },
          { label: 'Best Streak', value: `${stats.bestStreak}d` },
          { label: 'Total Done', value: stats.totalDone },
        ].map(s => (
          <Card key={s.label} style={{ padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontFamily: 'Space Mono, monospace', fontWeight: 700, color: catColor, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Range selector */}
      <div style={{ padding: '0 16px', display: 'flex', gap: 6, marginBottom: 12 }}>
        {[['4w','4 Weeks'],['8w','8 Weeks'],['12w','12 Weeks']].map(([v, l]) => (
          <button key={v} onClick={() => setRange(v)}
            style={{
              border: `1.5px solid ${range === v ? 'var(--accent-amber)' : 'var(--border)'}`,
              background: range === v ? 'var(--accent-amber)22' : 'transparent',
              color: range === v ? 'var(--accent-amber)' : 'var(--text-secondary)',
              borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* Line chart */}
      <div style={{ padding: '0 16px', marginBottom: 8 }}>
        <Card style={{ padding: '16px 12px 8px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, paddingLeft: 4 }}>Weekly Completion Rate</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={customTooltip} />
              <Line type="monotone" dataKey="rate" stroke={catColor} strokeWidth={2.5} dot={{ fill: catColor, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: catColor }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bar chart */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <Card style={{ padding: '16px 12px 8px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, paddingLeft: 4 }}>Days Completed Per Week</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,7]} tick={{ fontSize: 9, fill: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ color: catColor, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>{payload[0].value}/{payload[0].payload.total} days</div>
                </div>
              ) : null} />
              <Bar dataKey="done" radius={[4,4,0,0]}>
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
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>90-Day Heatmap</div>
          <div style={{ position: 'relative' }}>
            {/* Month labels */}
            <div style={{ display: 'flex', marginBottom: 4, position: 'relative', height: 14 }}>
              {heatmapMonths.map(({ m, col }) => (
                <span key={m} style={{ position: 'absolute', left: col * 14, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace', whiteSpace: 'nowrap' }}>{m}</span>
              ))}
            </div>
            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(13, 12px)`, gridTemplateRows: `repeat(7, 12px)`, gap: 2 }}>
              {heatmap.map(cell => (
                <div key={cell.key} title={cell.key}
                  style={{
                    width: 12, height: 12, borderRadius: 2,
                    gridColumn: cell.col + 1, gridRow: cell.row + 1,
                    background: cell.isFuture ? 'transparent' : cell.done ? catColor : 'var(--bg-elevated)',
                    border: `1px solid ${cell.isFuture ? 'transparent' : cell.done ? catColor + '88' : 'var(--border)'}`,
                    opacity: cell.isFuture ? 0 : 1,
                  }}
                />
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
    </div>
  );
};

Object.assign(window, { Statistics });
