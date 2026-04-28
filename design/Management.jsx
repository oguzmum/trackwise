// Habit Management View
const { useState } = React;

const FREQ_OPTIONS = ['daily', '5×/week', '4×/week', '3×/week', 'weekdays'];
const CAT_OPTIONS = ['fitness', 'health', 'learning', 'productivity'];

const Management = ({ habits, categories, onAddHabit, onToggleActive, onDeleteHabit, onEditHabit }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'health', freq: 'daily' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const resetForm = () => { setForm({ name: '', category: 'health', freq: 'daily' }); setShowAdd(false); setEditId(null); };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editId) {
      onEditHabit(editId, form);
    } else {
      onAddHabit({ ...form, id: 'h' + Date.now(), active: true, targetDays: 7 });
    }
    resetForm();
  };

  const startEdit = (habit) => {
    setForm({ name: habit.name, category: habit.category, freq: habit.freq });
    setEditId(habit.id);
    setShowAdd(true);
  };

  const catColor = (cat) => (categories[cat] || {}).color || '#888';
  const active = habits.filter(h => h.active);
  const paused = habits.filter(h => !h.active);

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ padding: '28px 20px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Manage</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Habits</h1>
        </div>
        <button onClick={() => { setEditId(null); setForm({ name: '', category: 'health', freq: 'daily' }); setShowAdd(true); }}
          style={{ background: 'var(--accent-amber)', color: '#100f0e', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Plus size={15} /> New
        </button>
      </div>

      {/* Add / Edit form */}
      {showAdd && (
        <div style={{ margin: '0 16px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-amber)44', borderRadius: 14, padding: '18px 18px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
            {editId ? 'Edit Habit' : 'New Habit'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Habit name…"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inputStyle}
              autoFocus
            />
            {/* Category */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CAT_OPTIONS.map(cat => (
                <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                  style={{
                    border: `1.5px solid ${form.category === cat ? catColor(cat) : 'var(--border)'}`,
                    background: form.category === cat ? catColor(cat) + '22' : 'transparent',
                    color: form.category === cat ? catColor(cat) : 'var(--text-secondary)',
                    borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.15s',
                  }}>
                  {(categories[cat] || {}).label || cat}
                </button>
              ))}
            </div>
            {/* Frequency */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FREQ_OPTIONS.map(f => (
                <button key={f} onClick={() => setForm(fd => ({ ...fd, freq: f }))}
                  style={{
                    border: `1.5px solid ${form.freq === f ? 'var(--accent-amber)' : 'var(--border)'}`,
                    background: form.freq === f ? 'var(--accent-amber)22' : 'transparent',
                    color: form.freq === f ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                  {f}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={handleSubmit} disabled={!form.name.trim()}
                style={{ flex: 1, background: 'var(--accent-amber)', color: '#100f0e', border: 'none', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 700, cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: form.name.trim() ? 1 : 0.5 }}>
                {editId ? 'Save Changes' : 'Add Habit'}
              </button>
              <button onClick={resetForm}
                style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active habits */}
      <SectionLabel label="Active" count={active.length} />
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {active.map(habit => (
          <HabitRow key={habit.id} habit={habit} categories={categories}
            onEdit={() => startEdit(habit)}
            onToggle={() => onToggleActive(habit.id)}
            onDelete={() => setConfirmDelete(habit.id)}
            confirmDelete={confirmDelete === habit.id}
            onConfirmDelete={() => { onDeleteHabit(habit.id); setConfirmDelete(null); }}
            onCancelDelete={() => setConfirmDelete(null)}
          />
        ))}
      </div>

      {/* Paused habits */}
      {paused.length > 0 && (
        <>
          <SectionLabel label="Paused" count={paused.length} style={{ marginTop: 20 }} />
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paused.map(habit => (
              <HabitRow key={habit.id} habit={habit} categories={categories} paused
                onEdit={() => startEdit(habit)}
                onToggle={() => onToggleActive(habit.id)}
                onDelete={() => setConfirmDelete(habit.id)}
                confirmDelete={confirmDelete === habit.id}
                onConfirmDelete={() => { onDeleteHabit(habit.id); setConfirmDelete(null); }}
                onCancelDelete={() => setConfirmDelete(null)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const SectionLabel = ({ label, count, style = {} }) => (
  <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', gap: 8, ...style }}>
    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderRadius: 4, padding: '1px 6px' }}>{count}</span>
  </div>
);

const HabitRow = ({ habit, categories, paused, onEdit, onToggle, onDelete, confirmDelete, onConfirmDelete, onCancelDelete }) => {
  const color = (categories[habit.category] || {}).color || '#888';
  return (
    <Card style={{ padding: '12px 14px', borderLeft: `3px solid ${paused ? 'var(--border)' : color}`, opacity: paused ? 0.6 : 1 }}>
      {confirmDelete ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, fontSize: 13, color: '#c9614a' }}>Delete "{habit.name}"?</span>
          <button onClick={onConfirmDelete} style={{ background: '#c9614a', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
          <button onClick={onCancelDelete} style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{habit.name}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <CategoryBadge cat={habit.category} categories={categories} small />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{habit.freq}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <IconBtn onClick={onEdit} title="Edit"><Icons.Edit size={15} /></IconBtn>
            <IconBtn onClick={onToggle} title={paused ? 'Resume' : 'Pause'}>{paused ? <Icons.Play size={15} /> : <Icons.Pause size={15} />}</IconBtn>
            <IconBtn onClick={onDelete} title="Delete" danger><Icons.Trash size={15} /></IconBtn>
          </div>
        </div>
      )}
    </Card>
  );
};

const IconBtn = ({ children, onClick, danger, title }) => (
  <button onClick={onClick} title={title} style={{
    background: 'transparent', border: '1px solid var(--border)',
    borderRadius: 7, padding: 7, cursor: 'pointer',
    color: danger ? '#c9614a88' : 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  }}>{children}</button>
);

const inputStyle = {
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 9, padding: '10px 12px', fontSize: 14,
  color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
};

Object.assign(window, { Management });
