// Construbloc landing page — composes components/core via window NS (loaded by index.html)
const {Button,IconButton,Input,Select,Badge,Tag,Card,Tabs,Accordion,Toast,Dialog}=window.CB;
const I=({d,s=20,w=2.2})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">{d.split('|').map((p,i)=><path key={i} d={p}/>)}</svg>;
const ic={menu:'M4 6h16M4 12h16M4 18h16',wa:'M20 12a8 8 0 0 1-11.7 7.1L4 20l1-4.1A8 8 0 1 1 20 12z',arrow:'M5 12h14M12 5l7 7-7 7',pin:'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z|M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 6v6l4 2',truck:'M10 17h4V5H2v12h3|M20 17h2v-3.3a1 1 0 0 0-.3-.7L18 9h-4v8h1|M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z|M17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',card:'M2 5h20v14H2z|M2 10h20',phone:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z',search:'m21 21-4.3-4.3|M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z',check:'M20 6 9 17l-5-5',ig:'M17 3H7a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4z|M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z|M17.5 6.5h0'};
const Wrap=({children,style})=><div style={{maxWidth:'var(--container-max)',margin:'0 auto',padding:'0 var(--container-pad)',...style}}>{children}</div>;
const Eyebrow=({children,light})=><div style={{font:'600 13px var(--font-label)',letterSpacing:'.18em',textTransform:'uppercase',color:light?'var(--cb-gold-400)':'var(--cb-gray-500)',marginBottom:12}}>{children}</div>;
const Ph=({label,ratio='4/3',dark,style})=><div style={{aspectRatio:ratio,background:dark?'repeating-linear-gradient(135deg,#0A1A5A 0 12px,#0D2070 12px 24px)':'repeating-linear-gradient(135deg,#E8EAF2 0 12px,#F3F4F8 12px 24px)',borderRadius:'var(--radius-md)',display:'grid',placeItems:'center',color:dark?'rgba(255,255,255,.55)':'var(--text-muted)',font:'600 12px var(--font-label)',letterSpacing:'.14em',textTransform:'uppercase',textAlign:'center',padding:12,...style}}>{label}</div>;

function Header({onQuote}){
  return <header style={{position:'sticky',top:0,zIndex:20,background:'#fff',borderBottom:'1px solid var(--border-default)'}}>
    <div style={{background:'var(--surface-dark)',color:'#fff',fontSize:13,fontWeight:500}}><Wrap style={{display:'flex',justifyContent:'space-between',alignItems:'center',height:34,gap:16}}>
      <span style={{display:'flex',gap:8,alignItems:'center'}}><span style={{color:'var(--cb-gold-400)',display:'grid'}}><I d={ic.clock} s={15}/></span>Abertos todos os dias, incluindo sábados, domingos e feriados</span>
      <span style={{display:'flex',gap:18}}><span>(62) 3579-1166</span><span>(62) 98243-0522</span></span></Wrap></div>
    <Wrap style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:78,gap:24}}>
      <img src="../../assets/logo-color.png" alt="Construbloc" style={{height:56}}/>
      <nav style={{display:'flex',gap:28,font:'600 14px var(--font-body)',textTransform:'uppercase',letterSpacing:'.04em'}}>{['Produtos','Marcas','Entregas','Lojas','Contato'].map(l=><a key={l} href="#" style={{color:'var(--text-heading)'}}>{l}</a>)}</nav>
      <div style={{display:'flex',gap:10}}><Button variant="outline" size="sm" onClick={onQuote}>Orçamento</Button><Button variant="whatsapp" size="sm" icon={<I d={ic.wa} s={16}/>}>WhatsApp</Button></div>
    </Wrap></header>;
}
function Hero({onQuote}){
  return <section style={{background:'var(--surface-brand)',color:'#fff',position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',left:0,right:0,top:0,height:8,background:'var(--gradient-gold)'}}/>
    <img src="../../assets/symbol-white.png" alt="" style={{position:'absolute',right:-60,bottom:-40,width:620,opacity:.07,pointerEvents:'none'}}/>
    <Wrap style={{display:'grid',gridTemplateColumns:'1.1fr .9fr',gap:48,alignItems:'center',padding:'88px var(--container-pad) 96px'}}>
      <div><Eyebrow light>Materiais de construção e ferragista · Goiânia</Eyebrow>
        <h1 style={{color:'#fff',fontSize:'var(--text-5xl)'}}>Tudo para <span style={{color:'var(--cb-gold-400)'}}>sua obra</span>, em um só lugar</h1>
        <p style={{fontSize:'var(--text-lg)',lineHeight:'var(--leading-relaxed)',opacity:.9,maxWidth:520,margin:'20px 0 32px'}}>Qualidade, grandes marcas e preços acessíveis. Do cimento ao acabamento, com entrega e parcelamento em até 12x.</p>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Button variant="accent" size="lg" iconRight={<I d={ic.arrow} s={18}/>}>Ver produtos</Button><Button variant="inverse" size="lg" onClick={onQuote}>Pedir orçamento</Button></div>
        <div style={{display:'flex',gap:28,marginTop:40,flexWrap:'wrap'}}>{[['2','unidades na Av. Madrid'],['7 dias','por semana'],['12x','no cartão']].map(([n,l])=><div key={l}><div style={{font:'28px var(--font-display)',color:'var(--cb-gold-400)'}}>{n}</div><div style={{fontSize:13,opacity:.8}}>{l}</div></div>)}</div></div>
      <Ph dark label="Foto da loja / fachada Construbloc" ratio="4/3" style={{clipPath:'polygon(0 12%,100% 0,100% 100%,0 100%)',borderRadius:0}}/>
    </Wrap></section>;
}
function Categories(){
  const cats=['Cimento e argamassa','Hidráulica','Elétrica','Tintas','Ferramentas','Pisos e revestimentos','Telhas e madeiras','Ferragens'];
  return <section style={{padding:'var(--section-pad-y) 0'}}><Wrap>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:24,marginBottom:32,flexWrap:'wrap'}}><div><Eyebrow>Categorias</Eyebrow><h2 style={{fontSize:'var(--text-3xl)'}}>O que você precisa hoje?</h2></div><Button variant="ghost" iconRight={<I d={ic.arrow} s={16}/>}>Todas as categorias</Button></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:16}}>{cats.map(c=><Card key={c} variant="default" padding={0} hoverable style={{overflow:'hidden',cursor:'pointer'}}><Ph label={c} ratio="4/3" style={{borderRadius:0}}/><div style={{padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',fontWeight:700,color:'var(--text-heading)'}}>{c}<span style={{color:'var(--color-accent-hover)',display:'grid'}}><I d={ic.arrow} s={16}/></span></div></Card>)}</div>
  </Wrap></section>;
}
function Benefits(){
  const items=[[ic.clock,'Abertos todos os dias','Incluindo sábados, domingos e feriados. Sua obra não para, nós também não.'],[ic.truck,'Entregamos na sua obra','Frota própria para Goiânia e região. Consulte o prazo para o seu bairro.'],[ic.card,'Parcele em até 12x','Cartão de débito e crédito, PIX e parcelamento (consulte condições).'],[ic.check,'Grandes marcas','Tigre, Tramontina, Quartzolit, Suvinil, Lorenzetti, Votomassa e mais.']];
  return <section style={{background:'var(--surface-alt)',padding:'var(--section-pad-y) 0'}}><Wrap>
    <Eyebrow>Por que a Construbloc</Eyebrow><h2 style={{fontSize:'var(--text-3xl)',marginBottom:36}}>Feita para quem constrói de verdade</h2>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:16}}>{items.map(([d,t,s])=><Card key={t} variant="elevated" padding={28}><div style={{width:48,height:48,borderRadius:'var(--radius-sm)',background:'var(--color-accent-soft)',color:'var(--cb-blue-900)',display:'grid',placeItems:'center',marginBottom:18}}><I d={d} s={24}/></div><h4 style={{fontSize:18,marginBottom:8}}>{t}</h4><p style={{margin:0,fontSize:15,lineHeight:1.6,color:'var(--text-muted)'}}>{s}</p></Card>)}</div>
  </Wrap></section>;
}
function Brands(){
  const b=['Tigre','Tramontina','Quartzolit','Suvinil','Lorenzetti','Votomassa','Atlas','Blukit'];
  return <section style={{padding:'56px 0',borderBottom:'1px solid var(--border-default)'}}><Wrap>
    <div style={{textAlign:'center',font:'600 13px var(--font-label)',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--cb-gray-500)',marginBottom:24}}>Marcas que você encontra aqui</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(8,minmax(0,1fr))',gap:12}}>{b.map(n=><div key={n} style={{height:64,border:'1px dashed var(--border-strong)',borderRadius:'var(--radius-sm)',display:'grid',placeItems:'center',font:'700 13px var(--font-body)',color:'var(--text-muted)',textTransform:'uppercase'}}>{n}</div>)}</div>
  </Wrap></section>;
}
function Stores(){
  const [u,setU]=React.useState('u1');
  const data={u1:{name:'Unidade 1',addr:'Av. Madrid, nº 275 — Jardim Europa, Goiânia — GO',tel:'(62) 3579-1166 · (62) 98243-0522'},u2:{name:'Unidade 2',addr:'Av. Madrid, nº 420 — Jardim Europa, Goiânia — GO',tel:'(62) 98331-5040'}};
  const d=data[u];
  return <section style={{padding:'var(--section-pad-y) 0'}}><Wrap style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'start'}}>
    <div><Eyebrow>Nossas lojas</Eyebrow><h2 style={{fontSize:'var(--text-3xl)',marginBottom:24}}>Duas unidades na Av. Madrid</h2>
      <Tabs items={[{value:'u1',label:'Unidade 1'},{value:'u2',label:'Unidade 2'}]} value={u} onChange={setU}/>
      <div style={{display:'grid',gap:18,marginTop:24,fontSize:16}}>
        <div style={{display:'flex',gap:12}}><span style={{color:'var(--color-primary)',display:'grid',flex:'none'}}><I d={ic.pin}/></span><span>{d.addr}</span></div>
        <div style={{display:'flex',gap:12}}><span style={{color:'var(--color-primary)',display:'grid',flex:'none'}}><I d={ic.phone}/></span><span>{d.tel}</span></div>
        <div style={{display:'flex',gap:12}}><span style={{color:'var(--color-primary)',display:'grid',flex:'none'}}><I d={ic.clock}/></span><span>Todos os dias · 7h às 18h <Badge tone="gold" style={{marginLeft:8}}>Domingos e feriados</Badge></span></div></div>
      <div style={{display:'flex',gap:12,marginTop:28}}><Button variant="primary">Como chegar</Button><Button variant="whatsapp" icon={<I d={ic.wa} s={16}/>}>Chamar a {d.name}</Button></div></div>
    <Ph label={'Mapa · '+d.name} ratio="4/3"/>
  </Wrap></section>;
}
function Faq(){
  return <section style={{background:'var(--surface-alt)',padding:'var(--section-pad-y) 0'}}><Wrap style={{maxWidth:820}}>
    <Eyebrow>Dúvidas frequentes</Eyebrow><h2 style={{fontSize:'var(--text-3xl)',marginBottom:28}}>Perguntas antes de comprar</h2>
    <Accordion items={[{title:'Fazem entrega? Qual o prazo?',content:'Sim. Entregamos em Goiânia e região com frota própria. O prazo varia por bairro e volume; confirme pelo WhatsApp na hora do pedido.'},{title:'Quais formas de pagamento aceitam?',content:'PIX, cartão de débito e crédito. Parcelamos em até 12x (consulte nossas condições).'},{title:'Vendem online?',content:'Sim. Envie a lista de materiais pelo WhatsApp e retornamos com o orçamento e as opções de entrega.'},{title:'Abrem aos domingos?',content:'Abrimos todos os dias, incluindo sábados, domingos e feriados.'}]}/>
  </Wrap></section>;
}
function Cta({onQuote}){
  return <section style={{background:'var(--surface-dark)',color:'#fff',clipPath:'polygon(0 48px,100% 0,100% 100%,0 100%)',padding:'calc(var(--section-pad-y) + 48px) 0 var(--section-pad-y)'}}><Wrap style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:40,alignItems:'center'}}>
    <div><Eyebrow light>Orçamento rápido</Eyebrow><h2 style={{color:'#fff',fontSize:'var(--text-4xl)'}}>Mande sua lista, a gente cota</h2><p style={{fontSize:'var(--text-lg)',opacity:.85,marginTop:16}}>Retorno em horário comercial pelo WhatsApp com preço, disponibilidade e prazo de entrega.</p></div>
    <Card variant="default" padding={28} style={{color:'var(--text-body)'}}><div style={{display:'grid',gap:14}}><Input label="Nome" placeholder="Seu nome"/><Input label="WhatsApp" placeholder="(62) 9 0000-0000"/><Select label="Tipo de obra" options={['Reforma','Construção nova','Acabamento','Manutenção']}/><Button variant="accent" size="lg" fullWidth onClick={onQuote}>Solicitar orçamento</Button></div></Card>
  </Wrap></section>;
}
function Footer(){
  return <footer style={{background:'var(--surface-dark)',color:'#fff',padding:'56px 0 28px',borderTop:'1px solid rgba(255,255,255,.08)'}}><Wrap>
    <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr 1fr',gap:40}}>
      <div><img src="../../assets/logo-white.png" alt="Construbloc" style={{height:72}}/><p style={{fontSize:14,opacity:.75,maxWidth:300,marginTop:14}}>Materiais de construção e ferragista em Goiânia. Qualidade, grandes marcas e preços acessíveis.</p><a href="#" style={{display:'inline-flex',gap:8,alignItems:'center',color:'var(--cb-gold-400)',fontWeight:600,fontSize:14,marginTop:8}}><I d={ic.ig} s={18}/>@construbloc_</a></div>
      {[['Produtos',['Cimento e argamassa','Hidráulica','Elétrica','Tintas','Ferramentas']],['Loja',['Entregas','Pagamento','Marcas','Trabalhe conosco']],['Contato',['(62) 3579-1166','(62) 98243-0522','Av. Madrid, 275','Av. Madrid, 420']]].map(([t,ls])=><div key={t}><div style={{font:'600 12px var(--font-label)',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--cb-gold-400)',marginBottom:14}}>{t}</div><div style={{display:'grid',gap:10,fontSize:14}}>{ls.map(l=><a key={l} href="#" style={{color:'rgba(255,255,255,.8)'}}>{l}</a>)}</div></div>)}
    </div>
    <div style={{display:'flex',justifyContent:'space-between',gap:16,marginTop:44,paddingTop:20,borderTop:'1px solid rgba(255,255,255,.1)',fontSize:13,opacity:.6}}><span>© 2026 Construbloc — Materiais de Construção e Ferragista</span><span>Goiânia — GO</span></div>
  </Wrap></footer>;
}
function Site(){
  const [q,setQ]=React.useState(false);const [toast,setToast]=React.useState(false);
  return <div style={{fontFamily:'var(--font-body)',color:'var(--text-body)',background:'var(--surface-page)'}}>
    <Header onQuote={()=>setQ(true)}/><Hero onQuote={()=>setQ(true)}/><Categories/><Benefits/><Brands/><Stores/><Faq/><Cta onQuote={()=>setQ(true)}/><Footer/>
    <Dialog open={q} onClose={()=>setQ(false)} title="Solicitar orçamento" footer={<><Button variant="ghost" onClick={()=>setQ(false)}>Cancelar</Button><Button variant="accent" onClick={()=>{setQ(false);setToast(true);setTimeout(()=>setToast(false),3500)}}>Enviar pelo WhatsApp</Button></>}>
      <div style={{display:'grid',gap:14}}><Input label="Nome" placeholder="Seu nome"/><Input label="WhatsApp" placeholder="(62) 9 0000-0000"/><Input label="Lista de materiais" placeholder="Ex.: 20 sacos de cimento, 10 m de cano 25mm"/></div></Dialog>
    {toast&&<div style={{position:'fixed',right:24,bottom:24,zIndex:60}}><Toast tone="success" title="Pedido enviado" onClose={()=>setToast(false)}>Retornamos pelo WhatsApp em horário comercial.</Toast></div>}
    <a href="#" aria-label="WhatsApp" style={{position:'fixed',right:24,bottom:toast?110:24,width:56,height:56,borderRadius:'50%',background:'#25D366',color:'#062B16',display:'grid',placeItems:'center',boxShadow:'var(--shadow-lg)',zIndex:55,transition:'bottom var(--dur-base)'}}><I d={ic.wa} s={28}/></a>
  </div>;
}
window.Site=Site;
