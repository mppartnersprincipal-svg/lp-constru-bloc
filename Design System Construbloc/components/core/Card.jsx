import React from 'react';
export function Card({variant='default',padding=24,hoverable,children,style,...rest}){
  const [h,setH]=React.useState(false);
  const v={default:{background:'var(--surface-card)',border:'1px solid var(--border-default)',color:'var(--text-body)'},elevated:{background:'var(--surface-card)',boxShadow:h&&hoverable?'var(--shadow-lg)':'var(--shadow-md)',color:'var(--text-body)'},dark:{background:'var(--surface-dark)',color:'#fff'},brand:{background:'var(--surface-brand)',color:'#fff'},accent:{background:'var(--color-accent)',color:'var(--color-on-accent)'}}[variant];
  return <div {...rest} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{borderRadius:'var(--radius-md)',padding,transition:'transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base)',transform:h&&hoverable?'translateY(-3px)':'none',...v,...style}}>{children}</div>;
}
