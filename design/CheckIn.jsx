// Daily Check-In View
const { useState, useRef, useEffect } = React;

const CheckIn = ({ habits, categories, completions, isCompleted, toggleCompletion }) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayKey = today.toISOString().slice(0,10);
  const activeHabits = habits.filter(h => h.active);

  const [notes, setNotes] = useState({});
  const [openNote, setOpenNote] = useState(null);
  const [justChecked, setJustChecked] = useState(null);
  const [ripple, setRipple] = useState(null);

  const done = activeHabits.filter(h => isCompleted(h.id, todayKey)).length;
  const pct = activeHabits.length ? Math.round((done / activeHabits.length) * 100) : 0;

  const catColor = (cat) => (categories[cat] || {}).color || '#888';

  const handleToggle = (habitId, e) => {
    // Ripple origin
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ id: habitId, x, y });
    setTimeout(() => setRipple(null), 500);

    toggleCompletion(habitId, todayKey);
    setJustChecked(habitId);
    setTimeout(() => setJustChecked(null), 600);
  };

  const allDone = done === activeHabits.length && activeHabits.length > 0;

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ padding: '28px 20px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
          Daily Check-In
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h1>

        {/* Top progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <ProgressBar value={pct} color={allDone ? 'var(--accent-sage)' : 'var(--accent-amber)'} height={6} />
          </div>
          <span style={{ fontSize: 13, fontFamily: 'Space Mono, monospace', fontWeight: 700, color: allDone ? 'var(--accent-sage)' : 'var(--accent-amber)', flexShrink: 0 }}>
            {done}/{activeHabits.length}
          </span>
        </div>
      </div>

      {/* All done banner */}
      {allDone && (
        <div style={{
          margin: '0 16px 16px', padding: '14px 18px', borderRadius: 12,
          background: 'var(--accent-sage)22', border: '1px solid var(--accent-sage)44',
          color: 'var(--accent-sage)', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icons.Check size={18} /> All habits completed! Great work.
        </div>
      )}

      {/* Habit list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeHabits.map(habit => {
          const checked = isCompleted(habit.id, todayKey);
          const color = catColor(habit.category);
          const isBouncing = justChecked === habit.id;
          const noteOpen = openNote === habit.id;
          const hasNote = notes[habit.id]?.trim();

          return (
            <div key={habit.id} style={{
              background: checked ? color + '18' : 'var(--bg-surface)',
              border: `1px solid ${checked ? color + '55' : 'var(--border)'}`,
              borderRadius: 14, overflow: 'hidden',
              transition: 'background 0.3s, border-color 0.3s',
            }}>
              {/* Main row */}
              <div
                onClick={(e) => handleToggle(habit.id, e)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 16px', cursor: 'pointer',
                  position: 'relative', overflow: 'hidden', userSelect: 'none',
                  minHeight: 60,
                }}
              >
                {/* Ripple */}
                {ripple?.id === habit.id && (
                  <span style={{
                    position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
                    width: 8, height: 8, background: color + '55',
                    left: ripple.x - 4, top: ripple.y - 4,
                    animation: 'rippleOut 0.5s ease-out forwards',
                  }} />
                )}

                {/* Checkbox */}
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: checked ? color : 'transparent',
                  border: `2px solid ${checked ? color : 'var(--border-strong)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                  transform: isBouncing ? 'scale(1.3)' : 'scale(1)',
                }}>
                  {checked && <Icons.Check size={16} stroke="#100f0e" strokeWidth={3} />}
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 16, fontWeight: 600, color: checked ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: checked ? 'line-through' : 'none',
                    textDecorationColor: color + '88',
                    transition: 'color 0.2s',
                  }}>
                    {habit.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <CategoryBadge cat={habit.category} categories={categories} small />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{habit.freq}</span>
                  </div>
                </div>

                {/* Note toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenNote(noteOpen ? null : habit.id); }}
                  style={{
                    background: hasNote ? color + '33' : 'transparent',
                    border: 'none', cursor: 'pointer', padding: 6, borderRadius: 7,
                    color: hasNote ? color : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icons.Note size={16} />
                </button>
              </div>

              {/* Note area */}
              {noteOpen && (
                <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${color}33` }}>
                  <textarea
                    placeholder="Quick note…"
                    value={notes[habit.id] || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [habit.id]: e.target.value }))}
                    rows={2}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '8px 10px', marginTop: 10,
                      color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
                      resize: 'none', outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

Object.assign(window, { CheckIn });
