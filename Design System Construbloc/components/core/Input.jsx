import React from 'react';
export function Input({label,hint,error,icon,type='text',style,...rest}){
  const [f,setF]=React.useState(false);
  const border=error?'var(--cb-danger)':f?'var(--color-primary)':'var(--border-default)';
  return <label style={{display:'grid',gap:6,fontFamily:'var(--font-body)',...style}}>
    {label&&<span style={{fontSize:13,fontWeight:600,color:'var(--text-heading)'}}>{label}</span>}
    <span style={{display:'flex',alignItems:'center',gap:10,height:46,padding:'0 14px',background:'#fff',border:'2px solid '+border,borderRadius:'var(--radius-sm)',boxShadow:f?'var(--focus-ring)':'none',transition:'border-color var(--dur-fast), box-shadow var(--dur-fast)'}}>
      {icon&&<span style={{color:'var(--text-muted)',display:'grid'}}>{icon}</span>}
      <input type={type} {...rest} onFocus={e=>{setF(true);rest.onFocus&&rest.onFocus(e)}} onBlur={e=>{setF(false);rest.onBlur&&rest.onBlur(e)}} style={{flex:1,border:0,outline:0,background:'transparent',font:'inherit',fontSize:15,color:'var(--cb-ink-900)'}}/>
    </span>
    {(error||hint)&&<span style={{fontSize:12,color:error?'var(--cb-danger)':'var(--text-muted)'}}>{error||hint}</span>}
  </label>;
}
