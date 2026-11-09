import { createFileRoute } from '@tanstack/react-router';
import { HubShell } from '@/components/hub/hub-shell';
export const Route=createFileRoute('/chat/$threadId')({head:()=>({meta:[{title:'Conversa Gemini — Colband Hub'},{name:'description',content:'Converse com o Gemini no Colband Hub.'},{property:'og:title',content:'Conversa Gemini — Colband Hub'},{property:'og:description',content:'Converse com o Gemini no Colband Hub.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:ChatPage});
function ChatPage(){const {threadId}=Route.useParams();return <HubShell threadId={threadId}/>;}
