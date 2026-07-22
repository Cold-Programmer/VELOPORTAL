import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';

const TOLERANCE_MM = 0.05;

function checkCompatibility({ frame, fork, wheel }) {
  if (!frame) return { compatible: true, checks: [] };
  const checks = [];
  let compatible = true;
  if (fork) {
    const diff = Math.abs(Number(frame.headtubeDiameter) - Number(fork.steererDiameter));
    const ok = diff <= TOLERANCE_MM;
    if (!ok) compatible = false;
    checks.push({ label: 'Fork ↔ frame headtube', ok, detail: `${fork.steererDiameter}mm steerer vs ${frame.headtubeDiameter}mm headtube` });
  }
  if (wheel) {
    const ok = wheel.wheelSize === frame.wheelSize;
    if (!ok) compatible = false;
    checks.push({ label: 'Wheelset ↔ frame size', ok, detail: `${wheel.wheelSize} vs ${frame.wheelSize}` });
  }
  return { compatible, checks };
}

function PartCard({ part, selected, onSelect, renderSpec }) {
  return (
    <button onClick={() => onSelect(selected?.id === part.id ? null : part)}
      className={`card text-left overflow-hidden transition-all duration-300 group ${selected?.id === part.id ? 'ring-2 ring-forest shadow-forest scale-[1.02] dark:ring-amber' : 'card-hover'}`}>
      <div className="aspect-[4/3] overflow-hidden bg-sand-100 dark:bg-forest-dark/50">
        <img src={part.image || part.images?.[0]} alt={part.name} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="p-4">
        <p className="font-display text-sm font-semibold leading-snug">{part.name}</p>
        <p className="text-xs text-ink-400 dark:text-white/50">{part.brand}</p>
        {renderSpec && <p className="mt-1.5 text-2xs font-semibold text-amber-dark">{renderSpec(part)}</p>}
        <p className="mt-2 font-display text-base font-bold text-forest dark:text-amber">KES {Number(part.price).toLocaleString()}</p>
      </div>
      {selected?.id === part.id && (
        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-forest text-white text-xs">✓</div>
      )}
    </button>
  );
}

const PART_SECTIONS = [
  { key: 'fork', type: 'fork', label: '2. Front fork', optional: true, spec: p => `Steerer ${p.steererDiameter}mm` },
  { key: 'wheel', type: 'wheel', label: '3. Wheelset', optional: true, spec: p => `Size ${p.wheelSize}` },
  { key: 'handlebar', type: 'handlebar', label: '4. Handlebar', optional: true, spec: null },
  { key: 'drivetrain', type: 'drivetrain', label: '5. Drivetrain', optional: true, spec: null },
];

export default function Customizer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [frames, setFrames] = useState([]);
  const [parts,  setParts]  = useState({});
  const [frame,  setFrame]  = useState(null);
  const [picks,  setPicks]  = useState({ fork: null, wheel: null, handlebar: null, drivetrain: null });
  const [buildName, setBuildName] = useState('');
  const [msg, setMsg]  = useState('');
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    api.get('/customizer/frames').then(r => { setFrames(r.data.frames); setFrame(r.data.frames[0] || null); }).catch(() => {});
    PART_SECTIONS.forEach(s => {
      api.get('/customizer/components', { params: { type: s.type } })
        .then(r => setParts(p => ({ ...p, [s.type]: r.data.components })))
        .catch(() => {});
    });
  }, []);

  const compat = useMemo(() => checkCompatibility({ frame, fork: picks.fork, wheel: picks.wheel }), [frame, picks.fork, picks.wheel]);
  const total = [frame, ...Object.values(picks)].reduce((s, p) => s + Number(p?.price || 0), 0);

  const save = async () => {
    if (!user) return navigate('/login');
    if (!compat.compatible) return;
    setSaving(true); setMsg('');
    try {
      await api.post('/customizer/builds', {
        name: buildName || `${frame?.name} Custom Build`,
        frameId: frame?.id, forkId: picks.fork?.id, wheelId: picks.wheel?.id,
        handlebarId: picks.handlebar?.id, drivetrainId: picks.drivetrain?.id,
      });
      setMsg('✅ Build saved! View it in your dashboard.');
    } catch (err) { setMsg(`❌ ${err.response?.data?.message || 'Could not save build'}`); }
    finally { setSaving(false); }
  };

  const STEPS = ['1. Frame', ...PART_SECTIONS.map(s => s.label)];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-ink-500 to-ink py-14 text-white">
        <div className="section-sm">
          <Reveal>
            <p className="eyebrow text-amber">Bike customizer</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">Build your perfect bike</h1>
            <p className="mt-3 max-w-xl text-white/65">
              Select a frame, add components, and our compatibility engine checks mechanical fit in real time — {TOLERANCE_MM}mm headtube tolerance, exact wheel-size matching.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="section">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Left: step-by-step selector */}
          <div className="lg:col-span-2 space-y-10">
            {/* Step tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {STEPS.map((s, i) => (
                <button key={s} onClick={() => setActiveSection(i)}
                  className={`btn-tab whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold shrink-0 ${activeSection === i ? 'bg-forest text-white' : 'bg-sand-100 text-ink-400 dark:bg-white/10 dark:text-white/60'}`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Frame selection */}
            {activeSection === 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold mb-5">Choose a frame</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
                  {frames.map(f => (
                    <PartCard key={f.id} part={f} selected={frame} onSelect={setFrame}
                      renderSpec={f => `Headtube ${f.headtubeDiameter}mm · Wheel ${f.wheelSize}`} />
                  ))}
                </div>
              </div>
            )}

            {/* Component sections */}
            {PART_SECTIONS.map((s, i) => activeSection === i + 1 && (
              <div key={s.key}>
                <h2 className="font-display text-lg font-semibold mb-5">{s.label} <span className="text-sm font-normal text-ink-400">(optional)</span></h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
                  <button onClick={() => setPicks(p => ({ ...p, [s.key]: null }))}
                    className={`card flex flex-col items-center justify-center gap-2 py-8 ${!picks[s.key] ? 'ring-2 ring-forest dark:ring-amber' : 'card-hover'}`}>
                    <span className="text-3xl opacity-30">—</span>
                    <span className="text-sm font-semibold text-ink-400">None / skip</span>
                  </button>
                  {(parts[s.type] || []).map(p => (
                    <PartCard key={p.id} part={p} selected={picks[s.key]}
                      onSelect={v => setPicks(prev => ({ ...prev, [s.key]: v }))}
                      renderSpec={s.spec} />
                  ))}
                </div>
              </div>
            ))}

            {/* Step navigation */}
            <div className="flex justify-between pt-4 border-t border-ink-100 dark:border-white/10">
              {activeSection > 0
                ? <button onClick={() => setActiveSection(a => a-1)} className="btn-secondary">← Previous</button>
                : <div />}
              {activeSection < STEPS.length - 1
                ? <button onClick={() => setActiveSection(a => a+1)} className="btn-primary">Next →</button>
                : <div />}
            </div>
          </div>

          {/* Right: sticky build summary */}
          <div className="h-fit lg:sticky lg:top-24">
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold">Your build</h2>

              {/* Part list */}
              <div className="mt-5 space-y-2 text-sm">
                {[
                  ['Frame', frame],
                  ...PART_SECTIONS.map(s => [s.label.replace(/^\d+\. /, ''), picks[s.key]])
                ].map(([label, part]) => (
                  <div key={label} className="flex items-start justify-between gap-2 border-b border-ink-100 pb-2 dark:border-white/8">
                    <span className="text-ink-400 dark:text-white/50 shrink-0">{label}</span>
                    <span className="font-medium text-right truncate max-w-[55%]">{part ? part.name : <span className="text-ink-300 dark:text-white/25">—</span>}</span>
                  </div>
                ))}
              </div>

              {/* Compatibility checks */}
              {compat.checks.length > 0 && (
                <div className="mt-5 space-y-2">
                  {compat.checks.map(c => (
                    <div key={c.label} className={`rounded-xl p-3 text-xs font-medium ${c.ok ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {c.ok ? '✓' : '✕'} {c.label}: {c.detail}
                    </div>
                  ))}
                </div>
              )}

              {!compat.compatible && (
                <div className="mt-4 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  ⚠️ This build has incompatible parts. Swap the fork or wheelset before saving.
                </div>
              )}

              {/* Total */}
              <div className="mt-5 flex justify-between border-t border-ink-100 pt-4 dark:border-white/10">
                <span className="font-semibold">Build total</span>
                <span className="font-display text-lg font-bold text-forest dark:text-amber">KES {total.toLocaleString()}</span>
              </div>

              <input className="input mt-4 text-sm" placeholder="Name this build (optional)"
                value={buildName} onChange={e => setBuildName(e.target.value)} />

              {msg && <p className={`mt-3 text-xs font-medium ${msg.startsWith('✅') ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{msg}</p>}

              <button onClick={save} disabled={!frame || !compat.compatible || saving}
                className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : user ? '💾 Save this build' : 'Sign in to save'}
              </button>

              {!user && (
                <Link to="/login" className="btn-secondary mt-3 w-full justify-center text-sm">Sign in →</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
