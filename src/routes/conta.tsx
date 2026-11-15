import { createFileRoute } from '@tanstack/react-router';
import { HubShell } from '@/components/hub/hub-shell';
export const Route=createFileRoute('/conta')({head:()=>({meta:[{title:'Conta — Colband Hub'},{name:'description',content:'Acesse sua conta no Colband Hub.'},{property:'og:title',content:'Conta — Colband Hub'},{property:'og:description',content:'Acesse sua conta no Colband Hub.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <HubShell section="conta"/>});
