import React from 'react';
export function Tag({selected,onClick,onRemove,children,style}){
  const [h,setH]=React.useState(false);
  return <span onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{display:'inline-flex',alignItems:'center',gap:8,height:36,padding:'0 14px',borderRadius:'var(--radius-pill)',border:'2px solid '+(selected?'var(--color-primary)':'var(--border-default)'),background:selected?'var(--color-primary)':h?'var(--cb-blue-50)':'#fff',color:selected?'#fff':'var(--text-heading)',fontFamily:'var(--font-body)',fontWeight:600,fontSize:14,cursor:onClick?'pointer':'default',transition:'all var(--dur-fast)',...style}}>
    {children}{onRemove&&<button onClick={e=>{e.stopPropagation();onRemove()}} aria-label="Remover" style={{border:0,background:'transparent',color:'inherit',cursor:'pointer',padding:0,display:'grid'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>}
  </span>;
}
