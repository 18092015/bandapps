import { createFileRoute } from '@tanstack/react-router';
import { HubShell } from '@/components/hub/hub-shell';
export const Route=createFileRoute('/gravador')({head:()=>({meta:[{title:'Gravador — Colband Hub'},{name:'description',content:'Acesse o gravador no Colband Hub.'},{property:'og:title',content:'Gravador — Colband Hub'},{property:'og:description',content:'Acesse o gravador no Colband Hub.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <HubShell section="gravador"/>});
