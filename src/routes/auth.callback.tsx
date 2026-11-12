import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { LoaderCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/auth/callback')({ component: OAuthCallback });

function OAuthCallback() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      const code = new URLSearchParams(window.location.search).get('code');
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        if (active) setFailed(true);
        return;
      }

      if (data.session) {
        window.location.replace('/');
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          window.location.replace('/');
          return;
        }
      }

      if (active) setFailed(true);
    }

    void finishSignIn();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center" aria-live="polite">
      {failed ? (
        <>
          <h1 className="text-lg font-semibold">Não foi possível concluir o login</h1>
          <p className="max-w-md text-sm text-muted-foreground">Confira se o provedor está habilitado e tente novamente.</p>
          <a className="text-sm font-medium text-primary underline underline-offset-4" href="/">Voltar ao início</a>
        </>
      ) : (
        <>
          <LoaderCircle className="size-6 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Concluindo seu login…</p>
        </>
      )}
    </main>
  );
}
