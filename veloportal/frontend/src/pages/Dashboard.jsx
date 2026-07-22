import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ReceiptModal from '../components/ReceiptModal';
import Reveal from '../components/Reveal';

const TABS = ['Overview', 'Orders', 'Rentals', 'Repairs', 'Events', 'Builds', 'Profile', 'Settings'];

export default function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]   = useState('Overview');
  const [data, setData] = useState(null);
  const [builds, setBuilds] = useState([]);
  const [profile, setProfile] = useState({ name: user?.name||'', phone: user?.phone||'', regNumber: user?.regNumber||'', email: user?.email||'', avatarUrl: user?.avatarUrl||'' });
  const [pwd, setPwd]         = useState({ currentPassword: '', newPassword: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwdMsg, setPwdMsg]         = useState('');
  const [retryPhone, setRetryPhone] = useState('');
  const [receiptRecord, setReceiptRecord] = useState(null);
  const [receiptKind, setReceiptKind]     = useState('order');
  const [payingPenalty, setPayingPenalty] = useState(false);

  const loadDash = () => { api.get('/users/dashboard').then(r => setData(r.data)).catch(() => {}); };
  useEffect(() => { loadDash(); }, []);
  useEffect(() => { if (tab === 'Builds') api.get('/customizer/builds/mine').then(r => setBuilds(r.data.builds)).catch(() => {}); }, [tab]);

  // Heartbeat so admin can see online status
  useEffect(() => {
    const hb = setInterval(() => api.put('/users/heartbeat').catch(() => {}), 60000);
    api.put('/users/heartbeat').catch(() => {});
    return () => clearInterval(hb);
  }, []);

  const openReceipt = async (kind, id) => {
    const path = kind === 'order' ? 'orders' : kind === 'event' ? 'events/registrations' : 'rentals';
    const { data } = await api.get(`/${path}/${id}`);
    setReceiptKind(kind);
    setReceiptRecord(kind === 'order' ? data.order : kind === 'event' ? data.registration : data.rental);
  };

  const removeBuild = async id => { await api.delete(`/customizer/builds/${id}`); setBuilds(b => b.filter(x => x.id !== id)); };

  const saveProfile = async e => {
    e.preventDefault();
    const { data } = await api.put('/auth/me', profile);
    setUser(data.user);
    setProfileMsg('✅ Profile updated');
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const changePassword = async e => {
    e.preventDefault();
    try {
      await api.put('/auth/change-password', pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      setPwdMsg('✅ Password changed successfully');
    } catch (err) { setPwdMsg(`❌ ${err.response?.data?.message || 'Failed'}`); }
    setTimeout(() => setPwdMsg(''), 4000);
  };

  const deactivate = async () => {
    if (!confirm('Deactivate your account? An admin can reactivate it later.')) return;
    await api.delete('/auth/me');
    logout(); navigate('/');
  };

  const retryOrder  = async id => { const ph = retryPhone||user.phone; if(!ph) return; await api.post(`/orders/${id}/retry-payment`,{phone:ph}); alert('M-Pesa prompt sent!'); loadDash(); };
  const retryRental = async id => { const ph = retryPhone||user.phone; if(!ph) return; await api.post(`/rentals/${id}/retry-payment`,{phone:ph}); alert('M-Pesa prompt sent!'); loadDash(); };
  const retryEvent  = async id => { const ph = retryPhone||user.phone; if(!ph) return; await api.post(`/events/registrations/${id}/retry-payment`,{phone:ph}); alert('M-Pesa prompt sent!'); loadDash(); };
  const payPenalty  = async () => {
    const ph = retryPhone||user.phone;
    setPayingPenalty(true);
    try { await api.post(`/rentals/${receiptRecord.id}/pay-penalty`,{phone:ph}); alert('M-Pesa penalty prompt sent!'); }
    catch(err) { alert(err.response?.data?.message||'Failed'); }
    finally { setPayingPenalty(false); }
  };

  const STATUS_BADGE = {
    pending_payment: 'badge-warning', paid: 'badge-success', processing: 'badge-forest',
    shipped: 'badge-forest', completed: 'badge-success', cancelled: 'badge-danger',
    pending: 'badge-warning', confirmed: 'badge-forest', active: 'badge-forest',
    booked: 'badge-warning', in_progress: 'badge-forest',
    registered: 'badge-success', attended: 'badge-forest',
  };

  return (
    <div className="section">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Hi, {user.name.split(' ')[0]} 👋</h1>
            <p className="mt-1 text-sm text-ink-400 dark:text-white/50 capitalize">Role: <span className="font-semibold text-forest dark:text-amber">{user.role}</span></p>
          </div>
          {user.avatarUrl && <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover shadow-card" />}
        </div>
      </Reveal>

      {/* Tabs */}
      <div className="mt-8 flex gap-1.5 overflow-x-auto border-b border-ink-100 pb-0.5 dark:border-white/10">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`btn-tab shrink-0 rounded-t-xl rounded-b-none border-b-2 px-4 py-2.5 text-sm ${tab===t ? 'border-forest bg-forest/5 font-bold text-forest dark:border-amber dark:bg-amber/10 dark:text-amber' : 'border-transparent text-ink-400 hover:text-forest dark:text-white/50 dark:hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {!data && tab !== 'Profile' && tab !== 'Settings' ? (
        <div className="mt-12 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-forest border-t-transparent" />
        </div>
      ) : (
        <div className="mt-8">

          {/* Overview */}
          {tab === 'Overview' && data && (
            <div className="grid gap-4 stagger sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon:'🛒', label:'Recent orders',    value: data.orders.length,        to:'Orders' },
                { icon:'🚲', label:'Active rentals',   value: data.rentals.length,        to:'Rentals' },
                { icon:'⚙️', label:'Repair bookings',  value: data.repairBookings.length, to:'Repairs' },
                { icon:'🤍', label:'Wishlist items',   value: data.wishlistCount,          to:'Profile' },
              ].map(s => (
                <button key={s.label} onClick={() => setTab(s.to)} className="card card-hover p-6 text-left">
                  <p className="text-3xl">{s.icon}</p>
                  <p className="mt-4 font-display text-4xl font-bold text-forest dark:text-amber">{s.value}</p>
                  <p className="mt-1 text-sm text-ink-400 dark:text-white/50">{s.label}</p>
                </button>
              ))}
            </div>
          )}

          {/* Orders */}
          {tab === 'Orders' && data && (
            <div className="space-y-3">
              {data.orders.length === 0 && <p className="py-10 text-center text-ink-400">No orders yet. <a href="/shop" className="font-semibold text-forest dark:text-amber">Browse the shop →</a></p>}
              {data.orders.map(o => (
                <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-5 animate-rise">
                  <div>
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-xs text-ink-400 dark:text-white/40">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">KES {Number(o.totalAmount).toLocaleString()}</p>
                    <span className={`badge capitalize ${STATUS_BADGE[o.status]||'badge-ink'}`}>{o.status.replace('_',' ')}</span>
                    {o.status === 'pending_payment' && <button onClick={() => retryOrder(o.id)} className="btn-amber !px-3 !py-1 text-xs">Retry M-Pesa</button>}
                    <button onClick={() => openReceipt('order', o.id)} className="btn-ghost !px-3 !py-1 text-xs">Receipt</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rentals */}
          {tab === 'Rentals' && data && (
            <div className="space-y-3">
              {data.rentals.length === 0 && <p className="py-10 text-center text-ink-400">No rentals yet. <a href="/rentals" className="font-semibold text-forest dark:text-amber">Browse rental fleet →</a></p>}
              {data.rentals.map(r => (
                <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-5 animate-rise">
                  <div>
                    <p className="font-semibold">{r.Bicycle?.name}</p>
                    <p className="text-xs text-ink-400 dark:text-white/40">{new Date(r.startDate).toLocaleString()} → {new Date(r.endDate).toLocaleString()}</p>
                    {r.lateFeeStatus === 'unpaid' && <p className="mt-1 text-xs font-semibold text-red-600">Late fee: KES {Number(r.lateFee).toLocaleString()} owed</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">KES {Number(r.totalCost).toLocaleString()}</p>
                    <span className={`badge capitalize ${STATUS_BADGE[r.status]||'badge-ink'}`}>{r.status}</span>
                    {r.status === 'pending' && <button onClick={() => retryRental(r.id)} className="btn-amber !px-3 !py-1 text-xs">Retry M-Pesa</button>}
                    <button onClick={() => openReceipt('rental', r.id)} className="btn-ghost !px-3 !py-1 text-xs">Receipt</button>
                  </div>
                </div>
              ))}
              {data.rentals.some(r => r.status === 'pending') && (
                <input className="input mt-2 max-w-xs text-sm" placeholder="Override phone for M-Pesa retry"
                  value={retryPhone} onChange={e => setRetryPhone(e.target.value)} />
              )}
            </div>
          )}

          {/* Repairs */}
          {tab === 'Repairs' && data && (
            <div className="space-y-3">
              {data.repairBookings.length === 0 && <p className="py-10 text-center text-ink-400">No repairs yet. <a href="/repair" className="font-semibold text-forest dark:text-amber">Book a repair →</a></p>}
              {data.repairBookings.map(b => (
                <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-5 animate-rise">
                  <div>
                    <p className="font-semibold">{b.RepairService?.name}</p>
                    <p className="text-xs text-ink-400 dark:text-white/40">{b.bicycleDescription} · {new Date(b.scheduledDate).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">KES {Number(b.totalCost).toLocaleString()}</p>
                    <span className={`badge capitalize ${STATUS_BADGE[b.status]||'badge-ink'}`}>{b.status.replace('_',' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Events */}
          {tab === 'Events' && data && (
            <div className="space-y-3">
              {data.eventRegistrations.length === 0 && <p className="py-10 text-center text-ink-400">No event registrations. <a href="/events" className="font-semibold text-forest dark:text-amber">Browse events →</a></p>}
              {data.eventRegistrations.map(r => (
                <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-5 animate-rise">
                  <div>
                    <p className="font-semibold">{r.Event?.title}</p>
                    <p className="text-xs text-ink-400 dark:text-white/40">{r.ticketCode} · {new Date(r.Event?.date).toDateString()}</p>
                    {r.paymentMethod === 'cash' && <p className="mt-1 text-xs font-semibold text-amber-dark">💵 Pay KES {Number(r.Event?.price).toLocaleString()} in cash at the event</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge capitalize ${STATUS_BADGE[r.status]||'badge-ink'}`}>{r.status}</span>
                    {r.paymentMethod === 'mpesa' && r.paymentStatus === 'pending' && (
                      <button onClick={() => retryEvent(r.id)} className="btn-amber !px-3 !py-1 text-xs">Retry M-Pesa</button>
                    )}
                    <button onClick={() => openReceipt('event', r.id)} className="btn-ghost !px-3 !py-1 text-xs">Receipt</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Builds */}
          {tab === 'Builds' && (
            <div className="space-y-3">
              {builds.length === 0 && <p className="py-10 text-center text-ink-400">No saved builds. <a href="/customize" className="font-semibold text-forest dark:text-amber">Open bike customizer →</a></p>}
              {builds.map(b => (
                <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-5 animate-rise">
                  <div>
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-xs text-ink-400 dark:text-white/40">{b.Frame?.name}{b.Fork?` + ${b.Fork.name}`:''}{b.Wheel?` + ${b.Wheel.name}`:''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-forest dark:text-amber">KES {Number(b.totalCost).toLocaleString()}</p>
                    <button onClick={() => removeBuild(b.id)} className="btn-danger-hover text-xs">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Profile */}
          {tab === 'Profile' && (
            <div className="grid gap-8 lg:grid-cols-2">
              <form onSubmit={saveProfile} className="card p-6 space-y-4">
                <h2 className="font-display text-lg font-bold">Account details</h2>
                {[
                  { label:'Full name', key:'name', type:'text', required:true },
                  { label:'Email address', key:'email', type:'email', required:true },
                  { label:'Phone (M-Pesa)', key:'phone', type:'tel', placeholder:'07XXXXXXXX' },
                  { label:'Student reg. number', key:'regNumber', placeholder:'e.g. 25/01220' },
                  { label:'Profile photo URL', key:'avatarUrl', placeholder:'https://…' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    <input type={f.type||'text'} required={f.required} className="input"
                      value={profile[f.key]} placeholder={f.placeholder||''}
                      onChange={e => setProfile(p => ({...p, [f.key]: e.target.value}))} />
                  </div>
                ))}
                {profileMsg && <p className="text-sm font-medium text-green-700 dark:text-green-400">{profileMsg}</p>}
                <button className="btn-primary">Save profile</button>
              </form>

              <div className="space-y-6">
                <form onSubmit={changePassword} className="card p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold">Change password</h2>
                  <div>
                    <label className="label">Current password</label>
                    <input required type="password" className="input" value={pwd.currentPassword}
                      onChange={e => setPwd(p => ({...p, currentPassword: e.target.value}))} />
                  </div>
                  <div>
                    <label className="label">New password (min. 6 characters)</label>
                    <input required type="password" minLength={6} className="input" value={pwd.newPassword}
                      onChange={e => setPwd(p => ({...p, newPassword: e.target.value}))} />
                  </div>
                  {pwdMsg && <p className={`text-sm font-medium ${pwdMsg.startsWith('✅') ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{pwdMsg}</p>}
                  <button className="btn-secondary">Update password</button>
                </form>

                <div className="card border-red-100 p-6 dark:border-red-900/20">
                  <h2 className="font-display text-lg font-bold text-red-600">Danger zone</h2>
                  <p className="mt-2 text-sm text-ink-400 dark:text-white/50">Deactivating your account signs you out and hides your profile. An admin can reactivate it later — your order and payment history is preserved.</p>
                  <button onClick={deactivate} className="btn-danger mt-4 !bg-transparent !text-red-600 border border-red-200 hover:!bg-red-50 dark:border-red-900/30 dark:!text-red-400 dark:hover:!bg-red-900/10">
                    Deactivate my account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {tab === 'Settings' && (
            <div className="max-w-lg space-y-6">
              <div className="card p-6">
                <h2 className="font-display text-lg font-bold">Notifications</h2>
                <p className="mt-2 text-sm text-ink-400 dark:text-white/50">Email notification preferences are managed by updating your email address in the Profile tab. Order confirmations, rental receipts, and welcome emails are sent automatically.</p>
              </div>
              <div className="card p-6">
                <h2 className="font-display text-lg font-bold">Account role</h2>
                <p className="mt-2 text-sm text-ink-400 dark:text-white/50">Your current role: <span className="font-semibold capitalize text-forest dark:text-amber">{user.role}</span>. Contact an admin to request a role change (e.g. mechanic or staff access).</p>
              </div>
              <div className="card p-6">
                <h2 className="font-display text-lg font-bold">Privacy</h2>
                <p className="mt-2 text-sm text-ink-400 dark:text-white/50">Your data is stored securely and never sold to third parties. Passwords are hashed with bcrypt — we cannot read your password. Contact <a href="mailto:hello@veloportal.app" className="font-semibold text-forest dark:text-amber">hello@veloportal.app</a> to request data deletion.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Receipt modal */}
      <ReceiptModal open={!!receiptRecord} onClose={() => setReceiptRecord(null)}
        kind={receiptKind} record={receiptRecord} />
      {receiptRecord?.lateFeeStatus === 'unpaid' && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 print:hidden">
          <div className="card flex flex-wrap items-center gap-4 p-4 shadow-modal">
            <p className="text-sm font-semibold text-red-600">Late fee: KES {Number(receiptRecord.lateFee).toLocaleString()} unpaid</p>
            <input className="input !w-44 text-xs" placeholder="Phone for M-Pesa" value={retryPhone} onChange={e => setRetryPhone(e.target.value)} />
            <button onClick={payPenalty} disabled={payingPenalty} className="btn-amber !px-4 !py-2 text-xs disabled:opacity-50">
              {payingPenalty ? '⏳ Sending…' : '📱 Pay penalty via M-Pesa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
