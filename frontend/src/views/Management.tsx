import { useState } from 'react';
import type { Category, Habit } from '../types';
import { Icons } from '../components/Icons';
import { Card, CategoryBadge } from '../components/ui';

const FREQ_OPTIONS = ['daily', '5×/week', '4×/week', '3×/week', 'weekdays'];

interface Props {
  habits: Habit[];
  categories: Category[];
  onAdd: (name: string, frequency: string, categoryId: number | null) => Promise<void>;
  onEdit: (id: number, name: string, frequency: string, categoryId: number | null) => Promise<void>;
  onToggle: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

interface FormState {
  name: string;
  frequency: string;
  categoryId: number | null;
}

export default function Management({ habits, categories, onAdd, onEdit, onToggle, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', frequency: 'daily', categoryId: categories[0]?.id ?? null });
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({ name: '', frequency: 'daily', categoryId: categories[0]?.id ?? null });
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      if (editId !== null) {
        await onEdit(editId, form.name.trim(), form.frequency, form.categoryId);
      } else {
        await onAdd(form.name.trim(), form.frequency, form.categoryId);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (habit: Habit) => {
    setForm({ name: habit.name, frequency: habit.frequency, categoryId: habit.category_id });
    setEditId(habit.id);
    setShowForm(true);
  };

  const active = habits.filter(h => h.is_active);
  const paused = habits.filter(h => !h.is_active);

  return (
    <div style={{ padding: '0 0 32px' }}>
      <div style={{ padding: '28px 20px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Manage</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Habits</h1>
        </div>
        <button
          onClick={() => { setEditId(null); setForm({ name: '', frequency: 'daily', categoryId: categories[0]?.id ?? null }); setShowForm(true); }}
          style={{ background: 'var(--accent-amber)', color: '#100f0e', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Plus size={15} /> New
        </button>
      </div>

      {showForm && (
        <div style={{ margin: '0 16px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--accent-amber)44', borderRadius: 14, padding: '18px 18px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
            {editId !== null ? 'Edit Habit' : 'New Habit'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Habit name…"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
              style={inputStyle}
            />

            {/* Category selector */}
            {categories.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setForm(f => ({ ...f, categoryId: null }))}
                  style={{
                    border: `1.5px solid ${form.categoryId === null ? 'var(--border-strong)' : 'var(--border)'}`,
                    background: form.categoryId === null ? 'var(--bg-elevated)' : 'transparent',
                    color: form.categoryId === null ? 'var(--text-secondary)' : 'var(--text-muted)',
                    borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                  None
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setForm(f => ({ ...f, categoryId: cat.id }))}
                    style={{
                      border: `1.5px solid ${form.categoryId === cat.id ? cat.color : 'var(--border)'}`,
                      background: form.categoryId === cat.id ? cat.color + '22' : 'transparent',
                      color: form.categoryId === cat.id ? cat.color : 'var(--text-secondary)',
                      borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Frequency selector */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FREQ_OPTIONS.map(f => (
                <button key={f} onClick={() => setForm(fd => ({ ...fd, frequency: f }))
                } style={{
                  border: `1.5px solid ${form.frequency === f ? 'var(--accent-amber)' : 'var(--border)'}`,
                  background: form.frequency === f ? 'var(--accent-amber)22' : 'transparent',
                  color: form.frequency === f ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  {f}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={handleSubmit} disabled={!form.name.trim() || saving}
                style={{ flex: 1, background: 'var(--accent-amber)', color: '#100f0e', border: 'none', borderRadius: 9, padding: '10px', fontSize: 13, fontWeight: 700, cursor: form.name.trim() && !saving ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: form.name.trim() && !saving ? 1 : 0.5 }}>
                {saving ? 'Saving…' : editId !== null ? 'Save Changes' : 'Add Habit'}
              </button>
              <button onClick={resetForm}
                style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionLabel label="Active" count={active.length} />
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {active.map(habit => (
          <HabitRow key={habit.id} habit={habit}
            onEdit={() => startEdit(habit)}
            onToggle={() => onToggle(habit.id)}
            onDelete={() => setConfirmDelete(habit.id)}
            confirmDelete={confirmDelete === habit.id}
            onConfirmDelete={() => { onDelete(habit.id); setConfirmDelete(null); }}
            onCancelDelete={() => setConfirmDelete(null)}
          />
        ))}
        {active.length === 0 && (
          <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--text-muted)' }}>No active habits.</div>
        )}
      </div>

      {paused.length > 0 && (
        <>
          <SectionLabel label="Paused" count={paused.length} style={{ marginTop: 20 }} />
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paused.map(habit => (
              <HabitRow key={habit.id} habit={habit} paused
                onEdit={() => startEdit(habit)}
                onToggle={() => onToggle(habit.id)}
                onDelete={() => setConfirmDelete(habit.id)}
                confirmDelete={confirmDelete === habit.id}
                onConfirmDelete={() => { onDelete(habit.id); setConfirmDelete(null); }}
                onCancelDelete={() => setConfirmDelete(null)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const SectionLabel = ({ label, count, style = {} }: { label: string; count: number; style?: React.CSSProperties }) => (
  <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', gap: 8, ...style }}>
    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderRadius: 4, padding: '1px 6px' }}>{count}</span>
  </div>
);

interface HabitRowProps {
  habit: Habit;
  paused?: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  confirmDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

const HabitRow = ({ habit, paused, onEdit, onToggle, onDelete, confirmDelete, onConfirmDelete, onCancelDelete }: HabitRowProps) => {
  const color = habit.category?.color ?? '#888';
  return (
    <Card style={{ padding: '12px 14px', borderLeft: `3px solid ${paused ? 'var(--border)' : color}`, opacity: paused ? 0.6 : 1 }}>
      {confirmDelete ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, fontSize: 13, color: 'var(--accent-coral)' }}>Delete "{habit.name}"?</span>
          <button onClick={onConfirmDelete} style={{ background: 'var(--accent-coral)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
          <button onClick={onCancelDelete} style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{habit.name}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <CategoryBadge category={habit.category} small />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{habit.frequency}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <IconBtn onClick={onEdit} title="Edit"><Icons.Edit size={15} /></IconBtn>
            <IconBtn onClick={onToggle} title={paused ? 'Resume' : 'Pause'}>
              {paused ? <Icons.Play size={15} /> : <Icons.Pause size={15} />}
            </IconBtn>
            <IconBtn onClick={onDelete} title="Delete" danger><Icons.Trash size={15} /></IconBtn>
          </div>
        </div>
      )}
    </Card>
  );
};

const IconBtn = ({ children, onClick, danger, title }: { children: React.ReactNode; onClick: () => void; danger?: boolean; title?: string }) => (
  <button onClick={onClick} title={title} style={{
    background: 'transparent', border: '1px solid var(--border)',
    borderRadius: 7, padding: 7, cursor: 'pointer',
    color: danger ? 'var(--accent-coral)88' : 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  }}>{children}</button>
);

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: 9, padding: '10px 12px', fontSize: 14,
  color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
};
