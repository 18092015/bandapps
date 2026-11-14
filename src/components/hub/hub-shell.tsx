import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mic, ExternalLink, LayoutGrid, Image, Video } from 'lucide-react';
import { SiteFrame } from './site-frame';
import { AppsPanel } from './apps-panel';
import { siteLogoUrl } from '@/lib/brand';
export function HubShell({section='ia'}:{threadId?:string;section?:'ia'|'gravador'|'apps'}){
 const [ai,setAi]=useState<'perguntas'|'imagem'|'video'>('perguntas');
 const [expanded,setExpanded]=useState(section==='ia');
 const navigate=useNavigate();
 return <div className="flex h-dvh min-h-0 bg-background">
  <aside aria-label="Barra de ferramentas" className="flex w-20 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r bg-card px-1 py-4 sm:w-24 sm:px-2">
   <img src={siteLogoUrl} alt="Colband" className="mb-3 size-12 object-contain"/>
   <Button variant={section==='ia'?'default':'ghost'} className="h-auto w-full flex-col gap-1 px-1 py-2 text-xs" aria-expanded={section==='ia'&&expanded} aria-controls="ai-options" onClick={()=>{if(section==='ia')setExpanded(!expanded);else{setExpanded(true);void navigate({to:'/'});}}}><MessageSquare/>IA</Button>
   {section==='ia'&&expanded&&<div id="ai-options" className="mb-2 flex w-full flex-col gap-1 border-l border-border pl-1">{([{key:'perguntas',label:'Perguntas',icon:MessageSquare},{key:'imagem',label:'Imagem',icon:Image},{key:'video',label:'Vídeo',icon:Video}] as const).map(item=><Button key={item.key} variant={ai===item.key?'secondary':'ghost'} className="h-auto w-full flex-col gap-1 px-0 py-2 text-[10px] sm:text-xs" aria-pressed={ai===item.key} onClick={()=>setAi(item.key)}><item.icon/>{item.label}</Button>)}</div>}
   {([{key:'gravador',label:'Gravador',to:'/gravador',icon:Mic},{key:'apps',label:'Apps',to:'/apps',icon:LayoutGrid}] as const).map(item=><Button key={item.key} asChild variant={section===item.key?'default':'ghost'} className="h-auto w-full flex-col gap-1 px-1 py-2 text-xs"><Link to={item.to}><item.icon/>{item.label}</Link></Button>)}
   <Button asChild variant="ghost" className="h-auto w-full flex-col gap-1 px-1 py-2 text-xs"><a href="https://colbandcom.sharepoint.com/Pages/Colband.aspx" target="_blank" rel="noopener noreferrer"><ExternalLink/>Moodle</a></Button>
  </aside>
  <main className={`flex min-h-0 min-w-0 flex-1 flex-col ${section==='ia'?'':'gap-4 p-3 sm:p-4'}`}>
   {section!=='ia'&&<header><h1 className="text-lg font-bold">{section==='apps'?'Apps':'Gravador'}</h1></header>}
   {section==='ia'?<SiteFrame key={ai} title={ai==='perguntas'?'Perguntas':ai==='imagem'?'Vidnoz':'Loremotion'} url={ai==='perguntas'?'https://chat-and-constellation.lovable.app':ai==='imagem'?'https://pt.vidnoz.com/ia-gerador-de-imagens-gratis.html':'https://loremotion.com/generate'} bare/>:section==='apps'?<AppsPanel/>:<SiteFrame url="https://gravacaofake.lovable.app/" title="Gravador"/>}
  </main>
 </div>;
}
