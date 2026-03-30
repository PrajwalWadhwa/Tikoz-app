'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PRICE_LIST, EXPENSE_CATS, STATUSES, STATUS_COLORS } from '../lib/prices'

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

const Logo = ({ height = 40 }) => <img src="/tikoz-logo.png" alt="Tikoz" style={{ height, objectFit: 'contain' }} />

const Badge = ({ children, color = '#E53935' }) => <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, background: color + '20', color, fontSize: 11, fontWeight: 600 }}>{children}</span>

const Btn = ({ children, primary, small, full, ghost, disabled, onClick, style: sx }) => <button onClick={onClick} disabled={disabled} style={{ padding: small ? '7px 14px' : '13px 24px', borderRadius: 10, border: ghost ? '1.5px solid rgba(255,255,255,0.12)' : primary ? 'none' : '1.5px solid rgba(255,255,255,0.08)', cursor: disabled ? 'default' : 'pointer', background: primary ? 'linear-gradient(135deg,#C62828,#E53935)' : ghost ? 'transparent' : 'rgba(255,255,255,0.04)', color: '#fff', fontSize: small ? 12 : 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif", opacity: disabled ? 0.4 : 1, width: full ? '100%' : 'auto', boxShadow: primary ? '0 4px 20px rgba(198,40,40,0.3)' : 'none', ...sx }}>{children}</button>

const Input = ({ label, ...props }) => <div style={{ marginBottom: props.mb || 0 }}>{label && <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Outfit',sans-serif" }}>{label}</div>}<input {...props} style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontFamily: "'Outfit',sans-serif", outline: 'none', ...(props.style || {}) }} /></div>

const Select = ({ label, children, ...props }) => <div>{label && <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Outfit',sans-serif" }}>{label}</div>}<select {...props} style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontFamily: "'Outfit',sans-serif", outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', ...(props.style || {}) }}>{children}</select></div>

const Card = ({ children, accent, style: sx }) => <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 18, marginBottom: 12, border: `1.5px solid ${accent ? 'rgba(229,57,53,0.25)' : 'rgba(255,255,255,0.06)'}`, ...sx }}>{children}</div>

export default function TikozApp() {
  const [screen, setScreen] = useState('landing')
  const [vendor, setVendor] = useState(null)
  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Outfit',sans-serif", maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', background: '#0A0A0A', color: '#E8E8E8' }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      {screen === 'landing' && <Landing onVendor={() => setScreen('vendor')} />}
      {screen === 'vendor' && <VendorApp vendor={vendor} setVendor={setVendor} onBack={() => { setScreen('landing'); setVendor(null) }} />}
    </div>
  )
}

function Landing({ onVendor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <Logo height={70} />
      </div>
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button onClick={onVendor} style={{ padding: '28px 24px', borderRadius: 18, border: '1.5px solid rgba(229,57,53,0.2)', background: 'linear-gradient(135deg,rgba(229,57,53,0.08),rgba(255,111,0,0.03))', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(229,57,53,0.06)' }} />
          <div style={{ fontSize: 28, marginBottom: 8 }}>🛒</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Place an order</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.4 }}>View prices, order momos, track deliveries</div>
        </button>
      </div>
      <div style={{ marginTop: 56, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.8 }}>Prajwal: 9911910001 · Vaibhav: 9999890012<br />tikoz.business@gmail.com</div>
      </div>
    </div>
  )
}

function Header({ onBack, right, badge }) {
  return (
    <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 18, padding: 0 }}>←</button>
        <Logo height={28} />
        {badge && <Badge color="#4CAF50">{badge}</Badge>}
      </div>
      {right}
    </div>
  )
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 49, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', zIndex: 99 }}>
      {tabs.map(t => <button key={t.id} onClick={() => onChange(t.id)} style={{ flex: 1, padding: '12px 4px', border: 'none', cursor: 'pointer', background: 'transparent', color: active === t.id ? '#E53935' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, fontFamily: "'Outfit',sans-serif", letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: active === t.id ? '2px solid #E53935' : '2px solid transparent' }}><span style={{ fontSize: 16, display: 'block', marginBottom: 2 }}>{t.e}</span>{t.label}</button>)}
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
    } else { setFound(null) }
  }, [phone])

  const register = async () => {
    if (!regName) return
    const { data } = await supabase.from('vendors').insert({ phone, name: regName, business_name: regBiz || null }).select().single()
    if (data) setVendor(data)
  }

  if (!vendor) {
    return (
      <div style={{ padding: 24, minHeight: '100vh' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', padding: 0, marginBottom: 20 }}>← Back</button>
        <div style={{ marginBottom: 6 }}><Logo height={36} /></div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>Enter your phone number to get started</div>
        <Input label="Phone number" type="tel" inputMode="numeric" placeholder="e.g. 9876543210" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} style={{ fontSize: 18 }} />
        {phone.length === 10 && searching && <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Looking you up...</div>}
        {phone.length === 10 && !searching && !found && (
          <Card accent style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#E53935' }}>New here? Tell us about yourself</div>
            <Input label="Your name *" value={regName} onChange={e => setRegName(e.target.value)} placeholder="e.g. Rahul Kumar" mb={10} />
            <Input label="Business name (optional)" value={regBiz} onChange={e => setRegBiz(e.target.value)} placeholder="e.g. Rahul's Momo Cart" mb={14} />
            <Btn primary full onClick={register} disabled={!regName}>Start ordering</Btn>
          </Card>
        )}
        {phone.length === 10 && !searching && found && (
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Welcome back, {found.name}!</div>
            {found.business_name && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{found.business_name}</div>}
            <Btn primary full onClick={() => setVendor(found)} style={{ marginTop: 14 }}>Continue</Btn>
          </Card>
        )}
      </div>
    )
  }

  const tabs = [{ id: 'prices', label: 'Prices', e: '🏷️' }, { id: 'order', label: 'Order', e: '📝' }, { id: 'history', label: 'Orders', e: '📋' }, { id: 'balance', label: 'Balance', e: '💰' }]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onBack={() => { setVendor(null); onBack() }} right={<div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}><div style={{ fontWeight: 600, color: '#fff' }}>{vendor.name}</div><div>{vendor.phone}</div></div>} />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      <div style={{ flex: 1, padding: '14px 18px 80px' }}>
        {tab === 'prices' && <PricesView />}
        {tab === 'order' && <OrderView vendor={vendor} />}
        {tab === 'history' && <HistoryView vendor={vendor} />}
        {tab === 'balance' && <BalanceView vendor={vendor} />}
      </div>
    </div>
  )
}

function PricesView() {
  const [exp, setExp] = useState(null)
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Price list</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>Per piece rates · Kurkure: +₹2/pc or +₹100/kg extra</div>
      {Object.entries(PRICE_LIST).map(([q, sizes]) => (
        <Card key={q} style={{ cursor: 'pointer' }} onClick={() => setExp(exp === q ? null : q)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontWeight: 700, fontSize: 14, color: '#E53935' }}>{q}</div><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', transform: exp === q ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>▼</span></div>
          {exp === q && <div style={{ marginTop: 14 }}>{Object.entries(sizes).map(([size, variants]) => <div key={size} style={{ marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{size}</div>{Object.entries(variants).map(([v, price]) => <div key={v} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}><span style={{ color: 'rgba(255,255,255,0.7)' }}>{v}</span><span style={{ fontWeight: 600 }}>{fmt(price)}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{size === 'Per KG' ? '/kg' : '/pc'}</span></span></div>)}</div>)}</div>}
        </Card>
      ))}
    </div>
  )
}

function OrderView({ vendor }) {
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
  const addLine = () => { if (!form.qty || !form.variant) return; setLines(p => [...p, { quality: form.quality, size: form.size, variant: form.variant, qty: Number(form.qty), unitPrice, total: lineTotal, kurkure: form.kurkure, unit: isKg ? 'kg' : 'pcs', customPrice: form.customPrice ? Number(form.customPrice) : null }]); setForm(f => ({ ...f, qty: '', kurkure: false, customPrice: '' })) }

  const submitOrder = async () => {
    if (lines.length === 0 || submitting) return
    setSubmitting(true)
    const { data: order, error } = await supabase.from('orders').insert({ vendor_id: vendor.id, status: 'pending', total_amount: orderTotal, advance_paid: 0, discount: 0, delivery_date: form.deliveryDate || null, notes: form.notes || null }).select().single()
    if (error || !order) { alert('Error: ' + (error?.message || 'Unknown')); setSubmitting(false); return }
    const items = lines.map(l => ({ order_id: order.id, quality: l.quality, size: l.size, variant: l.variant, quantity: l.qty, unit: l.unit, unit_price: l.unitPrice, is_kurkure: l.kurkure, custom_price: l.customPrice, line_total: l.total }))
    await supabase.from('order_items').insert(items)
    try { sendWhatsApp({ ...order, lines }, vendor) } catch (e) { }
    try { sendEmail({ ...order, lines }, vendor) } catch (e) { }
    setLines([]); setForm({ quality: 'Cart Style', size: 'Medium', variant: 'Veg', qty: '', kurkure: false, customPrice: '', deliveryDate: '', notes: '' }); setSubmitting(false); setSubmitted(true)
  }

  if (submitted) return <div style={{ textAlign: 'center', padding: 60 }}><div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(76,175,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>✅</div><div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Order placed!</div><div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>We will confirm it shortly.</div><Btn primary onClick={() => setSubmitted(false)}>Place another order</Btn></div>

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>Place an order</div>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <Select label="Quality" value={form.quality} onChange={e => { const q = e.target.value; const sk = Object.keys(PRICE_LIST[q] || {}); const sz = sk[0] || ''; const vk = Object.keys((PRICE_LIST[q] || {})[sz] || {}); setForm(f => ({ ...f, quality: q, size: sz, variant: vk[0] || '' })) }}>{Object.keys(PRICE_LIST).map(q => <option key={q}>{q}</option>)}</Select>
          <Select label="Size" value={form.size} onChange={e => { const sz = e.target.value; const vk = Object.keys((PRICE_LIST[form.quality] || {})[sz] || {}); setForm(f => ({ ...f, size: sz, variant: vk[0] || '' })) }}>{sizeKeys.map(s => <option key={s}>{s}</option>)}</Select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <Select label="Variant" value={form.variant} onChange={e => setForm(f => ({ ...f, variant: e.target.value }))}>{variantKeys.map(v => <option key={v}>{v}</option>)}</Select>
          <Input label={isKg ? 'Weight (kg)' : 'Quantity (pcs)'} type="number" inputMode="numeric" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder={isKg ? 'e.g. 5' : 'e.g. 200'} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 12, color: 'rgba(255,255,255,0.6)' }}><input type="checkbox" checked={form.kurkure} onChange={e => setForm(f => ({ ...f, kurkure: e.target.checked }))} style={{ accentColor: '#E53935' }} />Kurkure (+{isKg ? '₹100/kg' : '₹2/pc'})</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <Input label="Custom price (optional)" type="number" inputMode="decimal" value={form.customPrice} onChange={e => setForm(f => ({ ...f, customPrice: e.target.value }))} placeholder={`List: ${fmt(basePrice + (form.kurkure ? extra : 0))}`} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}><div style={{ background: 'rgba(229,57,53,0.06)', borderRadius: 10, padding: '10px 14px', textAlign: 'center', border: '1px solid rgba(229,57,53,0.15)' }}><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Line total</div><div style={{ fontSize: 22, fontWeight: 700, color: '#E53935' }}>{fmt(lineTotal)}</div></div></div>
        </div>
        <Btn full ghost onClick={addLine} disabled={!form.qty || !form.variant}>+ Add item to order</Btn>
      </Card>
      {lines.length > 0 && <Card accent>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#E53935' }}>Order items</div>
        {lines.map((l, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13 }}><div><span style={{ fontWeight: 600 }}>{l.qty}{l.unit === 'kg' ? 'kg' : 'pc'}</span><span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 6 }}>{l.variant}</span><span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>· {l.quality} · {l.size}</span>{l.kurkure && <Badge color="#FF9800">K</Badge>}</div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 600 }}>{fmt(l.total)}</span><button onClick={() => setLines(p => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 16 }}>×</button></div></div>)}
        <div style={{ textAlign: 'right', fontSize: 22, fontWeight: 700, color: '#E53935', marginTop: 10 }}>Total: {fmt(orderTotal)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}><Input label="Delivery date" type="date" value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} /><Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special requests" /></div>
        <Btn primary full onClick={submitOrder} disabled={submitting} style={{ marginTop: 14 }}>{submitting ? 'Placing order...' : `Place order (${fmt(orderTotal)})`}</Btn>
      </Card>}
    </div>
  )
}

function HistoryView({ vendor }) {
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
  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)' }}>Loading orders...</div>
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>My orders</div>
      {orders.map(o => <Card key={o.id}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><div><span style={{ fontWeight: 700, fontSize: 15 }}>#{o.order_number}</span><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</span></div><Badge color={STATUS_COLORS[o.status] || '#888'}>{o.status}</Badge></div>{(o.lines || []).map((l, i) => <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', padding: '2px 0' }}>{Number(l.quantity)}{l.unit === 'kg' ? 'kg' : 'pc'} {l.variant} · {l.quality} · {l.size} → {fmt(l.line_total)}</div>)}<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}><span style={{ fontSize: 15, fontWeight: 700 }}>{fmt(o.total_amount)}</span>{o.delivery_date && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Delivery: {o.delivery_date}</span>}</div></Card>)}
      {orders.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 40 }}>No orders yet.</div>}
    </div>
  )
}

function BalanceView({ vendor }) {
  const [bal, setBal] = useState(null)
  useEffect(() => { supabase.from('vendor_balances').select('*').eq('id', vendor.id).single().then(({ data }) => setBal(data)) }, [vendor.id])
  if (!bal) return <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>My balance</div>
      <Card><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>{[['Ordered', bal.total_orders, '#fff'], ['Paid', bal.total_paid, '#4CAF50'], ['Pending', bal.pending_balance, bal.pending_balance > 0 ? '#E53935' : '#4CAF50']].map(([l, v, c]) => <div key={l}><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{l}</div><div style={{ fontSize: 18, fontWeight: 700, color: c }}>{fmt(v)}</div></div>)}</div></Card>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{bal.order_count} total orders</div>
    </div>
  )
}
