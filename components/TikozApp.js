'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { PRICE_LIST, EXPENSE_CATS, STATUSES, STATUS_COLORS } from '@/lib/prices'

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const today = () => new Date().toISOString().slice(0, 10)

function sendWhatsApp(order, vendor) {
  const items = (order.lines || []).map(l => `${l.qty}${l.unit === 'kg' ? 'kg' : 'pc'} ${l.variant} (${l.quality} ${l.size})`).join(', ')
  const msg = `🔔 New Tikoz Order #${order.order_number}\n\nFrom: ${vendor.name} (${vendor.phone})${vendor.business_name ? '\nBusiness: ' + vendor.business_name : ''}\n\nItems: ${items}\nTotal: ${fmt(order.total_amount)}${order.delivery_date ? '\nDelivery: ' + order.delivery_date : ''}${order.notes ? '\nNotes: ' + order.notes : ''}`
  window.open(`https://wa.me/919911910001?text=${encodeURIComponent(msg)}`, '_blank')
}

function sendEmail(order, vendor) {
  const items = (order.lines || []).map(l => `- ${l.qty}${l.unit === 'kg' ? 'kg' : 'pc'} ${l.variant} (${l.quality} ${l.size}) = ${fmt(l.total)}`).join('\n')
  const subject = `New Order #${order.order_number} from ${vendor.name} - ${fmt(order.total_amount)}`
  const body = `New order received on Tikoz:\n\nCustomer: ${vendor.name}\nPhone: ${vendor.phone}${vendor.business_name ? '\nBusiness: ' + vendor.business_name : ''}\n\nItems:\n${items}\n\nTotal: ${fmt(order.total_amount)}${order.delivery_date ? '\nDelivery Date: ' + order.delivery_date : ''}${order.notes ? '\nNotes: ' + order.notes : ''}`
  window.open(`mailto:tikoz.business@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
}

const s = {
  card: { background: 'var(--bg2)', borderRadius: 12, padding: 16, marginBottom: 10, border: '1px solid var(--border)' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14 },
  select: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, appearance: 'none' },
  label: { fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' },
}

function Btn({ children, primary, danger, small, full, disabled, onClick, style: sx }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding: small ? '6px 12px' : '12px 20px', borderRadius: 8, border: primary || danger ? 'none' : '1px solid var(--border)', cursor: disabled ? 'default' : 'pointer', background: danger ? '#B71C1C' : primary ? 'var(--red)' : 'var(--bg2)', color: primary || danger ? '#fff' : 'var(--text)', fontSize: small ? 12 : 14, fontWeight: 600, opacity: disabled ? 0.5 : 1, width: full ? '100%' : 'auto', ...sx }}>{children}</button>
}

function Badge({ children, color = '#C62828' }) {
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: color + '22', color, fontSize: 11, fontWeight: 600 }}>{children}</span>
}

export default function TikozApp() {
  const [screen, setScreen] = useState('landing')
  const [vendor, setVendor] = useState(null)
  return (
    <div style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      {screen === 'landing' && <Landing onVendor={() => setScreen('vendor')} onAdmin={() => setScreen('admin')} />}
      {screen === 'vendor' && <VendorApp vendor={vendor} setVendor={setVendor} onBack={() => { setScreen('landing'); setVendor(null) }} />}
      {screen === 'admin' && <AdminApp onBack={() => setScreen('landing')} />}
    </div>
  )
}

function Landing({ onVendor, onAdmin }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--red)', letterSpacing: -1 }}>Tikoz</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>From freezer to flavours in minutes</div>
      </div>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={onVendor} style={{ padding: '24px', borderRadius: 16, border: '2px solid var(--border)', background: 'var(--bg2)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--text)' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🛒</div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Place an order</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>View prices, order momos, track deliveries</div>
        </button>
        <button onClick={onAdmin} style={{ padding: '24px', borderRadius: 16, border: '2px solid var(--border)', background: 'var(--bg2)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--text)' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>⚙️</div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Admin dashboard</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Manage orders, expenses, P&L</div>
        </button>
      </div>
      <div style={{ marginTop: 48, fontSize: 11, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 }}>Prajwal: 9911910001 · Vaibhav: 9999890012<br />tikoz.business@gmail.com</div>
    </div>
  )
}

function VendorApp({ vendor, setVendor, onBack }) {
  const [tab, setTab] = useState('prices')
  const [phone, setPhone] = useState('')
  const [regName, setRegName] = useState('')
  const [regBiz, setRegBiz] = useState('')
  const [found, setFound] = useState(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (phone.length === 10) {
      setSearching(true)
      supabase.from('vendors').select('*').eq('phone', phone).single().then(({ data }) => { setFound(data || null); setSearching(false) })
    }
  }, [phone])

  const register = async () => {
    if (!regName) return
    const { data } = await supabase.from('vendors').insert({ phone, name: regName, business_name: regBiz || null }).select().single()
    if (data) setVendor(data)
  }

  if (!vendor) {
    return (
      <div style={{ padding: 24, minHeight: '100vh' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', padding: 0, marginBottom: 16 }}>← Back</button>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--red)', marginBottom: 4 }}>Tikoz</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>Enter your phone number to get started</div>
        <div style={{ marginBottom: 12 }}><div style={s.label}>Phone number</div><input style={{ ...s.input, fontSize: 18 }} type="tel" inputMode="numeric" placeholder="e.g. 9876543210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} /></div>
        {phone.length === 10 && searching && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text2)' }}>Looking you up...</div>}
        {phone.length === 10 && !searching && !found && (
          <div style={{ ...s.card, borderColor: 'var(--red)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>New here? Tell us about yourself</div>
            <div style={{ marginBottom: 8 }}><div style={s.label}>Your name *</div><input style={s.input} value={regName} onChange={e => setRegName(e.target.value)} placeholder="e.g. Rahul Kumar" /></div>
            <div style={{ marginBottom: 12 }}><div style={s.label}>Business name (optional)</div><input style={s.input} value={regBiz} onChange={e => setRegBiz(e.target.value)} placeholder="e.g. Rahul's Momo Cart" /></div>
            <Btn primary full onClick={register} disabled={!regName}>Start ordering</Btn>
          </div>
        )}
        {phone.length === 10 && !searching && found && (
          <div style={s.card}><div style={{ fontSize: 16, fontWeight: 700 }}>Welcome back, {found.name}!</div>{found.business_name && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{found.business_name}</div>}<Btn primary full onClick={() => setVendor(found)} style={{ marginTop: 12 }}>Continue</Btn></div>
        )}
      </div>
    )
  }

  const tabs = [{ id: 'prices', label: 'Prices', e: '🏷️' }, { id: 'order', label: 'Order', e: '📝' }, { id: 'history', label: 'Orders', e: '📋' }, { id: 'balance', label: 'Balance', e: '💰' }]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><button onClick={() => { setVendor(null); onBack() }} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button><span style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>Tikoz</span></div>
        <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'right' }}><div style={{ fontWeight: 600, color: 'var(--text)' }}>{vendor.name}</div><div>{vendor.phone}</div></div>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', position: 'sticky', top: 49, background: 'var(--bg)', zIndex: 99 }}>
        {tabs.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer', background: 'transparent', color: tab === t.id ? 'var(--red)' : 'var(--text2)', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', borderBottom: tab === t.id ? '2px solid var(--red)' : '2px solid transparent' }}><span style={{ fontSize: 16 }}>{t.e}</span><br />{t.label}</button>))}
      </div>
      <div style={{ flex: 1, padding: '12px 16px 80px' }}>
        {tab === 'prices' && <VendorPrices />}
        {tab === 'order' && <VendorOrder vendor={vendor} />}
        {tab === 'history' && <VendorHistory vendor={vendor} />}
        {tab === 'balance' && <VendorBalance vendor={vendor} />}
      </div>
    </div>
  )
}

function VendorPrices() {
  const [exp, setExp] = useState(null)
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Price list</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>Per piece rates. Kurkure: +₹2/pc or +₹100/kg extra.</div>
      {Object.entries(PRICE_LIST).map(([q, sizes]) => (
        <div key={q} style={{ ...s.card, cursor: 'pointer' }} onClick={() => setExp(exp === q ? null : q)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontWeight: 700, fontSize: 14, color: 'var(--red)' }}>{q}</div><span style={{ fontSize: 12, color: 'var(--text3)' }}>{exp === q ? '▲' : '▼'}</span></div>
          {exp === q && (<div style={{ marginTop: 12 }}>{Object.entries(sizes).map(([size, variants]) => (<div key={size} style={{ marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>{size}</div>{Object.entries(variants).map(([v, price]) => (<div key={v} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}><span>{v}</span><span style={{ fontWeight: 600 }}>{fmt(price)}{size === 'Per KG' ? '/kg' : '/pc'}</span></div>))}</div>))}</div>)}
        </div>
      ))}
    </div>
  )
}

function VendorOrder({ vendor }) {
  const [form, setForm] = useState({ quality: 'Cart Style', size: 'Medium', variant: 'Veg', qty: '', kurkure: false, customPrice: '', deliveryDate: '', notes: '' })
  const [lines, setLines] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const sizeKeys = Object.keys(PRICE_LIST[form.quality] || {})
  const variantKeys = Object.keys((PRICE_LIST[form.quality] || {})[form.size] || {})
  const isKg = form.size === 'Per KG'
  const basePrice = ((PRICE_LIST[form.quality] || {})[form.size] || {})[form.variant] || 0
  const extra = isKg ? 100 : 2
  const unitPrice = form.customPrice ? Number(form.customPrice) : (basePrice + (form.kurkure ? extra : 0))
  const lineTotal = unitPrice * Number(form.qty || 0)
  const orderTotal = lines.reduce((a, l) => a + l.total, 0)

  const addLine = () => {
    if (!form.qty || !form.variant) return
    setLines(p => [...p, { quality: form.quality, size: form.size, variant: form.variant, qty: Number(form.qty), unitPrice, total: lineTotal, kurkure: form.kurkure, customPrice: form.customPrice ? Number(form.customPrice) : null, unit: isKg ? 'kg' : 'pcs' }])
    setForm(f => ({ ...f, qty: '', kurkure: false, customPrice: '' }))
  }

  const submitOrder = async () => {
    if (lines.length === 0 || submitting) return
    setSubmitting(true)
    const { data: order, error } = await supabase.from('orders').insert({ vendor_id: vendor.id, status: 'pending', total_amount: orderTotal, advance_paid: 0, discount: 0, delivery_date: form.deliveryDate || null, notes: form.notes || null }).select().single()
    if (error || !order) { alert('Error: ' + (error?.message || 'Unknown')); setSubmitting(false); return }
    const items = lines.map(l => ({ order_id: order.id, quality: l.quality, size: l.size, variant: l.variant, quantity: l.qty, unit: l.unit, unit_price: l.unitPrice, is_kurkure: l.kurkure, custom_price: l.customPrice, line_total: l.total }))
    await supabase.from('order_items').insert(items)
    try { sendWhatsApp({ ...order, lines }, vendor) } catch (e) {}
    try { sendEmail({ ...order, lines }, vendor) } catch (e) {}
    setLines([]); setForm({ quality: 'Cart Style', size: 'Medium', variant: 'Veg', qty: '', kurkure: false, customPrice: '', deliveryDate: '', notes: '' }); setSubmitting(false); setSubmitted(true)
  }

  if (submitted) return (<div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 48, marginBottom: 12 }}>✅</div><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Order placed!</div><div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>We will confirm it shortly.</div><Btn primary onClick={() => setSubmitted(false)}>Place another order</Btn></div>)

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Place an order</div>
      <div style={s.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div><div style={s.label}>Quality</div><select style={s.select} value={form.quality} onChange={e => { const q = e.target.value; const sk = Object.keys(PRICE_LIST[q] || {}); const sz = sk[0] || ''; const vk = Object.keys((PRICE_LIST[q] || {})[sz] || {}); setForm(f => ({ ...f, quality: q, size: sz, variant: vk[0] || '' })) }}>{Object.keys(PRICE_LIST).map(q => <option key={q}>{q}</option>)}</select></div>
          <div><div style={s.label}>Size</div><select style={s.select} value={form.size} onChange={e => { const sz = e.target.value; const vk = Object.keys((PRICE_LIST[form.quality] || {})[sz] || {}); setForm(f => ({ ...f, size: sz, variant: vk[0] || '' })) }}>{sizeKeys.map(sz => <option key={sz}>{sz}</option>)}</select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div><div style={s.label}>Variant</div><select style={s.select} value={form.variant} onChange={e => setForm(f => ({ ...f, variant: e.target.value }))}>{variantKeys.map(v => <option key={v}>{v}</option>)}</select></div>
          <div><div style={s.label}>{isKg ? 'Weight (kg)' : 'Quantity (pcs)'}</div><input style={s.input} type="number" inputMode="numeric" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder={isKg ? 'e.g. 5' : 'e.g. 200'} /></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', marginBottom: 8 }}><input type="checkbox" checked={form.kurkure} onChange={e => setForm(f => ({ ...f, kurkure: e.target.checked }))} style={{ accentColor: 'var(--red)' }} />Kurkure (+{isKg ? '₹100/kg' : '₹2/pc'})</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div><div style={s.label}>Custom price <span style={{ opacity: .5 }}>(optional)</span></div><input style={s.input} type="number" inputMode="decimal" value={form.customPrice} onChange={e => setForm(f => ({ ...f, customPrice: e.target.value }))} placeholder={`List: ${fmt(basePrice + (form.kurkure ? extra : 0))}`} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}><div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: '1px solid var(--border)' }}><div style={{ fontSize: 11, color: 'var(--text2)' }}>Line total</div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>{fmt(lineTotal)}</div></div></div>
        </div>
        <Btn full onClick={addLine} disabled={!form.qty || !form.variant}>+ Add item to order</Btn>
      </div>
      {lines.length > 0 && (
        <div style={{ ...s.card, borderColor: 'var(--red)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Order items</div>
          {lines.map((l, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}><div><span style={{ fontWeight: 600 }}>{l.qty}{l.unit === 'kg' ? 'kg' : 'pc'}</span> {l.variant} <span style={{ color: 'var(--text3)' }}>· {l.quality} · {l.size}</span>{l.kurkure && <Badge color="#FF9800">K</Badge>}</div><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 600 }}>{fmt(l.total)}</span><button onClick={() => setLines(p => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18 }}>×</button></div></div>))}
          <div style={{ textAlign: 'right', fontSize: 20, fontWeight: 700, color: 'var(--red)', marginTop: 8 }}>Total: {fmt(orderTotal)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            <div><div style={s.label}>Delivery date</div><input style={s.input} type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} /></div>
            <div><div style={s.label}>Notes</div><input style={s.input} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special requests" /></div>
          </div>
          <Btn primary full onClick={submitOrder} disabled={submitting} style={{ marginTop: 12 }}>{submitting ? 'Placing order...' : `Place order (${fmt(orderTotal)})`}</Btn>
        </div>
      )}
    </div>
  )
}

function VendorHistory({ vendor }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      const { data: ords } = await supabase.from('orders').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false })
      if (ords) {
        const withItems = await Promise.all(ords.map(async o => { const { data: items } = await supabase.from('order_items').select('*').eq('order_id', o.id); return { ...o, lines: items || [] } }))
        setOrders(withItems)
      }
      setLoading(false)
    })()
  }, [vendor.id])
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading orders...</div>
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>My orders</div>
      {orders.map(o => (<div key={o.id} style={s.card}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><div><span style={{ fontWeight: 700 }}>#{o.order_number}</span><span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 8 }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</span></div><Badge color={STATUS_COLORS[o.status] || '#888'}>{o.status}</Badge></div>{(o.lines || []).map((l, i) => (<div key={i} style={{ fontSize: 12, color: 'var(--text2)', padding: '2px 0' }}>{Number(l.quantity)}{l.unit === 'kg' ? 'kg' : 'pc'} {l.variant} · {l.quality} · {l.size} → {fmt(l.line_total)}</div>))}<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}><span style={{ fontSize: 14, fontWeight: 700 }}>Total: {fmt(o.total_amount)}</span>{o.delivery_date && <span style={{ fontSize: 12, color: 'var(--text2)' }}>Delivery: {o.delivery_date}</span>}</div></div>))}
      {orders.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>No orders yet.</div>}
    </div>
  )
}

function VendorBalance({ vendor }) {
  const [bal, setBal] = useState(null)
  useEffect(() => { supabase.from('vendor_balances').select('*').eq('id', vendor.id).single().then(({ data }) => setBal(data)) }, [vendor.id])
  if (!bal) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading...</div>
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>My balance</div>
      <div style={s.card}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}><div><div style={{ fontSize: 11, color: 'var(--text2)' }}>Total ordered</div><div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(bal.total_orders)}</div></div><div><div style={{ fontSize: 11, color: 'var(--text2)' }}>Total paid</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>{fmt(bal.total_paid)}</div></div><div><div style={{ fontSize: 11, color: 'var(--text2)' }}>Pending</div><div style={{ fontSize: 16, fontWeight: 700, color: bal.pending_balance > 0 ? 'var(--red)' : 'var(--green)' }}>{fmt(bal.pending_balance)}</div></div></div></div>
      <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>{bal.order_count} total orders</div>
    </div>
  )
}

function AdminApp({ onBack }) {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [tab, setTab] = useState('orders')
  const [err, setErr] = useState('')

  const checkPin = async () => {
    const { data } = await supabase.from('admin_users').select('*').eq('pin', pin).limit(1)
    if (data && data.length > 0) setAuthed(true); else setErr('Wrong PIN')
  }

  if (!authed) return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', padding: 0, marginBottom: 16 }}>← Back</button>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--red)', marginBottom: 4 }}>Admin</div>
      <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>Enter PIN to continue</div>
      <input style={{ ...s.input, fontSize: 24, textAlign: 'center', letterSpacing: 8 }} type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setErr('') }} placeholder="• • • •" />
      {err && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{err}</div>}
      <Btn primary full onClick={checkPin} disabled={pin.length < 4} style={{ marginTop: 12 }}>Enter</Btn>
    </div>
  )

  const tabs = [{ id: 'orders', label: 'Orders', e: '📋' }, { id: 'expenses', label: 'Expenses', e: '💰' }, { id: 'balances', label: 'Clients', e: '👥' }, { id: 'pl', label: 'P&L', e: '📊' }]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 100 }}><button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button><span style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>Tikoz</span><Badge color="#4CAF50">Admin</Badge></div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', position: 'sticky', top: 49, background: 'var(--bg)', zIndex: 99 }}>{tabs.map(t => (<button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer', background: 'transparent', color: tab === t.id ? 'var(--red)' : 'var(--text2)', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', borderBottom: tab === t.id ? '2px solid var(--red)' : '2px solid transparent' }}><span style={{ fontSize: 16 }}>{t.e}</span><br />{t.label}</button>))}</div>
      <div style={{ flex: 1, padding: '12px 16px 80px' }}>
        {tab === 'orders' && <AdminOrders />}
        {tab === 'expenses' && <AdminExpenses />}
        {tab === 'balances' && <AdminBalances />}
        {tab === 'pl' && <AdminPL />}
      </div>
    </div>
  )
}

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [vendors, setVendors] = useState({})
  const [loading, setLoading] = useState(true)
  const loadOrders = async () => {
    const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50)
    const { data: vends } = await supabase.from('vendors').select('*')
    const vMap = {}; (vends || []).forEach(v => { vMap[v.id] = v })
    if (ords) { const withItems = await Promise.all(ords.map(async o => { const { data: items } = await supabase.from('order_items').select('*').eq('order_id', o.id); return { ...o, lines: items || [] } })); setOrders(withItems) }
    setVendors(vMap); setLoading(false)
  }
  useEffect(() => { loadOrders() }, [])
  const updateStatus = async (id, status) => { await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id); setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)) }
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading orders...</div>
  const pending = orders.filter(o => o.status === 'pending').length
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><div><div style={{ fontSize: 18, fontWeight: 700 }}>Orders</div><div style={{ fontSize: 12, color: 'var(--text2)' }}>{pending} pending · {orders.length} shown</div></div><Btn small onClick={loadOrders}>Refresh</Btn></div>
      {orders.map(o => { const v = vendors[o.vendor_id] || { name: 'Unknown', phone: '' }; return (
        <div key={o.id} style={{ ...s.card, borderLeft: o.status === 'pending' ? '3px solid #FF9800' : o.status === 'delivered' ? '3px solid #4CAF50' : '3px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><div><span style={{ fontWeight: 700 }}>#{o.order_number}</span><span style={{ fontWeight: 600, marginLeft: 8 }}>{v.name}</span><span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 4 }}>{v.phone}</span></div><Badge color={STATUS_COLORS[o.status]}>{o.status}</Badge></div>
          {(o.lines || []).map((l, i) => (<div key={i} style={{ fontSize: 12, color: 'var(--text2)', padding: '1px 0' }}>{Number(l.quantity)}{l.unit === 'kg' ? 'kg' : 'pc'} {l.variant} · {l.quality} · {l.size} → {fmt(l.line_total)}</div>))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}><span style={{ fontWeight: 700 }}>{fmt(o.total_amount)}</span><select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} style={{ ...s.select, width: 'auto', fontSize: 12, padding: '4px 8px' }}>{STATUSES.map(st => <option key={st} value={st}>{st}</option>)}</select></div>
          {o.notes && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>📝 {o.notes}</div>}
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{new Date(o.created_at).toLocaleString('en-IN')}</div>
        </div>
      )})}
      {orders.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>No orders yet.</div>}
    </div>
  )
}

function AdminExpenses() {
  const [expenses, setExpenses] = useState([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ date: today(), category: 'rashan', amount: '', description: '' })
  const [loading, setLoading] = useState(true)
  const load = async () => { const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false }).limit(50); setExpenses(data || []); setLoading(false) }
  useEffect(() => { load() }, [])
  const save = async () => { if (!form.amount) return; await supabase.from('expenses').insert({ date: form.date, category: form.category, amount: Number(form.amount), description: form.description || null }); setForm({ date: today(), category: 'rashan', amount: '', description: '' }); setShow(false); load() }
  const del = async (id) => { await supabase.from('expenses').delete().eq('id', id); setExpenses(prev => prev.filter(e => e.id !== id)) }
  const todayTotal = expenses.filter(e => e.date === today()).reduce((a, e) => a + Number(e.amount), 0)
  const thisMonth = today().slice(0, 7)
  const monthExp = expenses.filter(e => (e.date || '').startsWith(thisMonth))
  const byCat = {}; monthExp.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount) })
  const monthTotal = monthExp.reduce((a, e) => a + Number(e.amount), 0)
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading...</div>
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><div><div style={{ fontSize: 18, fontWeight: 700 }}>Expenses</div><div style={{ fontSize: 12, color: 'var(--text2)' }}>Today: {fmt(todayTotal)}</div></div><Btn primary onClick={() => setShow(!show)}>{show ? 'Cancel' : '+ Add'}</Btn></div>
      {show && (<div style={{ ...s.card, borderColor: 'var(--red)' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}><div><div style={s.label}>Date</div><input style={s.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div><div><div style={s.label}>Category</div><select style={s.select} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}><div><div style={s.label}>Amount (₹)</div><input style={s.input} type="number" inputMode="numeric" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div><div><div style={s.label}>Description</div><input style={s.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div></div><Btn primary full onClick={save} disabled={!form.amount}>Save expense</Btn></div>)}
      {monthTotal > 0 && (<div style={s.card}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>This month: {fmt(monthTotal)}</div>{Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (<div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}><span style={{ color: 'var(--text2)' }}>{cat}</span><span style={{ fontWeight: 600 }}>{fmt(amt)}</span></div>))}</div>)}
      {expenses.map(e => (<div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}><div><span style={{ fontWeight: 600 }}>{e.category}</span><span style={{ color: 'var(--text2)', marginLeft: 6 }}>{e.date}{e.description ? ` · ${e.description}` : ''}</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 700, color: 'var(--red)' }}>{fmt(e.amount)}</span><button onClick={() => del(e.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>×</button></div></div>))}
    </div>
  )
}

function AdminBalances() {
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [payVid, setPayVid] = useState(null)
  const [payAmt, setPayAmt] = useState('')
  const load = async () => { const { data } = await supabase.from('vendor_balances').select('*').order('pending_balance', { ascending: false }); setBalances(data || []); setLoading(false) }
  useEffect(() => { load() }, [])
  const recordPay = async (vid) => { if (!payAmt) return; await supabase.from('payments').insert({ vendor_id: vid, amount: Number(payAmt) }); setPayVid(null); setPayAmt(''); load() }
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading...</div>
  const totalPending = balances.reduce((a, b) => a + Math.max(0, Number(b.pending_balance)), 0)
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Client balances</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Total pending: <span style={{ color: 'var(--red)', fontWeight: 700 }}>{fmt(totalPending)}</span></div>
      {balances.map(b => (<div key={b.id} style={s.card}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div><div style={{ fontWeight: 700 }}>{b.name}</div><div style={{ fontSize: 12, color: 'var(--text2)' }}>{b.phone} · {b.order_count} orders</div></div><div style={{ textAlign: 'right' }}>{b.pending_balance > 0 ? <div style={{ fontWeight: 700, color: 'var(--red)' }}>{fmt(b.pending_balance)}</div> : <Badge color="#4CAF50">Clear</Badge>}</div></div>{b.pending_balance > 0 && (payVid === b.id ? (<div style={{ display: 'flex', gap: 6, marginTop: 8 }}><input style={{ ...s.input, flex: 1 }} type="number" inputMode="numeric" value={payAmt} onChange={e => setPayAmt(e.target.value)} placeholder="Amount" /><Btn primary small onClick={() => recordPay(b.id)}>Save</Btn><Btn small onClick={() => { setPayVid(null); setPayAmt('') }}>×</Btn></div>) : <Btn small onClick={() => setPayVid(b.id)} style={{ marginTop: 8, background: '#1B5E20', color: '#fff', border: 'none' }}>Record payment</Btn>)}</div>))}
    </div>
  )
}

function AdminPL() {
  const [sales, setSales] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => { const { data: s } = await supabase.from('monthly_pl').select('*'); const { data: e } = await supabase.from('monthly_expenses').select('*'); setSales(s || []); setExpenses(e || []); setLoading(false) })() }, [])
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading...</div>
  const months = {}; sales.forEach(r => { months[r.month] = { sales: Number(r.sales), expenses: 0 } }); expenses.forEach(r => { if (!months[r.month]) months[r.month] = { sales: 0, expenses: 0 }; months[r.month].expenses += Number(r.total) })
  const sorted = Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).map(([month, v]) => ({ month, ...v, profit: v.sales - v.expenses }))
  const totS = sorted.reduce((a, m) => a + m.sales, 0); const totE = sorted.reduce((a, m) => a + m.expenses, 0); const totP = totS - totE
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Profit & Loss</div>
      <div style={s.card}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}><div><div style={{ fontSize: 11, color: 'var(--text2)' }}>Sales</div><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{fmt(totS)}</div></div><div><div style={{ fontSize: 11, color: 'var(--text2)' }}>Expenses</div><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>{fmt(totE)}</div></div><div><div style={{ fontSize: 11, color: 'var(--text2)' }}>Profit</div><div style={{ fontSize: 18, fontWeight: 700, color: totP >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(totP)}</div></div></div></div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Vaibhav / Prajwal split (50-50)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}><div style={s.card}><div style={{ fontSize: 12, color: 'var(--text2)' }}>Vaibhav</div><div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(totP / 2)}</div></div><div style={s.card}><div style={{ fontSize: 12, color: 'var(--text2)' }}>Prajwal</div><div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(totP / 2)}</div></div></div>
      {sorted.map(m => (<div key={m.month} style={s.card}><div style={{ fontWeight: 700, marginBottom: 4 }}>{m.month}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 13 }}><div><span style={{ color: 'var(--text2)' }}>Sales</span><br /><span style={{ fontWeight: 600, color: 'var(--green)' }}>{fmt(m.sales)}</span></div><div><span style={{ color: 'var(--text2)' }}>Expenses</span><br /><span style={{ fontWeight: 600, color: 'var(--red)' }}>{fmt(m.expenses)}</span></div><div><span style={{ color: 'var(--text2)' }}>Profit</span><br /><span style={{ fontWeight: 700, color: m.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(m.profit)}</span></div></div>{m.sales > 0 && <div style={{ marginTop: 6 }}><div style={{ height: 5, borderRadius: 3, background: 'var(--bg)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, (m.expenses / m.sales) * 100)}%`, background: m.profit >= 0 ? '#4CAF50' : '#C62828', borderRadius: 3 }} /></div><div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Margin: {((m.profit / m.sales) * 100).toFixed(1)}%</div></div>}</div>))}
      {sorted.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>Add orders and expenses to see P&L.</div>}
    </div>
  )
}
