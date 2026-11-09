import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
export const listThreads = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
 const {data,error} = await context.supabase.from('chat_threads').select('*').eq('user_id',context.userId).order('updated_at',{ascending:false});
 if(error) throw new Error('Não foi possível carregar as conversas.'); return data;
});
export const createThread = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
 const {data,error} = await context.supabase.from('chat_threads').insert({user_id:context.userId}).select().single();
 if(error) throw new Error('Não foi possível criar a conversa.'); return data;
});
export const loadThread = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid()})).handler(async ({data,context}) => {
 const thread = await context.supabase.from('chat_threads').select('*').eq('id',data.id).eq('user_id',context.userId).single();
 if(thread.error) throw new Error('Conversa não encontrada nesta conta.');
 const messages = await context.supabase.from('chat_messages').select('message').eq('thread_id',data.id).eq('user_id',context.userId).order('created_at');
 if(messages.error) throw new Error('Não foi possível carregar as mensagens.');
 return {thread:thread.data,messages:messages.data.map(m=>m.message)};
});
export const deleteThread = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid()})).handler(async ({data,context}) => {
 const {error} = await context.supabase.from('chat_threads').delete().eq('id',data.id).eq('user_id',context.userId); if(error) throw new Error('Não foi possível excluir a conversa.'); return {ok:true};
});
