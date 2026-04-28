// Shared icons and UI primitives — exported to window

const Ic = ({ vb = "0 0 24 24", size = 20, children, ...p }) => (
  <svg width={size} height={size} viewBox={vb} fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

const Icons = {
  Home:      (p) => <Ic {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Ic>,
  CheckList: (p) => <Ic {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="9 11 11 13 15 9"/></Ic>,
  Grid:      (p) => <Ic {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Ic>,
  Chart:     (p) => <Ic {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Ic>,
  Settings:  (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Ic>,
  Plus:      (p) => <Ic {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ic>,
  Trash:     (p) => <Ic {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Ic>,
  Edit:      (p) => <Ic {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Ic>,
  X:         (p) => <Ic {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ic>,
  Check:     (p) => <Ic {...p}><polyline points="20 6 9 17 4 12"/></Ic>,
  Flame:     (p) => <Ic {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></Ic>,
  ChevRight: (p) => <Ic {...p}><polyline points="9 18 15 12 9 6"/></Ic>,
  ChevLeft:  (p) => <Ic {...p}><polyline points="15 18 9 12 15 6"/></Ic>,
  ChevDown:  (p) => <Ic {...p}><polyline points="6 9 12 15 18 9"/></Ic>,
  Pause:     (p) => <Ic {...p}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></Ic>,
  Play:      (p) => <Ic {...p}><polygon points="5 3 19 12 5 21 5 3"/></Ic>,
  Note:      (p) => <Ic {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Ic>,
  Calendar:  (p) => <Ic {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ic>,
};

// Category badge
const CategoryBadge = ({ cat, categories, small = false }) => {
  const c = categories[cat] || { label: cat, color: '#888' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: small ? 10 : 11, fontWeight: 600, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: c.color,
      background: c.color + '22', borderRadius: 4,
      padding: small ? '2px 6px' : '3px 8px',
    }}>
      <span style={{ width: small ? 5 : 6, height: small ? 5 : 6, borderRadius: '50%', background: c.color, flexShrink: 0 }}></span>
      {c.label}
    </span>
  );
};

// Progress bar
const ProgressBar = ({ value, color = '#d4933a', height = 4, bg = '#302e2b', style = {} }) => (
  <div style={{ background: bg, borderRadius: height, overflow: 'hidden', height, ...style }}>
    <div style={{
      height: '100%', width: `${Math.max(0, Math.min(100, value))}%`,
      background: color, borderRadius: height,
      transition: 'width 0.6s cubic-bezier(0.34,1.2,0.64,1)',
    }} />
  </div>
);

// Circular progress
const CircleProgress = ({ value, size = 80, stroke = 6, color = '#d4933a', bg = '#302e2b', children }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.34,1.2,0.64,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
};

// Card
const Card = ({ children, style = {}, onClick, className = '' }) => (
  <div onClick={onClick} className={className} style={{
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '16px 18px',
    cursor: onClick ? 'pointer' : 'default', ...style,
  }}>
    {children}
  </div>
);

Object.assign(window, { Icons, CategoryBadge, ProgressBar, CircleProgress, Card });
