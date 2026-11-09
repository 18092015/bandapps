import { streamText, convertToModelMessages, validateUIMessages, type UIMessage } from 'ai';
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/integrations/supabase/types';
import { createLovableAiGatewayProvider, withLovableAiGatewayRunIdHeader } from './ai/gateway-helpers.ts';
import { messageText, ownsThread } from './chat-rules';

export async function handleChat(request: Request) {
 try {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return new Response('Origem inválida.',{status:403});
  const body = await request.json() as {messages: UIMessage[]; threadId?:string};
  const messages = await validateUIMessages({messages:body.messages});
  const last = messages.at(-1);
  if (!last || last.role !== 'user' || !messageText(last).trim()) return new Response('Digite uma pergunta.',{status:400});
  const key = process.env['LOVABLE_API_KEY'];
  if(!key) return new Response('A conexão com o Gemini não está configurada.',{status:401});
  const token = request.headers.get('authorization')?.replace(/^Bearer /,'');
  const url = process.env['SUPABASE_URL']; const pub = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if(!url || !pub) return new Response('As contas estão indisponíveis.',{status:503});
  const db = createClient<Database>(url,pub,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers); if(h.get('Authorization')===`Bearer ${pub}`) h.delete('Authorization'); h.set('apikey',pub); return fetch(input,{...init,headers:h});},headers:token?{Authorization:`Bearer ${token}`}:{}}});
  let userId: string | undefined;
  if(token){const {data,error}=await db.auth.getUser(token); if(error || !data.user) return new Response('Entre novamente na sua conta.',{status:401}); userId=data.user.id;}
  if(body.threadId){
   if(!userId) return new Response('Entre para salvar esta conversa.',{status:401});
   const {data,error}=await db.from('chat_threads').select('user_id').eq('id',body.threadId).single();
   if(error || !data || !ownsThread(userId,data.user_id)) return new Response('Conversa não encontrada nesta conta.',{status:403});
   const saved=await db.from('chat_messages').upsert({thread_id:body.threadId,user_id:userId,message_id:last.id,message:JSON.parse(JSON.stringify(last)) as Json},{onConflict:'thread_id,message_id'});
   if(saved.error) return new Response('Não foi possível salvar sua pergunta.',{status:500});
  }
  const gateway=createLovableAiGatewayProvider(key,undefined,{baseURL:'https://ai.gateway.lovable.dev/v1'});
  let upstreamFailure: {status:number; message:string}|undefined;
  const originalFetch=gateway;
  // The gateway helper captures request-local correlation; preserve safe HTTP errors before streaming.
  const result=streamText({model:originalFetch('google/gemini-3.8-flash'),system:'Você é um assistente útil. Responda em português, de forma clara. Considere todas as mensagens da conversa.',messages:await convertToModelMessages(messages),abortSignal:request.signal,maxRetries:0,onError:({error})=>{const e=error as {statusCode?:number;responseBody?:string;message?:string}; let message=e.message ?? 'Não foi possível receber a resposta do Gemini.'; try {const j=JSON.parse(e.responseBody??'{}'); message=j.error?.message??j.message??message;} catch {} upstreamFailure={status:e.statusCode??500,message};}});
  const response=result.toUIMessageStreamResponse({originalMessages:messages,onError:()=>upstreamFailure?.message??'Não foi possível receber a resposta do Gemini.',onFinish:async({responseMessage})=>{
   if(!body.threadId || !userId) return;
   const {error}=await db.from('chat_messages').upsert({thread_id:body.threadId,user_id:userId,message_id:responseMessage.id,message:JSON.parse(JSON.stringify(responseMessage)) as Json},{onConflict:'thread_id,message_id'});
   if(error) throw new Error('A resposta apareceu, mas não foi possível salvá-la.');
   const updated=await db.from('chat_threads').update({title:messageText(messages[0]).slice(0,80)||'Nova conversa',updated_at:new Date().toISOString()}).eq('id',body.threadId).eq('user_id',userId);
   if(updated.error) throw new Error('Não foi possível atualizar a conversa.');
  }});
  const streamed=await withLovableAiGatewayRunIdHeader(response,gateway,{'Cache-Control':'no-store'});
  if(upstreamFailure) return new Response(upstreamFailure.message,{status:upstreamFailure.status});
  return streamed;
 } catch(error) { if(request.signal.aborted) return new Response(null,{status:499}); console.error('Chat request failed',error); return new Response('Não foi possível enviar a pergunta.',{status:400}); }
}
