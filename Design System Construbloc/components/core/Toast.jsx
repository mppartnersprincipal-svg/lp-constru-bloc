import React from 'react';
export function Toast({tone='info',title,children,onClose,style}){
  const c={info:'var(--color-primary)',success:'var(--cb-success)',warning:'var(--cb-warning)',danger:'var(--cb-danger)'}[tone];
  return <div role="status" style={{display:'flex',gap:12,alignItems:'flex-start',minWidth:280,maxWidth:420,padding:'14px 16px',background:'var(--surface-dark)',color:'#fff',borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-lg)',borderLeft:'4px solid '+c,fontFamily:'var(--font-body)',...style}}>
    <div style={{flex:1}}>{title&&<div style={{fontWeight:700,fontSize:15}}>{title}</div>}{children&&<div style={{fontSize:14,opacity:.85,marginTop:2}}>{children}</div>}</div>
    {onClose&&<button onClick={onClose} aria-label="Fechar" style={{border:0,background:'transparent',color:'#fff',opacity:.7,cursor:'pointer',display:'grid'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>}
  </div>;
}
