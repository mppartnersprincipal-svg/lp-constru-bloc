import React from 'react';
export function Dialog({open,onClose,title,children,footer,width=520}){
  if(!open) return null;
  return <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,8,56,.6)',display:'grid',placeItems:'center',padding:24,zIndex:50}}>
    <div role="dialog" onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:width,background:'#fff',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-lg)',overflow:'hidden',fontFamily:'var(--font-body)'}}>
      <div style={{height:6,background:'var(--gradient-gold)'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px 0'}}>
        <h3 style={{fontSize:22}}>{title}</h3>
        <button onClick={onClose} aria-label="Fechar" style={{border:0,background:'transparent',cursor:'pointer',color:'var(--text-muted)',display:'grid'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>
      <div style={{padding:'16px 24px 24px',fontSize:15,lineHeight:1.6}}>{children}</div>
      {footer&&<div style={{display:'flex',justifyContent:'flex-end',gap:10,padding:'0 24px 24px'}}>{footer}</div>}
    </div>
  </div>;
}
