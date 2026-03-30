'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// Copy the full admin code - this is a standalone admin page at tikoz.in/admin
// It won't be visible from the main homepage

export default function AdminPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:"'Outfit',sans-serif",maxWidth:480,margin:'0 auto',background:'#0A0A0A',color:'#E8E8E8'}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      <AdminApp/>
    </div>
  )
}

function AdminApp() {
  const [authed,setAuthed] = useState(false)
  const [pin,setPin] = useState('')
  const [tab,setTab] = useState('orders')
  const [err,setErr] = useState('')

  const checkPin = async () => {
    const { data } = await supabase.from('admin_users').select('*').eq('pin', pin).limit(1)
    if (data && data.length > 0) setAuthed(true)
    else setErr('Wrong PIN')
  }

  if (!authed) return (
    <div style={{padding:24,display:'flex',flexDirection:'column',justifyContent:'center',minHeight:'100vh'}}>
      <a href="/" style={{color:'rgba(255,255,255,0.3)',fontSize:14,textDecoration:'none',marginBottom:20}}>← Back to Tikoz</a>
      <div style={{fontSize:28,fontWeight:800,color:'#E53935',marginBottom:4}}>Admin</div>
      <div style={{fontSize:14,color:'rgba(255,255,255,0.35)',marginBottom:28}}>Enter PIN to continue</div>
      <input type="password" inputMode="numeric" maxLength={4} value={pin}
        onChange={e=>{setPin(e.target.value.replace(/\D/g,'').slice(0,4));setErr('')}}
        placeholder="• • • •"
        style={{width:'100%',boxSizing:'border-box',padding:'11px 14px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:28,fontFamily:'inherit',outline:'none',textAlign:'center',letterSpacing:12}}/>
      {err && <div style={{color:'#E53935',fontSize:13,marginTop:8,textAlign:'center'}}>{err}</div>}
      <button onClick={checkPin} disabled={pin.length<4} style={{marginTop:14,width:'100%',padding:'13px 24px',borderRadius:10,border:'none',cursor:pin.length<4?'default':'pointer',background:'linear-gradient(135deg,#C62828,#E53935)',color:'#fff',fontSize:14,fontWeight:600,fontFamily:'inherit',opacity:pin.length<4?0.4:1}}>Enter</button>
    </div>
  )

  const tabs=[{id:'orders',label:'Orders',e:'📋'},{id:'expenses',label:'Expenses',e:'💰'},{id:'clients',label:'Clients',e:'👥'},{id:'pl',label:'P&L',e:'📊'}]
  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <div style={{padding:'12px 18px',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid rgba(255,255,255,0.06)',position:'sticky',top:0,background:'rgba(10,10,10,0.95)',zIndex:100}}>
        <a href="/" style={{color:'rgba(255,255,255,0.35)',fontSize:18,textDecoration:'none'}}>←</a>
        <span style={{fontSize:20,fontWeight:800,color:'#E53935'}}>Tikoz</span>
        <span style={{display:'inline-block',padding:'2px 10px',borderRadius:20,background:'#4CAF5020',color:'#4CAF50',fontSize:11,fontWeight:600}}>Admin</span>
      </div>
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.06)',position:'sticky',top:51,background:'rgba(10,10,10,0.95)',zIndex:99}}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'12px 4px',border:'none',cursor:'pointer',background:'transparent',color:tab===t.id?'#E53935':'rgba(255,255,255,0.25)',fontSize:10,fontWeight:600,fontFamily:'inherit',letterSpacing:0.5,textTransform:'uppercase',borderBottom:tab===t.id?'2px solid #E53935':'2px solid transparent'}}><span style={{fontSize:16,display:'block',marginBottom:2}}>{t.e}</span>{t.label}</button>)}
      </div>
      <div style={{flex:1,padding:'14px 18px 80px'}}>
        {tab==='orders'&&<AdminOrders/>}
        {tab==='expenses'&&<AdminExpenses/>}
        {tab==='clients'&&<AdminClients/>}
        {tab==='pl'&&<AdminPL/>}
      </div>
    </div>
  )
}

const fmt=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:0})
const today=()=>new Date().toISOString().slice(0,10)
const STATUS_COLORS={pending:'#FF9800',confirmed:'#2196F3',preparing:'#9C27B0',dispatched:'#00BCD4',delivered:'#4CAF50',cancelled:'#F44336'}
const STATUSES=['pending','confirmed','preparing','dispatched','delivered','cancelled']
const EXPENSE_CATS=['rashan','gas','packaging','chicken','paneer','sabzi','porter','salary','rent','electricity','transport','other']
const Badge=({children,color='#E53935'})=><span style={{display:'inline-block',padding:'2px 10px',borderRadius:20,background:color+'20',color,fontSize:11,fontWeight:600}}>{children}</span>
const Card=({children,accent,style:sx})=><div style={{background:'rgba(255,255,255,0.03)',borderRadius:14,padding:18,marginBottom:12,border:`1.5px solid ${accent?'rgba(229,57,53,0.25)':'rgba(255,255,255,0.06)'},...sx}}>{children}</div>

function AdminOrders(){
  const[orders,setOrders]=useState([])
  const[vendors,setVendors]=useState({})
  const[loading,setLoading]=useState(true)
  const loadOrders=async()=>{
    const{data:ords}=await supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(50)
    const{data:vends}=await supabase.from('vendors').select('*')
    const vMap={};(vends||[]).forEach(v=>{vMap[v.id]=v})
    if(ords){const withItems=await Promise.all(ords.map(async o=>{const{data:items}=await supabase.from('order_items').select('*').eq('order_id',o.id);return{...o,lines:items||[]}}));setOrders(withItems)}
    setVendors(vMap);setLoading(false)
  }
  useState(()=>{loadOrders()},[])
  const updateStatus=async(id,status)=>{await supabase.from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id);setOrders(prev=>prev.map(o=>o.id===id?{...o,status}:o))}
  if(loading)return<div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.3)'}}>Loading orders...</div>
  const pending=orders.filter(o=>o.status==='pending').length
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}><div><div style={{fontSize:20,fontWeight:700}}>Orders</div><div style={{fontSize:12,color:'rgba(255,255,255,0.25)'}}>{pending} pending · {orders.length} shown</div></div><button onClick={loadOrders} style={{padding:'7px 14px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.12)',background:'transparent',color:'#fff',fontSize:12,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>Refresh</button></div>
      {orders.map(o=>{const v=vendors[o.vendor_id]||{name:'Unknown',phone:''};return(
        <Card key={o.id} style={{borderLeft:`3px solid ${STATUS_COLORS[o.status]}`}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><div><span style={{fontWeight:700}}>#{o.order_number}</span><span style={{fontWeight:600,marginLeft:8}}>{v.name}</span><span style={{fontSize:12,color:'rgba(255,255,255,0.25)',marginLeft:4}}>{v.phone}</span></div><Badge color={STATUS_COLORS[o.status]}>{o.status}</Badge></div>
          {(o.lines||[]).map((l,i)=><div key={i} style={{fontSize:12,color:'rgba(255,255,255,0.3)',padding:'1px 0'}}>{Number(l.quantity)}{l.unit==='kg'?'kg':'pc'} {l.variant} · {l.quality} · {l.size} → {fmt(l.line_total)}</div>)}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            <span style={{fontWeight:700,fontSize:15}}>{fmt(o.total_amount)}</span>
            <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} style={{padding:'4px 8px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:12,fontFamily:'inherit'}}>{STATUSES.map(st=><option key={st} value={st}>{st}</option>)}</select>
          </div>
          {o.notes&&<div style={{fontSize:12,color:'rgba(255,255,255,0.3)',marginTop:4}}>📝 {o.notes}</div>}
          <div style={{fontSize:11,color:'rgba(255,255,255,0.15)',marginTop:4}}>{new Date(o.created_at).toLocaleString('en-IN')}</div>
        </Card>
      )})}
      {orders.length===0&&<div style={{textAlign:'center',color:'rgba(255,255,255,0.2)',padding:40}}>No orders yet.</div>}
    </div>
  )
}

function AdminExpenses(){
  const[expenses,setExpenses]=useState([])
  const[show,setShow]=useState(false)
  const[form,setForm]=useState({date:today(),category:'rashan',amount:'',description:''})
  const[loading,setLoading]=useState(true)
  const load=async()=>{const{data}=await supabase.from('expenses').select('*').order('date',{ascending:false}).limit(50);setExpenses(data||[]);setLoading(false)}
  useState(()=>{load()},[])
  const save=async()=>{if(!form.amount)return;await supabase.from('expenses').insert({date:form.date,category:form.category,amount:Number(form.amount),description:form.description||null});setForm({date:today(),category:'rashan',amount:'',description:''});setShow(false);load()}
  const del=async(id)=>{await supabase.from('expenses').delete().eq('id',id);setExpenses(prev=>prev.filter(e=>e.id!==id))}
  const todayTotal=expenses.filter(e=>e.date===today()).reduce((a,e)=>a+Number(e.amount),0)
  const thisMonth=today().slice(0,7)
  const monthExp=expenses.filter(e=>(e.date||'').startsWith(thisMonth))
  const byCat={};monthExp.forEach(e=>{byCat[e.category]=(byCat[e.category]||0)+Number(e.amount)})
  const monthTotal=monthExp.reduce((a,e)=>a+Number(e.amount),0)
  if(loading)return<div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.3)'}}>Loading...</div>
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}><div><div style={{fontSize:20,fontWeight:700}}>Expenses</div><div style={{fontSize:12,color:'rgba(255,255,255,0.25)'}}>Today: {fmt(todayTotal)}</div></div><button onClick={()=>setShow(!show)} style={{padding:'7px 14px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#C62828,#E53935)',color:'#fff',fontSize:12,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>{show?'Cancel':'+ Add'}</button></div>
      {show&&<Card accent><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}><div><div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.35)',marginBottom:5,textTransform:'uppercase',letterSpacing:1}}>Date</div><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{width:'100%',boxSizing:'border-box',padding:'11px 14px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:14,fontFamily:'inherit',outline:'none'}}/></div><div><div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.35)',marginBottom:5,textTransform:'uppercase',letterSpacing:1}}>Category</div><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{width:'100%',boxSizing:'border-box',padding:'11px 14px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:14,fontFamily:'inherit',outline:'none',appearance:'none'}}>{EXPENSE_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}><div><div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.35)',marginBottom:5,textTransform:'uppercase',letterSpacing:1}}>Amount (₹)</div><input type="number" inputMode="numeric" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={{width:'100%',boxSizing:'border-box',padding:'11px 14px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:14,fontFamily:'inherit',outline:'none'}}/></div><div><div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.35)',marginBottom:5,textTransform:'uppercase',letterSpacing:1}}>Description</div><input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{width:'100%',boxSizing:'border-box',padding:'11px 14px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:14,fontFamily:'inherit',outline:'none'}}/></div></div><button onClick={save} disabled={!form.amount} style={{width:'100%',padding:'13px 24px',borderRadius:10,border:'none',cursor:!form.amount?'default':'pointer',background:'linear-gradient(135deg,#C62828,#E53935)',color:'#fff',fontSize:14,fontWeight:600,fontFamily:'inherit',opacity:!form.amount?0.4:1}}>Save expense</button></Card>}
      {monthTotal>0&&<Card><div style={{fontSize:14,fontWeight:700,marginBottom:10}}>This month: {fmt(monthTotal)}</div>{Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=><div key={cat} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}><span style={{color:'rgba(255,255,255,0.45)'}}>{cat}</span><span style={{fontWeight:600}}>{fmt(amt)}</span></div>)}</Card>}
      {expenses.map(e=><div key={e.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:13}}><div><span style={{fontWeight:600}}>{e.category}</span><span style={{color:'rgba(255,255,255,0.3)',marginLeft:6}}>{e.date}{e.description?` · ${e.description}`:''}</span></div><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontWeight:700,color:'#E53935'}}>{fmt(e.amount)}</span><button onClick={()=>del(e.id)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.2)',cursor:'pointer',fontSize:16}}>×</button></div></div>)}
    </div>
  )
}

function AdminClients(){
  const[balances,setBalances]=useState([])
  const[loading,setLoading]=useState(true)
  const[payVid,setPayVid]=useState(null)
  const[payAmt,setPayAmt]=useState('')
  const load=async()=>{const{data}=await supabase.from('vendor_balances').select('*').order('pending_balance',{ascending:false});setBalances(data||[]);setLoading(false)}
  useState(()=>{load()},[])
  const recordPay=async(vid)=>{if(!payAmt)return;await supabase.from('payments').insert({vendor_id:vid,amount:Number(payAmt)});setPayVid(null);setPayAmt('');load()}
  if(loading)return<div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.3)'}}>Loading...</div>
  const totalPending=balances.reduce((a,b)=>a+Math.max(0,Number(b.pending_balance)),0)
  return(
    <div>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Client balances</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.25)',marginBottom:18}}>Total pending: <span style={{color:'#E53935',fontWeight:700}}>{fmt(totalPending)}</span></div>
      {balances.map(b=><Card key={b.id}><div style={{display:'flex',justifyContent:'space-between'}}><div><div style={{fontWeight:700}}>{b.name}</div><div style={{fontSize:12,color:'rgba(255,255,255,0.25)'}}>{b.phone} · {b.order_count} orders</div></div><div style={{textAlign:'right'}}>{b.pending_balance>0?<div style={{fontWeight:700,color:'#E53935'}}>{fmt(b.pending_balance)}</div>:<Badge color="#4CAF50">Clear</Badge>}</div></div>{b.pending_balance>0&&(payVid===b.id?<div style={{display:'flex',gap:6,marginTop:8}}><input type="number" inputMode="numeric" value={payAmt} onChange={e=>setPayAmt(e.target.value)} placeholder="Amount" style={{flex:1,padding:'8px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:14,fontFamily:'inherit',outline:'none'}}/><button onClick={()=>recordPay(b.id)} style={{padding:'7px 14px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#C62828,#E53935)',color:'#fff',fontSize:12,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>Save</button><button onClick={()=>{setPayVid(null);setPayAmt('')}} style={{padding:'7px 14px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.08)',background:'transparent',color:'#fff',fontSize:12,fontFamily:'inherit',cursor:'pointer'}}>×</button></div>:<button onClick={()=>setPayVid(b.id)} style={{marginTop:10,padding:'7px 14px',borderRadius:10,border:'1px solid rgba(76,175,80,0.2)',background:'rgba(27,94,32,0.12)',color:'#4CAF50',fontSize:12,fontWeight:600,fontFamily:'inherit',cursor:'pointer'}}>Record payment</button>)}</Card>)}
    </div>
  )
}

function AdminPL(){
  const[sales,setSales]=useState([])
  const[expenses,setExpenses]=useState([])
  const[loading,setLoading]=useState(true)
  useState(()=>{(async()=>{const{data:s}=await supabase.from('monthly_pl').select('*');const{data:e}=await supabase.from('monthly_expenses').select('*');setSales(s||[]);setExpenses(e||[]);setLoading(false)})()},[])
  if(loading)return<div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.3)'}}>Loading...</div>
  const months={};sales.forEach(r=>{months[r.month]={sales:Number(r.sales),expenses:0}});expenses.forEach(r=>{if(!months[r.month])months[r.month]={sales:0,expenses:0};months[r.month].expenses+=Number(r.total)})
  const sorted=Object.entries(months).sort((a,b)=>b[0].localeCompare(a[0])).map(([month,v])=>({month,...v,profit:v.sales-v.expenses}))
  const totS=sorted.reduce((a,m)=>a+m.sales,0),totE=sorted.reduce((a,m)=>a+m.expenses,0),totP=totS-totE
  return(
    <div>
      <div style={{fontSize:20,fontWeight:700,marginBottom:18}}>Profit & Loss</div>
      <Card><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,textAlign:'center'}}>{[['Sales',fmt(totS),'#4CAF50'],['Expenses',fmt(totE),'#E53935'],['Profit',fmt(totP),'#4CAF50']].map(([l,v,c])=><div key={l}><div style={{fontSize:10,color:'rgba(255,255,255,0.25)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>{l}</div><div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div></div>)}</div></Card>
      <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.25)',marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>Vaibhav / Prajwal split (50-50)</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18}}><Card><div style={{fontSize:11,color:'rgba(255,255,255,0.25)'}}>Vaibhav</div><div style={{fontSize:18,fontWeight:700}}>{fmt(totP/2)}</div></Card><Card><div style={{fontSize:11,color:'rgba(255,255,255,0.25)'}}>Prajwal</div><div style={{fontSize:18,fontWeight:700}}>{fmt(totP/2)}</div></Card></div>
      {sorted.map(m=>{const p=m.sales-m.expenses;return<Card key={m.month}><div style={{fontWeight:700,marginBottom:6}}>{m.month}</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,fontSize:13}}><div><span style={{color:'rgba(255,255,255,0.25)'}}>Sales</span><br/><span style={{fontWeight:600,color:'#4CAF50'}}>{fmt(m.sales)}</span></div><div><span style={{color:'rgba(255,255,255,0.25)'}}>Expenses</span><br/><span style={{fontWeight:600,color:'#E53935'}}>{fmt(m.expenses)}</span></div><div><span style={{color:'rgba(255,255,255,0.25)'}}>Profit</span><br/><span style={{fontWeight:700,color:'#4CAF50'}}>{fmt(p)}</span></div></div><div style={{marginTop:8}}><div style={{height:4,borderRadius:2,background:'rgba(255,255,255,0.04)',overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(100,(m.expenses/m.sales)*100)}%`,background:'#4CAF50',borderRadius:2}}/></div><div style={{fontSize:10,color:'rgba(255,255,255,0.15)',marginTop:3}}>Margin: {((p/m.sales)*100).toFixed(1)}%</div></div></Card>})}
      {sorted.length===0&&<div style={{textAlign:'center',color:'rgba(255,255,255,0.2)',padding:40}}>Add orders and expenses to see P&L.</div>}
    </div>
  )
}
```

Commit it, then click **"Tikoz-app"** to go back to root.

**Step 2: Edit the main TikozApp.js to remove the admin button**

Go to `components/` → click `TikozApp.js` → click the **pencil icon** → find this block (it's the admin button on the landing page):
```
        <button onClick={onAdmin} style
