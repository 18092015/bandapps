import { streamText, convertToModelMessages, validateUIMessages, type UIMessage } from 'ai';
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/integrations/supabase/types';
import { messageText, ownsThread } from './chat-rules';

export async function handleChat(request: Request) {
 try {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return new Response('Origem inválida.',{status:403});
  const body = await request.json() as {messages: UIMessage[]; threadId?:string};
  const messages = await validateUIMessages({messages:body.messages});
  const last = messages.at(-1);
  if (!last || last.role !== 'user' || !messageText(last).trim()) return new Response('Digite uma pergunta.',{status:400});
  const first = messages[0];
  if (!first) return new Response('Digite uma pergunta.',{status:400});
  const token = request.headers.get('authorization')?.replace(/^Bearer /,'');
  const url = process.env['SUPABASE_URL']; const pub = process.env['SUPABASE_PUBLISHABLE_KEY'];
  const db = token && url && pub ? createClient<Database>(url,pub,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers); if(h.get('Authorization')===`Bearer ${pub}`) h.delete('Authorization'); h.set('apikey',pub); return fetch(input,{...init,headers:h});},headers:{Authorization:`Bearer ${token}`}}}) : undefined;
  if(token && !db) return new Response('As contas estão indisponíveis.',{status:503});
  let userId: string | undefined;
  if(token && db){const {data,error}=await db.auth.getUser(token); if(error || !data.user) return new Response('Entre novamente na sua conta.',{status:401}); userId=data.user.id;}
  if(body.threadId && userId && db){
   const {data,error}=await db.from('chat_threads').select('user_id').eq('id',body.threadId).single();
   if(error || !data || !ownsThread(userId,data.user_id)) return new Response('Conversa não encontrada nesta conta.',{status:403});
   const saved=await db.from('chat_messages').upsert({thread_id:body.threadId,user_id:userId,message_id:last.id,message:JSON.parse(JSON.stringify(last)) as Json},{onConflict:'thread_id,message_id'});
   if(saved.error) return new Response('Não foi possível salvar sua pergunta.',{status:500});
  }
  let gatewayFailureMessage='Não foi possível receber a resposta do Gemini.';
  const result=streamText({model:'google/gemini-3.8-flash',system:'Você é um assistente útil. Responda em português, de forma clara. Considere todas as mensagens da conversa.',messages:await convertToModelMessages(messages),abortSignal:request.signal,maxRetries:0,onError:({error})=>{console.error('Gemini request failed',error);if(error instanceof Error&&error.message.includes('valid credit card on file'))gatewayFailureMessage='O Gemini está pronto, mas o AI Gateway precisa de um cartão cadastrado na Vercel para liberar as chamadas. Ative a cobrança de AI Gateway e tente novamente.';}});
  const response=result.toUIMessageStreamResponse({originalMessages:messages,onError:()=>gatewayFailureMessage,onFinish:async({responseMessage})=>{
   if(!body.threadId || !userId || !db) return;
   const {error}=await db.from('chat_messages').upsert({thread_id:body.threadId,user_id:userId,message_id:responseMessage.id,message:JSON.parse(JSON.stringify(responseMessage)) as Json},{onConflict:'thread_id,message_id'});
   if(error) throw new Error('A resposta apareceu, mas não foi possível salvá-la.');
   const updated=await db.from('chat_threads').update({title:messageText(first).slice(0,80)||'Nova conversa',updated_at:new Date().toISOString()}).eq('id',body.threadId).eq('user_id',userId);
   if(updated.error) throw new Error('Não foi possível atualizar a conversa.');
  },headers:{'Cache-Control':'no-store'}});
  return response;
 } catch(error) { if(request.signal.aborted) return new Response(null,{status:499}); console.error('Chat request failed',error); return new Response('Não foi possível enviar a pergunta.',{status:400}); }
}
