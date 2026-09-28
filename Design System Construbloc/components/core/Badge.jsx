import React from 'react';
export function Badge({tone='blue',children,style}){
  const t={blue:{bg:'var(--cb-blue-100)',c:'var(--cb-blue-600)'},gold:{bg:'var(--color-accent-soft)',c:'var(--cb-blue-900)'},solid:{bg:'var(--color-primary)',c:'#fff'},accent:{bg:'var(--color-accent)',c:'var(--color-on-accent)'},gray:{bg:'var(--cb-surface-100)',c:'var(--text-muted)'},success:{bg:'#E3F3E8',c:'var(--cb-success)'},danger:{bg:'#FBE7E7',c:'var(--cb-danger)'}}[tone];
  return <span style={{display:'inline-flex',alignItems:'center',gap:6,height:24,padding:'0 10px',borderRadius:'var(--radius-xs)',background:t.bg,color:t.c,fontFamily:'var(--font-label)',fontWeight:700,fontSize:12,letterSpacing:'.12em',textTransform:'uppercase',whiteSpace:'nowrap',...style}}>{children}</span>;
}
