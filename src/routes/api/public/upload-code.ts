import { createFileRoute } from '@tanstack/react-router';
import { filePath } from '@/lib/chat-rules';
const MAX = 20 * 1024 * 1024;
export const Route = createFileRoute('/api/public/upload-code')({server:{handlers:{POST:async({request})=>{
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return new Response('Origem inválida.',{status:403});
  const form = await request.formData().catch(()=>null);
  const code = String(form?.get('code') ?? '').trim().toUpperCase();
  const files = (form?.getAll('files') ?? []).filter((f): f is File => f instanceof File);
  if (!/^[A-Z0-9]{6}$/.test(code)) return new Response('Código inválido.',{status:400});
  if (!files.length) return new Response('Selecione um arquivo.',{status:400});
  if (files.some(f=>f.size>MAX)) return new Response('Cada arquivo pode ter no máximo 20 MB.',{status:400});
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data } = await supabaseAdmin.from('upload_codes').select('user_id').eq('code',code).maybeSingle();
  if (!data) return new Response('Código não encontrado.',{status:404});
  for (const f of files) { const { error } = await supabaseAdmin.storage.from('account-files').upload(filePath(data.user_id, crypto.randomUUID(), f.name), f, { contentType: f.type || undefined }); if (error) return new Response('Não foi possível salvar o arquivo.',{status:500}); }
  return new Response('ok');
}}}});
