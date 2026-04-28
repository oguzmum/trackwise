// Main App — state management + navigation
const { useState, useCallback, useMemo } = React;

const VIEWS = [
  { id: 'dashboard', label: 'Home',     Icon: (p) => <Icons.Home {...p} /> },
  { id: 'checkin',   label: 'Today',    Icon: (p) => <Icons.CheckList {...p} /> },
  { id: 'monthly',   label: 'Tracker',  Icon: (p) => <Icons.Grid {...p} /> },
  { id: 'stats',     label: 'Stats',    Icon: (p) => <Icons.Chart {...p} /> },
  { id: 'manage',    label: 'Habits',   Icon: (p) => <Icons.Settings {...p} /> },
];

const App = () => {
  const init = window.TRACKWISE_INIT;
  const [view, setView]             = useState('dashboard');
  const [habits, setHabits]         = useState(init.habits);
  const [completions, setCompletions] = useState(init.completions);
  const categories                   = init.categories;

  // --- Completion helpers ---
  const isCompleted = useCallback((habitId, dateKey) =>
    (completions[dateKey] || []).includes(habitId), [completions]);

  const toggleCompletion = useCallback((habitId, dateKey) => {
    setCompletions(prev => {
      const list = prev[dateKey] || [];
      return {
        ...prev,
        [dateKey]: list.includes(habitId)
          ? list.filter(id => id !== habitId)
          : [...list, habitId],
      };
    });
  }, []);

  const getStreak = useCallback((habitId) => {
    const today = new Date(); today.setHours(0,0,0,0);
    let streak = 0;
    const d = new Date(today);
    // If not done today, start from yesterday
    const todayKey = today.toISOString().slice(0,10);
    if (!((completions[todayKey] || []).includes(habitId))) {
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      const k = d.toISOString().slice(0,10);
      if ((completions[k] || []).includes(habitId)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
      if (streak > 365) break;
    }
    return streak;
  }, [completions]);

  // --- Habit management ---
  const onAddHabit = useCallback((habit) => setHabits(prev => [...prev, habit]), []);
  const onToggleActive = useCallback((id) =>
    setHabits(prev => prev.map(h => h.id === id ? { ...h, active: !h.active } : h)), []);
  const onDeleteHabit = useCallback((id) =>
    setHabits(prev => prev.filter(h => h.id !== id)), []);
  const onEditHabit = useCallback((id, updates) =>
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h)), []);

  const sharedProps = { habits, categories, completions, isCompleted, toggleCompletion, getStreak };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard {...sharedProps} onNavigate={setView} />;
      case 'checkin':   return <CheckIn {...sharedProps} />;
      case 'monthly':   return <MonthlyGrid {...sharedProps} />;
      case 'stats':     return <Statistics {...sharedProps} />;
      case 'manage':    return <Management {...sharedProps} onAddHabit={onAddHabit} onToggleActive={onToggleActive} onDeleteHabit={onDeleteHabit} onEditHabit={onEditHabit} />;
      default:          return null;
    }
  };

  // Today completion count (for badge)
  const today = new Date(); today.setHours(0,0,0,0);
  const todayKey = today.toISOString().slice(0,10);
  const todayActive = habits.filter(h => h.active);
  const todayDone = todayActive.filter(h => isCompleted(h.id, todayKey)).length;
  const allDoneToday = todayDone === todayActive.length && todayActive.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', fontFamily: 'Space Grotesk, sans-serif' }}>

      {/* Sidebar — desktop only */}
      <aside className="sidebar" style={{
        width: 220, flexShrink: 0, background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '28px 0',
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
            badge={v.id === 'checkin' && !allDoneToday ? `${todayDone}/${todayActive.length}` : null}
          />
        ))}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 80, maxWidth: 680, minWidth: 0 }}>
        {renderView()}
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="bottomnav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
        display: 'flex', zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {VIEWS.map(v => {
          const active = view === v.id;
          return (
            <button key={v.id} onClick={() => setView(v.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, padding: '10px 4px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: active ? 'var(--accent-amber)' : 'var(--text-muted)',
                fontFamily: 'inherit', transition: 'color 0.15s', position: 'relative',
              }}>
              <v.Icon size={20} stroke="currentColor" />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, letterSpacing: '0.04em' }}>{v.label}</span>
              {active && <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, borderRadius: 1, background: 'var(--accent-amber)' }} />}
              {v.id === 'checkin' && !allDoneToday && (
                <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(10px)', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-coral)' }} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

const SidebarItem = ({ v, active, onClick, badge }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 20px', margin: '1px 8px', borderRadius: 9,
    background: active ? 'var(--accent-amber)18' : 'transparent',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    color: active ? 'var(--accent-amber)' : 'var(--text-secondary)',
    fontSize: 13, fontWeight: active ? 700 : 500,
    transition: 'all 0.15s', textAlign: 'left', width: 'calc(100% - 16px)',
  }}>
    <v.Icon size={17} stroke="currentColor" />
    <span style={{ flex: 1 }}>{v.label}</span>
    {badge && (
      <span style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: active ? 'var(--accent-amber)' : 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 5, padding: '1px 6px' }}>{badge}</span>
    )}
  </button>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
