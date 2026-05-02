import { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Card } from '../components/ui';
import { Icons } from '../components/Icons';
import type { ScanResult, Habit } from '../types';
import { scanImage, getHabits } from '../api';

interface TableRow {
  habitName: string;
  marks: boolean[];
  matchedHabitId: number | null;
  matchStatus: 'matched' | 'partial' | 'new';
}

type Phase = 'upload' | 'loading' | 'result';

// Total cols = 1 (grip) + 1 (habit) + nDataCols + 1 (+col) + 1 (delete row) = nDataCols + 4
const EXTRA_COLS = 4;

export default function ScanImport() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // hover state
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // drag state
  const [dragRow, setDragRow] = useState<number | null>(null);
  const [dragOverRow, setDragOverRow] = useState<number | null>(null);
  const [dragCol, setDragCol] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);

  const nDataCols = rows[0]?.marks.length ?? 0;

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setPhase('loading');
    try {
      const [result, fetchedHabits] = await Promise.all([scanImage(file), getHabits(true)]);
      setHabits(fetchedHabits);
      setScanResult(result);
      if (result.success) {
        setRows(
          result.habit_names.map((name, i) => ({
            habitName: name,
            marks: result.marks_matrix[i] ?? [],
            ...fuzzyMatch(name, fetchedHabits),
          }))
        );
        setPhase('result');
      } else {
        setError(result.error ?? 'Could not detect table in image.');
        setPhase('upload');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setPhase('upload');
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = '';
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleNameChange = (rowIdx: number, name: string) => {
    setRows(prev => prev.map((currentRow, index) =>
      index === rowIdx ? { ...currentRow, habitName: name, ...fuzzyMatch(name, habits) } : currentRow
    ));
  };

  const handleMatchChange = (rowIdx: number, habitId: number | null) => {
    setRows(prev => prev.map((currentRow, index) =>
      index === rowIdx ? { ...currentRow, matchedHabitId: habitId, matchStatus: habitId === null ? 'new' : 'matched' } : currentRow
    ));
  };

  const handleMarkToggle = (rowIdx: number, colIdx: number) => {
    setRows(prev =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        const marks = [...r.marks];
        marks[colIdx] = !marks[colIdx];
        return { ...r, marks };
      })
    );
  };

  const handleRemoveRow = (rowIdx: number) => {
    setRows(prev => prev.filter((_, i) => i !== rowIdx));
  };

  const handleRemoveCol = (colIdx: number) => {
    setRows(prev => prev.map(r => ({ ...r, marks: r.marks.filter((_, i) => i !== colIdx) })));
  };

  const handleAddRow = () => {
    setRows(prev => [...prev, { habitName: '', marks: Array(nDataCols).fill(false), matchedHabitId: null, matchStatus: 'new' }]);
  };

  const handleAddCol = () => {
    setRows(prev => prev.map(r => ({ ...r, marks: [...r.marks, false] })));
  };

  // row drag handlers
  const onRowDragStart = (i: number) => setDragRow(i);
  const onRowDragOver = (i: number, e: React.DragEvent) => {
    e.preventDefault();
    if (dragRow !== null) setDragOverRow(i);
  };
  const onRowDrop = (targetIdx: number) => {
    if (dragRow !== null && dragRow !== targetIdx) {
      setRows(prev => {
        const next = [...prev];
        const [moved] = next.splice(dragRow, 1);
        next.splice(targetIdx, 0, moved);
        return next;
      });
    }
    setDragRow(null);
    setDragOverRow(null);
  };
  const onRowDragEnd = () => { setDragRow(null); setDragOverRow(null); };

  // column drag handlers
  const onColDragStart = (i: number) => setDragCol(i);
  const onColDragOver = (i: number, e: React.DragEvent) => {
    e.preventDefault();
    if (dragCol !== null) setDragOverCol(i);
  };
  const onColDrop = (targetIdx: number) => {
    if (dragCol !== null && dragCol !== targetIdx) {
      setRows(prev => prev.map(r => {
        const marks = [...r.marks];
        const [moved] = marks.splice(dragCol, 1);
        marks.splice(targetIdx, 0, moved);
        return { ...r, marks };
      }));
    }
    setDragCol(null);
    setDragOverCol(null);
  };
  const onColDragEnd = () => { setDragCol(null); setDragOverCol(null); };

  return (
    <div style={{ padding: '28px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Scan Tracker
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Upload a photo of your habit tracker — the table will be detected automatically.
        </p>
      </div>

      {phase === 'upload' && (
        <>
          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 10,
              background: 'color-mix(in srgb, var(--accent-coral) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent-coral) 35%, transparent)',
              color: 'var(--accent-coral)', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-strong)', borderRadius: 16,
              padding: '52px 24px', textAlign: 'center', cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-amber)';
              e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-amber) 4%, transparent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ color: 'var(--text-muted)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <Icons.Upload size={36} />
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
              Drop image here or click to browse
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              JPG, PNG, HEIC
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={() => fileInputRef.current?.click()} style={btnStyle}>
              <Icons.Note size={15} />
              Choose file
            </button>
            <button onClick={() => cameraInputRef.current?.click()} style={btnStyle}>
              <Icons.Camera size={15} />
              Take photo
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
        </>
      )}

      {phase === 'loading' && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="preview"
              style={{
                maxWidth: '100%', maxHeight: 220, borderRadius: 10,
                objectFit: 'contain', display: 'block', margin: '0 auto 20px',
              }}
            />
          )}
          <Spinner />
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 14 }}>
            Detecting table…
          </div>
        </div>
      )}

      {phase === 'result' && scanResult && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{rows.length}</span> habits ·{' '}
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{nDataCols}</span> days detected
            </div>
            <button
              onClick={() => { setPhase('upload'); setScanResult(null); setRows([]); setPreviewUrl(null); }}
              style={{ ...btnStyle, fontSize: 12 }}
            >
              <Icons.X size={13} />
              Scan again
            </button>
          </div>

          <Card style={{ marginBottom: 20, padding: 12 }}>
            <img
              src={`data:image/png;base64,${scanResult.result_image}`}
              alt="Detection result"
              style={{ width: '100%', borderRadius: 8, display: 'block' }}
            />
          </Card>

          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Edit detected data
          </div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 360 }}>
                <thead>
                  <tr>
                    {/* grip column header */}
                    <th style={{ ...thStyle, width: 20, padding: '5px 4px' }} />
					{/* remove button */}
					<th style={{ ...thStyle, width: 2, padding: '2px 1px' }} />
                    <th style={thStyle}>Habit</th>
                    {Array.from({ length: nDataCols }, (_, i) => (
                      <th
                        key={i}
                        draggable
                        onDragStart={() => onColDragStart(i)}
                        onDragOver={e => onColDragOver(i, e)}
                        onDrop={() => onColDrop(i)}
                        onDragEnd={onColDragEnd}
                        onMouseEnter={() => setHoveredCol(i)}
                        onMouseLeave={() => setHoveredCol(null)}
                        style={{
                          ...thStyle,
                          width: 40, textAlign: 'center', padding: '5px 4px',
                          cursor: 'grab',
                          opacity: dragCol === i ? 0.35 : 1,
                          borderLeft: dragOverCol === i && dragCol !== i
                            ? '2px solid var(--accent-amber)' : '2px solid transparent',
                          transition: 'opacity 0.12s, border-color 0.1s',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <span>{i + 1}</span>
                          <button
                            onClick={() => handleRemoveCol(i)}
                            title="Remove column"
                            style={{
                              width: 14, height: 14, borderRadius: 3, border: 'none',
                              background: 'transparent', padding: 0, cursor: 'pointer',
                              opacity: hoveredCol === i ? 1 : 0,
                              transition: 'opacity 0.12s',
                              color: 'var(--accent-coral)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Icons.X size={10} />
                          </button>
                        </div>
                      </th>
                    ))}
                    {/* add column */}
                    <th style={{ ...thStyle, width: 32, textAlign: 'center', padding: '5px 4px' }}>
                      <button
                        onClick={handleAddCol}
                        title="Add column"
                        style={{
                          width: 20, height: 20, borderRadius: 5,
                          border: '1.5px dashed var(--border-strong)',
                          background: 'transparent', color: 'var(--text-muted)',
                          cursor: 'pointer', display: 'inline-flex',
                          alignItems: 'center', justifyContent: 'center', padding: 0,
                        }}
                      >
                        <Icons.Plus size={11} />
                      </button>
                    </th>
                    {/* delete row column */}
                    <th style={{ ...thStyle, width: 28, padding: '5px 4px' }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr
                      key={ri}
                      draggable
                      onDragStart={() => onRowDragStart(ri)}
                      onDragOver={e => onRowDragOver(ri, e)}
                      onDrop={() => onRowDrop(ri)}
                      onDragEnd={onRowDragEnd}
                      onMouseEnter={() => setHoveredRow(ri)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderTop: dragOverRow === ri && dragRow !== ri
                          ? '2px solid var(--accent-amber)'
                          : '1px solid var(--border)',
                        opacity: dragRow === ri ? 0.35 : 1,
                        transition: 'opacity 0.12s',
                      }}
                    >
                      {/* grip handle */}
                      <td style={{ padding: '4px 4px', textAlign: 'center', cursor: 'grab', color: 'var(--border-strong)' }}>
                        <GripIcon />
                      </td>
					  {/* delete row */}
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveRow(ri)}
                          title="Remove row"
                          style={{
                            width: 10, height: 20, borderRadius: 1,
                            border: 'none', background: 'transparent',
                            cursor: 'pointer', display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'center', padding: 0,
                            opacity: hoveredRow === ri ? 1 : 0,
                            transition: 'opacity 0.12s',
                            color: 'var(--accent-coral)',
                          }}
                        >
                          <Icons.X size={12} />
                        </button>
                      </td>
                      {/* habit name + match */}
                      <td style={{ padding: '4px 1px', minWidth: 170 }}>
                        <input
                          value={row.habitName}
                          onChange={e => handleNameChange(ri, e.target.value)}
                          placeholder="Habit name"
                          style={{
                            background: 'transparent', border: 'none',
                            color: row.habitName ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontFamily: 'inherit', fontSize: 13,
                            width: '100%', outline: 'none',
                            padding: '3px 5px', borderRadius: 5,
                          }}
                          onFocus={e => (e.target.style.background = 'var(--bg-elevated)')}
                          onBlur={e => (e.target.style.background = 'transparent')}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 5, marginTop: 2 }}>
                          <MatchDot status={row.matchStatus} />
                          <select
                            value={row.matchedHabitId ?? ''}
                            onChange={e => handleMatchChange(ri, e.target.value !== '' ? Number(e.target.value) : null)}
                            style={{
                              background: 'var(--bg-base)', border: 'none',
                              color: row.matchStatus === 'new' ? 'var(--text-muted)' : 'var(--text-secondary)',
                              fontFamily: 'inherit', fontSize: 11,
                              cursor: 'pointer', outline: 'none',
                              maxWidth: 150, padding: '1px 2px', borderRadius: 3,
                            }}
                          >
                            <option value="">New habit</option>
                            {habits.map(h => (
                              <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      {/* mark toggles */}
                      {row.marks.map((mark, ci) => (
                        <td key={ci} style={{ padding: '4px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleMarkToggle(ri, ci)}
                            title={mark ? 'Done' : 'Not done'}
                            style={{
                              width: 24, height: 24, borderRadius: 5,
                              border: `1.5px solid ${mark ? 'var(--accent-amber)' : 'var(--border-strong)'}`,
                              background: mark
                                ? 'color-mix(in srgb, var(--accent-amber) 18%, transparent)'
                                : 'transparent',
                              cursor: 'pointer', display: 'inline-flex',
                              alignItems: 'center', justifyContent: 'center',
                              color: 'var(--accent-amber)', transition: 'all 0.12s',
                              padding: 0,
                            }}
                          >
                            {mark && <Icons.Check size={12} />}
                          </button>
                        </td>
                      ))}
                      {/* aligned with add-col header */}
                      <td />
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td colSpan={nDataCols + EXTRA_COLS} style={{ padding: '5px 8px' }}>
                      <button
                        onClick={handleAddRow}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: 'transparent', border: 'none',
                          color: 'var(--text-muted)', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600, padding: '2px 4px',
                          borderRadius: 5, fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Icons.Plus size={12} />
                        Add row
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function fuzzyMatch(name: string, habits: Habit[]): { matchedHabitId: number | null; matchStatus: 'matched' | 'partial' | 'new' } {
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  const searchTerm = normalize(name);
  if (!searchTerm) return { matchedHabitId: null, matchStatus: 'new' };

  const exact = habits.find(habit => normalize(habit.name) === searchTerm);
  if (exact) return { matchedHabitId: exact.id, matchStatus: 'matched' };

  const partial = habits.find(habit => {
    const habitName = normalize(habit.name);
    return habitName.includes(searchTerm) || searchTerm.includes(habitName);
  });
  if (partial) return { matchedHabitId: partial.id, matchStatus: 'partial' };

  return { matchedHabitId: null, matchStatus: 'new' };
}

function MatchDot({ status }: { status: 'matched' | 'partial' | 'new' }) {
  if (status === 'matched') {
    return (
      <span title="Matched existing habit" style={{ color: 'var(--accent-sage)', display: 'inline-flex', flexShrink: 0 }}>
        <Icons.Check size={11} />
      </span>
    );
  }
  if (status === 'partial') {
    return (
      <span title="Possible match - please confirm" style={{
        color: 'var(--accent-amber)', fontSize: 11, fontWeight: 800,
        lineHeight: 1, flexShrink: 0, userSelect: 'none',
      }}>~</span>
    );
  }
  return (
    <span title="New habit will be created" style={{ color: 'var(--text-muted)', display: 'inline-flex', flexShrink: 0 }}>
      <Icons.Plus size={11} />
    </span>
  );
}

function GripIcon() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
      <circle cx="2" cy="2" r="1.2" />
      <circle cx="6" cy="2" r="1.2" />
      <circle cx="2" cy="6" r="1.2" />
      <circle cx="6" cy="6" r="1.2" />
      <circle cx="2" cy="10" r="1.2" />
      <circle cx="6" cy="10" r="1.2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width={32} height={32}
      viewBox="0 0 32 32"
      style={{ animation: 'spin 0.9s linear infinite', display: 'block', margin: '0 auto' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx={16} cy={16} r={12} fill="none" stroke="var(--border-strong)" strokeWidth={3} />
      <path d="M16 4 A12 12 0 0 1 28 16" fill="none" stroke="var(--accent-amber)" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

const btnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 9,
  border: '1px solid var(--border-strong)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 13, fontWeight: 600,
};

const thStyle: CSSProperties = {
  padding: '8px', textAlign: 'left',
  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  background: 'var(--bg-elevated)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
};
