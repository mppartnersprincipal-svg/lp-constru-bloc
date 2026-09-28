import React from 'react';
export function Select({label,options=[],style,...rest}){
  const [f,setF]=React.useState(false);
  return <label style={{display:'grid',gap:6,fontFamily:'var(--font-body)',...style}}>
    {label&&<span style={{fontSize:13,fontWeight:600,color:'var(--text-heading)'}}>{label}</span>}
    <span style={{position:'relative',display:'block'}}>
      <select {...rest} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{width:'100%',height:46,padding:'0 40px 0 14px',appearance:'none',background:'#fff',border:'2px solid '+(f?'var(--color-primary)':'var(--border-default)'),borderRadius:'var(--radius-sm)',font:'inherit',fontSize:15,color:'var(--cb-ink-900)',outline:0,boxShadow:f?'var(--focus-ring)':'none'}}>
        {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
      </select>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{position:'absolute',right:14,top:15,color:'var(--color-primary)',pointerEvents:'none'}}><path d="m6 9 6 6 6-6"/></svg>
    </span>
  </label>;
}
