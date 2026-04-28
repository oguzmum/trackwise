// Dashboard View
const { useState, useMemo } = React;

const Dashboard = ({ habits, categories, completions, isCompleted, getStreak, onNavigate }) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayKey = today.toISOString().slice(0,10);
  const monthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const activeHabits = habits.filter(h => h.active);

  // Today's completion
  const todayDone = activeHabits.filter(h => isCompleted(h.id, todayKey)).length;
  const todayPct = activeHabits.length ? Math.round((todayDone / activeHabits.length) * 100) : 0;

  // Month overall rate
  const monthRate = useMemo(() => {
    const y = today.getFullYear(), m = today.getMonth();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const daysSoFar = today.getDate();
    if (!activeHabits.length) return 0;
    let total = 0, done = 0;
    for (let d = 1; d <= daysSoFar; d++) {
      const k = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      activeHabits.forEach(h => {
        total++;
        if ((completions[k] || []).includes(h.id)) done++;
      });
    }
    return total > 0 ? Math.round((done/total)*100) : 0;
  }, [completions]);

  // Per-habit month rate
  const habitMonthRate = (habitId) => {
    const y = today.getFullYear(), m = today.getMonth();
    const daysSoFar = today.getDate();
    let done = 0;
    for (let d = 1; d <= daysSoFar; d++) {
      const k = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if ((completions[k] || []).includes(habitId)) done++;
    }
    return Math.round((done / daysSoFar) * 100);
  };

  const catColor = (cat) => (categories[cat] || {}).color || '#888';

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Header */}
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

      {/* Today's progress card */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 22px' }}>
          <CircleProgress value={todayPct} size={76} stroke={7} color={todayPct === 100 ? 'var(--accent-sage)' : 'var(--accent-amber)'}>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Space Mono, monospace', color: 'var(--text-primary)' }}>
              {todayPct}<span style={{ fontSize: 9, fontWeight: 400 }}>%</span>
            </span>
          </CircleProgress>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {todayDone === 0 ? "Let's get started" :
               todayDone === activeHabits.length ? "All done today!" :
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

      {/* Section label */}
      <div style={{ padding: '8px 20px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        Habit Overview
      </div>

      {/* Habit cards */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeHabits.map(habit => {
          const streak = getStreak(habit.id);
          const rate = habitMonthRate(habit.id);
          const color = catColor(habit.category);
          const doneToday = isCompleted(habit.id, todayKey);
          return (
            <Card key={habit.id} style={{ padding: '14px 16px', borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Done indicator */}
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
                    <CategoryBadge cat={habit.category} categories={categories} small />
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
    </div>
  );
};

Object.assign(window, { Dashboard });
