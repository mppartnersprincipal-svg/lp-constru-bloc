import React from 'react';
export function Tabs({items=[],value,defaultValue,onChange,style}){
  const [v,setV]=React.useState(defaultValue??items[0]?.value); const cur=value??v;
  return <div role="tablist" style={{display:'flex',gap:4,borderBottom:'2px solid var(--border-default)',fontFamily:'var(--font-body)',...style}}>
    {items.map(it=>{const on=it.value===cur;return <button key={it.value} role="tab" aria-selected={on} onClick={()=>{setV(it.value);onChange&&onChange(it.value)}} style={{border:0,background:'transparent',padding:'12px 18px',marginBottom:-2,borderBottom:'3px solid '+(on?'var(--color-accent)':'transparent'),color:on?'var(--text-heading)':'var(--text-muted)',fontWeight:700,fontSize:14,textTransform:'uppercase',letterSpacing:'.04em',cursor:'pointer',transition:'color var(--dur-fast)'}}>{it.label}</button>})}
  </div>;
}
