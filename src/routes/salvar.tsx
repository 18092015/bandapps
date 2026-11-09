import { createFileRoute } from '@tanstack/react-router';
import { HubShell } from '@/components/hub/hub-shell';
export const Route=createFileRoute('/salvar')({head:()=>({meta:[{title:'Meus arquivos — Colband Hub'},{name:'description',content:'Guarde e acesse seus arquivos privados na conta Colband Hub.'},{property:'og:title',content:'Meus arquivos — Colband Hub'},{property:'og:description',content:'Guarde e acesse seus arquivos privados na conta Colband Hub.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:()=> <HubShell section="salvar"/>});
