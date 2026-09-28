import React from 'react';
export function Checkbox({label,checked,defaultChecked,onChange,style}){
  const [c,setC]=React.useState(!!defaultChecked); const on=checked??c;
  return <label style={{display:'inline-flex',alignItems:'center',gap:10,cursor:'pointer',fontFamily:'var(--font-body)',fontSize:15,color:'var(--text-body)',...style}} onClick={()=>{setC(!on);onChange&&onChange(!on)}}>
    <span style={{width:22,height:22,borderRadius:'var(--radius-xs)',border:'2px solid '+(on?'var(--color-primary)':'var(--border-strong)'),background:on?'var(--color-primary)':'#fff',display:'grid',placeItems:'center',transition:'all var(--dur-fast)'}}>
      {on&&<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
    </span>{label}
  </label>;
}
