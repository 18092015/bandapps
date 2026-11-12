import { createFileRoute } from '@tanstack/react-router';
import { filePath } from '@/lib/chat-rules';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 5;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

type RequestedFile = { name: string; size: number; type: string };

export const Route = createFileRoute('/api/public/upload-code')({ server: { handlers: { POST: async ({ request }) => {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return json({ error: 'Origem inválida.' }, 403);
  if (Number(request.headers.get('content-length') ?? 0) > 64 * 1024) return json({ error: 'Solicitação muito grande.' }, 413);

  const body = await request.json().catch(() => null) as { code?: unknown; files?: unknown } | null;
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!/^[A-Z0-9]{6}$/.test(code)) return json({ error: 'Código inválido ou expirado.' }, 400);
  if (!Array.isArray(body?.files) || body.files.length < 1 || body.files.length > MAX_FILES) return json({ error: 'Selecione de 1 a 5 arquivos.' }, 400);

  const files: RequestedFile[] = [];
  for (const candidate of body.files) {
    if (!candidate || typeof candidate !== 'object') return json({ error: 'Dados de arquivo inválidos.' }, 400);
    const item = candidate as Record<string, unknown>;
    const name = item['name'];
    const size = item['size'];
    const type = item['type'];
    if (typeof name !== 'string' || !name.trim() || name.length > 255 || typeof size !== 'number' || !Number.isFinite(size) || size < 0 || size > MAX_FILE_SIZE || typeof type !== 'string' || type.length > 150) {
      return json({ error: 'Cada arquivo deve ter um nome válido e no máximo 20 MB.' }, 400);
    }
    files.push({ name: name.trim(), size, type });
  }

  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!serviceKey) return json({ error: 'O armazenamento não está configurado.' }, 500);
  const clientIp = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(serviceKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(clientIp)));
  const ipFingerprint = Array.from(signature, byte => byte.toString(16).padStart(2, '0')).join('');

  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: verification, error: verifyError } = await supabaseAdmin.rpc('verify_upload_code', { _code: code, _ip_fingerprint: ipFingerprint });
  if (verifyError) return json({ error: 'Não foi possível validar o código agora.' }, 500);
  const result = verification?.[0];
  if (result?.rate_limited) return json({ error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' }, 429);
  if (!result?.owner_user_id) return json({ error: 'Código inválido ou expirado.' }, 400);

  const uploads: { path: string; token: string }[] = [];
  for (const file of files) {
    const path = filePath(result.owner_user_id, crypto.randomUUID(), file.name);
    const { data, error } = await supabaseAdmin.storage.from('account-files').createSignedUploadUrl(path, { upsert: false });
    if (error || !data) return json({ error: 'Não foi possível preparar os arquivos.' }, 500);
    uploads.push({ path: data.path, token: data.token });
  }

  return json({ uploads });
} } } });
