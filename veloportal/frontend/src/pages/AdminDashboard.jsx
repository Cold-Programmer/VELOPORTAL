import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const ALL_TABS = [
  { key: 'Overview', roles: ['admin', 'staff', 'mechanic'] },
  { key: 'Bicycles', roles: ['admin', 'staff'] },
  { key: 'Components', roles: ['admin', 'staff'] },
  { key: 'Orders', roles: ['admin', 'staff'] },
  { key: 'Rentals', roles: ['admin', 'staff'] },
  { key: 'Repairs', roles: ['admin', 'staff', 'mechanic'] },
  { key: 'Events', roles: ['admin', 'staff'] },
  { key: 'Users', roles: ['admin'] },
  { key: 'Community', roles: ['admin', 'staff'] },
  { key: 'Payments', roles: ['admin'] },
];

const PRODUCT_TYPE_OPTIONS = [
  { value: 'bicycle', label: '🚲 Bicycle' },
  { value: 'accessory', label: '🛡️ Accessory' },
  { value: 'equipment', label: '🔧 Equipment' },
];

function ProductForm({ categories, initial, onSaved, onCancel }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial ? {
    name: initial.name || '', brand: initial.brand || '', categoryId: initial.categoryId || '',
    productType: initial.productType || 'bicycle', price: initial.price || '',
    rentalPricePerHour: initial.rentalPricePerHour || '', stock: initial.stock ?? 5,
    forSale: initial.forSale ?? true, forRent: initial.forRent ?? false,
    frameSize: initial.frameSize || 'M', wheelSize: initial.wheelSize || '26"',
    headtubeDiameter: initial.headtubeDiameter || 34, description: initial.description || '',
    images: initial.images?.length ? initial.images : [''],
  } : {
    name: '', brand: '', categoryId: '', productType: 'bicycle', price: '', rentalPricePerHour: '', stock: 5,
    forSale: true, forRent: false, frameSize: 'M', wheelSize: '26"', headtubeDiameter: 34,
    description: '', images: [''],
  });
  const isBicycle = form.productType === 'bicycle';

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, images: [form.images[0] || `https://placehold.co/640x480/16382A/FAFAF8?text=${encodeURIComponent(form.name)}`] };
    if (isEdit) await api.put(`/admin/bicycles/${initial.id}`, payload);
    else await api.post('/admin/bicycles', payload);
    onSaved();
  };

  return (
    <form onSubmit={submit} className="card grid gap-3 p-6 sm:grid-cols-2 animate-rise">
      <h3 className="sm:col-span-2 font-display font-semibold">{isEdit ? `Editing: ${initial.name}` : 'Add a new item'}</h3>

      {/* Product type selector */}
      <div className="sm:col-span-2 flex gap-2">
        {PRODUCT_TYPE_OPTIONS.map(o => (
          <button key={o.value} type="button" onClick={() => setForm({ ...form, productType: o.value })}
            className={`btn-tab !px-4 !py-2 text-sm ${form.productType === o.value ? 'bg-forest text-white' : 'bg-sand-100 text-ink-400 dark:bg-white/10 dark:text-white/60'}`}>
            {o.label}
          </button>
        ))}
      </div>

      <input required placeholder="Name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input required placeholder="Brand" className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
      <select required className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
        <option value="">Category…</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input required type="number" placeholder="Price (KES)" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      <input type="number" placeholder="Stock" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />

      {isBicycle && (
        <>
          <input type="number" placeholder="Rental price / hr" className="input" value={form.rentalPricePerHour} onChange={(e) => setForm({ ...form, rentalPricePerHour: e.target.value })} />
          <input type="number" step="0.01" placeholder="Headtube diameter (mm)" className="input" value={form.headtubeDiameter} onChange={(e) => setForm({ ...form, headtubeDiameter: e.target.value })} />
          <input placeholder='Wheel size (e.g. 29")' className="input" value={form.wheelSize} onChange={(e) => setForm({ ...form, wheelSize: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.forRent} onChange={(e) => setForm({ ...form, forRent: e.target.checked })} /> Available for rent</label>
        </>
      )}

      <input placeholder="Image URL (optional — auto-generated if blank)" className="input sm:col-span-2" value={form.images[0]} onChange={(e) => setForm({ ...form, images: [e.target.value] })} />
      <textarea placeholder="Description" className="input sm:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

      <div className="flex gap-3 sm:col-span-2">
        <button className="btn-primary flex-1">{isEdit ? 'Save changes' : 'Add item'}</button>
        {isEdit && <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>}
      </div>
    </form>
  );
}

function AddComponentForm({ initial, onSaved, onCancel }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial ? {
    name: initial.name || '', brand: initial.brand || '', partType: initial.partType || 'fork',
    price: initial.price || '', steererDiameter: initial.steererDiameter || '', wheelSize: initial.wheelSize || '',
    image: initial.image || '',
  } : { name: '', brand: '', partType: 'fork', price: '', steererDiameter: '', wheelSize: '', image: '' });

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, image: form.image || `https://placehold.co/640x480/3A3A38/FAFAF8?text=${encodeURIComponent(form.name)}` };
    if (isEdit) await api.put(`/admin/components/${initial.id}`, payload);
    else await api.post('/admin/components', payload);
    onSaved();
  };
  return (
    <form onSubmit={submit} className="card grid gap-3 p-6 sm:grid-cols-2 animate-rise">
      <h3 className="sm:col-span-2 font-display font-semibold">{isEdit ? `Editing: ${initial.name}` : 'Add a new part'}</h3>
      <input required placeholder="Name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input required placeholder="Brand" className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
      <select className="input" value={form.partType} onChange={(e) => setForm({ ...form, partType: e.target.value })}>
        {['fork', 'wheel', 'handlebar', 'drivetrain'].map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input required type="number" placeholder="Price (KES)" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      {form.partType === 'fork' && (
        <input type="number" step="0.01" placeholder="Steerer diameter (mm)" className="input" value={form.steererDiameter} onChange={(e) => setForm({ ...form, steererDiameter: e.target.value })} />
      )}
      {form.partType === 'wheel' && (
        <input placeholder='Wheel size (e.g. 29")' className="input" value={form.wheelSize} onChange={(e) => setForm({ ...form, wheelSize: e.target.value })} />
      )}
      <input placeholder="Image URL (optional — auto-generated if blank)" className="input sm:col-span-2" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
      <div className="flex gap-3 sm:col-span-2">
        <button className="btn-primary flex-1">{isEdit ? 'Save changes' : 'Add component'}</button>
        {isEdit && <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>}
      </div>
    </form>
  );
}

function EventForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial || {
    title: '', description: '', date: '', location: '', capacity: 50, price: 0, imageUrl: '',
  });
  const isEdit = !!initial?.id;
  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, imageUrl: form.imageUrl || `https://placehold.co/640x480/16382A/E8A33D?text=${encodeURIComponent(form.title)}` };
    if (isEdit) await api.put(`/events/${initial.id}`, payload);
    else await api.post('/events', payload);
    onSaved();
  };
  return (
    <form onSubmit={submit} className="card grid gap-3 p-6 sm:grid-cols-2 animate-rise">
      <input required placeholder="Title" className="input sm:col-span-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <input required type="datetime-local" className="input" value={form.date?.slice(0, 16) || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      <input required placeholder="Location" className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <input type="number" placeholder="Capacity" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
      <input type="number" placeholder="Price (KES, 0 = free)" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      <input placeholder="Image URL (optional — auto-generated if blank)" className="input sm:col-span-2" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
      <textarea placeholder="Description" className="input sm:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="flex gap-3 sm:col-span-2">
        <button className="btn-primary flex-1">{isEdit ? 'Save changes' : 'Create event'}</button>
        {isEdit && <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>}
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const tabs = ALL_TABS.filter((t) => t.roles.includes(user.role));
  const [tab, setTab] = useState(tabs[0]?.key || 'Overview');
  const [overview, setOverview] = useState(null);
  const [bicycles, setBicycles] = useState([]);
  const [components, setComponents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [repairBookings, setRepairBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingComponent, setEditingComponent] = useState(null);
  const [restockAmounts, setRestockAmounts] = useState({});
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [payments, setPayments] = useState([]);

  const isAdmin = user.role === 'admin';
  const isStaff = user.role === 'staff' || isAdmin;
  const isMechanic = user.role === 'mechanic' || isAdmin;

  const loadAll = () => {
    if (isAdmin) api.get('/admin/overview').then((r) => setOverview({ ...r.data, roleView: 'financial' }));
    else if (isStaff || isMechanic) api.get('/admin/ops-summary').then((r) => setOverview({ ...r.data, roleView: 'ops' }));
    api.get('/products/categories').then((r) => setCategories(r.data.categories));
    if (isStaff) {
      api.get('/products', { params: { limit: 50 } }).then((r) => setBicycles(r.data.items));
      api.get('/admin/components').then((r) => setComponents(r.data.components));
      api.get('/admin/orders').then((r) => setOrders(r.data.orders));
      api.get('/admin/rentals').then((r) => setRentals(r.data.rentals));
      api.get('/events').then((r) => setEvents(r.data.events));
      api.get('/admin/community/posts').then((r) => setPosts(r.data.posts));
    }
    if (isMechanic) api.get('/repairs/bookings').then((r) => setRepairBookings(r.data.bookings));
    if (isAdmin) {
      api.get('/admin/users').then((r) => setUsers(r.data.users));
      api.get('/admin/payments').then((r) => setPayments(r.data.payments));
    }
  };
  useEffect(loadAll, [user.role]);

  const updateOrderStatus = async (id, status) => { await api.put(`/orders/${id}/status`, { status }); loadAll(); };
  const updateRentalStatus = async (id, status) => { await api.put(`/rentals/${id}/status`, { status }); loadAll(); };
  const checkinRental = async (id) => { await api.put(`/rentals/${id}/checkin`, {}); loadAll(); };
  const updateRepairStatus = async (id, status) => { await api.put(`/repairs/bookings/${id}/status`, { status }); loadAll(); };
  const deleteBicycle = async (id) => { await api.delete(`/admin/bicycles/${id}`); loadAll(); };
  const restockProduct = async (id) => {
    const qty = Number(restockAmounts[id]);
    if (!qty || qty <= 0) return;
    await api.put(`/admin/bicycles/${id}/restock`, { quantity: qty });
    setRestockAmounts(r => ({ ...r, [id]: '' }));
    loadAll();
  };
  const deleteComponent = async (id) => { await api.delete(`/admin/components/${id}`); loadAll(); };
  const deletePost = async (id) => { await api.delete(`/admin/community/posts/${id}`); loadAll(); };
  const updateUserRole = async (id, role) => { await api.put(`/admin/users/${id}/role`, { role }); loadAll(); };
  const deleteEvent = async (id) => { if (confirm('Delete this event?')) { await api.delete(`/events/${id}`); loadAll(); } };

  return (
    <div className="section">
      <p className="eyebrow">{isAdmin ? 'Super admin' : isStaff ? 'Shop staff' : 'Mechanic'}</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Operations console</h1>
      <p className="mt-1 text-sm text-ink/50">Signed in as {user.name} · role: <span className="font-semibold capitalize text-forest">{user.role}</span></p>

      <div className="mt-8 flex gap-2 overflow-x-auto border-b border-black/10 pb-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`btn-tab whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? 'bg-forest text-white' : 'text-ink/60 hover:bg-black/5'}`}>
            {t.key}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'Overview' && overview && (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(
              overview.roleView === 'financial'
                ? { 'Users': overview.userCount, 'Bicycles': overview.bikeCount, 'Orders': overview.orderCount, 'Rentals': overview.rentalCount, 'Repairs': overview.repairCount, 'Revenue (KES)': Math.round(overview.totalRevenue).toLocaleString() }
                : { 'Bicycles': overview.bikeCount, 'Orders': overview.orderCount, 'Rentals': overview.rentalCount, 'Repairs': overview.repairCount, 'Events': overview.eventCount }
            ).map(([k, v]) => (
              <div key={k} className="card animate-rise p-5"><p className="text-2xl font-bold text-forest">{v}</p><p className="text-xs text-ink/60">{k}</p></div>
            ))}
          </div>
        )}

        {tab === 'Bicycles' && isStaff && (
          <div>
            <ProductForm
              key={editingProduct?.id || 'new-product'}
              categories={categories}
              initial={editingProduct}
              onSaved={() => { setEditingProduct(null); loadAll(); }}
              onCancel={() => setEditingProduct(null)}
            />
            <div className="mt-6 space-y-2">
              {bicycles.map((b) => {
                const isLow = b.stock > 0 && b.stock <= (b.lowStockThreshold ?? 5);
                const isOut = b.stock === 0;
                return (
                  <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 animate-rise">
                    <div className="flex items-center gap-3">
                      <img src={b.images?.[0]} alt="" className="h-12 w-16 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold">
                          {b.name}{' '}
                          <span className="badge badge-ink capitalize ml-1">{b.productType || 'bicycle'}</span>
                        </p>
                        <p className="text-sm text-ink-400 dark:text-white/50">
                          {b.Category?.name} · KES {Number(b.price).toLocaleString()} ·{' '}
                          <span className={isOut ? 'font-semibold text-red-600' : isLow ? 'font-semibold text-amber-dark' : ''}>
                            Stock {b.stock}{isOut ? ' (out!)' : isLow ? ' (low)' : ''}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" placeholder="+ qty" className="input !w-20 text-xs"
                        value={restockAmounts[b.id] || ''} onChange={e => setRestockAmounts(r => ({ ...r, [b.id]: e.target.value }))} />
                      <button onClick={() => restockProduct(b.id)} className="btn-amber !px-3 !py-1.5 text-xs">Restock</button>
                      <button onClick={() => setEditingProduct(b)} className="btn-tab text-sm font-semibold text-forest hover:underline dark:text-amber">Edit</button>
                      <button onClick={() => deleteBicycle(b.id)} className="btn-danger-hover text-sm text-red-600">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'Components' && isStaff && (
          <div>
            <AddComponentForm
              key={editingComponent?.id || 'new-component'}
              initial={editingComponent}
              onSaved={() => { setEditingComponent(null); loadAll(); }}
              onCancel={() => setEditingComponent(null)}
            />
            <div className="mt-6 space-y-2">
              {components.map((c) => (
                <div key={c.id} className="card flex items-center justify-between p-4 animate-rise">
                  <div className="flex items-center gap-3">
                    <img src={c.image} alt="" className="h-12 w-16 rounded-lg object-cover" />
                    <div><p className="font-semibold">{c.name}</p><p className="text-sm text-ink-400 dark:text-white/50 capitalize">{c.partType} · {c.brand} · KES {Number(c.price).toLocaleString()}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingComponent(c)} className="btn-tab text-sm font-semibold text-forest hover:underline dark:text-amber">Edit</button>
                    <button onClick={() => deleteComponent(c.id)} className="btn-danger-hover text-sm text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Orders' && isStaff && (
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="card flex items-center justify-between p-4 animate-rise">
                <div><p className="font-semibold">{o.orderNumber}</p><p className="text-sm text-ink/60">KES {Number(o.totalAmount).toLocaleString()}</p></div>
                <select className="input w-44" value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)}>
                  {['pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {tab === 'Rentals' && isStaff && (
          <div className="space-y-2">
            {rentals.map((r) => (
              <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 animate-rise">
                <div>
                  <p className="font-semibold">{r.Bicycle?.name}</p>
                  <p className="text-sm text-ink/60">KES {Number(r.totalCost).toLocaleString()} · due {new Date(r.endDate).toLocaleString()}</p>
                  {r.lateFeeStatus !== 'none' && (
                    <p className="text-xs font-semibold text-red-600">Late {Number(r.lateHours)}h · penalty KES {Number(r.lateFee).toLocaleString()} ({r.lateFeeStatus})</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select className="input w-40" value={r.status} onChange={(e) => updateRentalStatus(r.id, e.target.value)}>
                    {['pending', 'confirmed', 'active', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {['confirmed', 'active'].includes(r.status) && (
                    <button onClick={() => checkinRental(r.id)} className="btn-amber !px-3 !py-1.5 text-xs">Check in now</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Repairs' && isMechanic && (
          <div className="space-y-2">
            {repairBookings.map((b) => (
              <div key={b.id} className="card flex items-center justify-between p-4 animate-rise">
                <div><p className="font-semibold">{b.RepairService?.name}</p><p className="text-sm text-ink/60">{b.bicycleDescription}</p></div>
                <select className="input w-44" value={b.status} onChange={(e) => updateRepairStatus(b.id, e.target.value)}>
                  {['booked', 'in_progress', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {tab === 'Events' && isStaff && (
          <div>
            <EventForm
              key={editingEvent?.id || 'new'}
              initial={editingEvent}
              onSaved={() => { setEditingEvent(null); loadAll(); }}
              onCancel={() => setEditingEvent(null)}
            />
            <div className="mt-6 space-y-2">
              {events.map((e) => (
                <div key={e.id} className="card flex items-center justify-between p-4 animate-rise">
                  <div className="flex items-center gap-3">
                    <img src={e.imageUrl} alt="" className="h-12 w-16 rounded-lg object-cover" />
                    <div><p className="font-semibold">{e.title}</p><p className="text-sm text-ink/60">{new Date(e.date).toDateString()} · {e.location}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingEvent(e)} className="btn-tab text-sm font-semibold text-forest hover:underline">Edit</button>
                    <button onClick={() => deleteEvent(e.id)} className="btn-danger-hover text-sm text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Users' && isAdmin && (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="card flex items-center justify-between p-4 animate-rise">
                <div><p className="font-semibold">{u.name}</p><p className="text-sm text-ink/60">{u.email}</p></div>
                <select className="input w-40" value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)} disabled={u.id === user.id}>
                  {['customer', 'mechanic', 'staff', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {tab === 'Community' && isStaff && (
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p.id} className="card flex items-center justify-between p-4 animate-rise">
                <p className="text-sm">{p.content}</p>
                <button onClick={() => deletePost(p.id)} className="btn-danger-hover text-sm text-red-600">Remove</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'Payments' && isAdmin && (
          <div className="space-y-2">
            {payments.length === 0 && <p className="text-sm text-ink/50">No payment attempts recorded yet.</p>}
            {payments.map((p) => (
              <div key={p.id} className="card flex items-center justify-between p-4 animate-rise">
                <div>
                  <p className="font-semibold capitalize">{p.purpose} · KES {Number(p.amount).toLocaleString()}</p>
                  <p className="text-sm text-ink/60">{p.phone} · {p.mpesaReceiptNumber || 'no receipt yet'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${p.status === 'success' ? 'bg-forest/10 text-forest' : p.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber/20 text-amber-dark'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
