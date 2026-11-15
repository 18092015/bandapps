import { createFileRoute } from '@tanstack/react-router';
import { HubShell } from '@/components/hub/hub-shell';
export const Route=createFileRoute('/notas')({head:()=>({meta:[{title:'Notas e faltas — Colband Hub'},{name:'description',content:'Acesse as notas e faltas no Colband Hub.'},{property:'og:title',content:'Notas e faltas — Colband Hub'},{property:'og:description',content:'Acesse as notas e faltas no Colband Hub.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <HubShell section="notas"/>});
