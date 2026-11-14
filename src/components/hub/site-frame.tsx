import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
export function SiteFrame({url,title,fullscreen=false,bare=false}:{url:string;title:string;fullscreen?:boolean;bare?:boolean}){
 const ref=useRef<HTMLDivElement>(null); const [full,setFull]=useState(false);
 useEffect(()=>{const change=()=>setFull(document.fullscreenElement===ref.current);document.addEventListener('fullscreenchange',change);return()=>document.removeEventListener('fullscreenchange',change);},[]);
 async function toggle(){try{if(document.fullscreenElement) await document.exitFullscreen();else if(ref.current?.requestFullscreen) await ref.current.requestFullscreen();else toast.error('Este navegador não permite tela cheia.');}catch{toast.error('Não foi possível abrir em tela cheia neste navegador.');}}
 if(bare)return <iframe src={url} title={title} className="min-h-0 w-full flex-1 border-0 bg-card" allow="camera; microphone; clipboard-write; autoplay; fullscreen" allowFullScreen/>;
 return <div ref={ref} className="flex min-h-0 flex-1 flex-col gap-2 bg-background p-1"><div className="flex flex-wrap items-center justify-end gap-2">{fullscreen&&<Button size="sm" variant="outline" onClick={toggle}><span>{full?<Minimize/>:<Maximize/>}</span>{full?'Sair da tela cheia':'Tela cheia'}</Button>}<Button size="sm" variant="secondary" asChild><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink/>Abrir em nova aba</a></Button></div><iframe src={url} title={title} className="min-h-0 w-full flex-1 rounded-lg border bg-card" allow="camera; microphone; clipboard-write; autoplay; fullscreen" allowFullScreen/></div>;
}
