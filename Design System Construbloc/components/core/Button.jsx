import React from 'react';
const base={display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'var(--font-body)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',border:'2px solid transparent',borderRadius:'var(--radius-sm)',cursor:'pointer',transition:'background var(--dur-fast) var(--ease-out), color var(--dur-fast), transform var(--dur-fast)',whiteSpace:'nowrap'};
const sizes={sm:{height:36,padding:'0 14px',fontSize:13},md:{height:44,padding:'0 20px',fontSize:14},lg:{height:54,padding:'0 28px',fontSize:16}};
const variants={
  primary:{bg:'var(--color-primary)',color:'#fff',hover:'var(--color-primary-hover)',active:'var(--color-primary-active)'},
  accent:{bg:'var(--color-accent)',color:'var(--color-on-accent)',hover:'var(--color-accent-hover)',active:'var(--cb-gold-600)'},
  outline:{bg:'transparent',color:'var(--color-primary)',border:'var(--color-primary)',hover:'var(--cb-blue-50)',active:'var(--cb-blue-100)'},
  ghost:{bg:'transparent',color:'var(--color-primary)',hover:'var(--cb-blue-50)',active:'var(--cb-blue-100)'},
  inverse:{bg:'#fff',color:'var(--color-primary)',hover:'var(--cb-blue-50)',active:'var(--cb-blue-100)'},
  whatsapp:{bg:'#25D366',color:'#062B16',hover:'#1EBE5A',active:'#18A34D'}
};
export function Button({variant='primary',size='md',icon,iconRight,fullWidth,disabled,children,style,...rest}){
  const v=variants[variant]||variants.primary;
  const [st,setSt]=React.useState('idle');
  const bg=st==='active'?v.active:st==='hover'?v.hover:v.bg;
  return <button disabled={disabled} {...rest}
    onMouseEnter={()=>setSt('hover')} onMouseLeave={()=>setSt('idle')} onMouseDown={()=>setSt('active')} onMouseUp={()=>setSt('hover')}
    style={{...base,...sizes[size],background:bg,color:v.color,borderColor:v.border||'transparent',width:fullWidth?'100%':undefined,opacity:disabled?.45:1,cursor:disabled?'not-allowed':'pointer',transform:st==='active'?'translateY(1px)':'none',...style}}>
    {icon}{children}{iconRight}
  </button>;
}
