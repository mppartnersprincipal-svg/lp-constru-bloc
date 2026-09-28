import React from 'react';
export function Accordion({items=[],defaultOpen=0,style}){
  const [open,setOpen]=React.useState(defaultOpen);
  return <div style={{display:'grid',gap:8,fontFamily:'var(--font-body)',...style}}>
    {items.map((it,i)=>{const on=open===i;return <div key={i} style={{border:'1px solid '+(on?'var(--color-primary)':'var(--border-default)'),borderRadius:'var(--radius-md)',background:'#fff',overflow:'hidden'}}>
      <button onClick={()=>setOpen(on?-1:i)} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,padding:'16px 20px',border:0,background:'transparent',textAlign:'left',cursor:'pointer',font:'inherit',fontWeight:700,fontSize:16,color:'var(--text-heading)'}}>
        {it.title}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{flex:'none',color:on?'var(--color-accent-hover)':'var(--color-primary)',transform:on?'rotate(180deg)':'none',transition:'transform var(--dur-base) var(--ease-out)'}}><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {on&&<div style={{padding:'0 20px 18px',fontSize:15,lineHeight:1.6,color:'var(--text-body)'}}>{it.content}</div>}
    </div>})}
  </div>;
}
