import React from 'react';
export function IconButton({variant='ghost',size=40,label,children,style,...rest}){
  const [h,setH]=React.useState(false);
  const styles={ghost:{bg:h?'var(--cb-blue-50)':'transparent',color:'var(--color-primary)'},solid:{bg:h?'var(--color-primary-hover)':'var(--color-primary)',color:'#fff'},accent:{bg:h?'var(--color-accent-hover)':'var(--color-accent)',color:'var(--color-on-accent)'},inverse:{bg:h?'rgba(255,255,255,.18)':'rgba(255,255,255,.1)',color:'#fff'}}[variant];
  return <button aria-label={label} title={label} {...rest} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{width:size,height:size,display:'inline-grid',placeItems:'center',border:0,borderRadius:'var(--radius-sm)',background:styles.bg,color:styles.color,cursor:'pointer',transition:'background var(--dur-fast)',...style}}>{children}</button>;
}
