import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LogOut, UserRound, Grid2X2 } from 'lucide-react';
import { toast } from 'sonner';
const AccountContext=createContext<{user:User|null;ready:boolean}>({user:null,ready:false});
export const useAccount=()=>useContext(AccountContext);
export function AccountProvider({children}:{children:ReactNode}) {
 const [user,setUser]=useState<User|null>(null); const [ready,setReady]=useState(false); const query=useQueryClient(); const router=useRouter();
 useEffect(()=>{let alive=true; const sync=async()=>{const {data}=await supabase.auth.getUser(); if(alive){setUser(data.user);setReady(true);}};
 const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{if(!['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)) return; if(event==='SIGNED_OUT'){setUser(null);query.clear();} else void sync().then(()=>query.invalidateQueries()); void router.invalidate();});
 void sync(); return()=>{alive=false;subscription.unsubscribe();};},[query,router]);
 return <AccountContext.Provider value={{user,ready}}>{children}</AccountContext.Provider>;
}
export function AccountButton(){const {user,ready}=useAccount(); const query=useQueryClient(); const router=useRouter(); const [busy,setBusy]=useState(false);
  async function login(provider:'google'|'microsoft'){setBusy(true);try{const result=await lovable.auth.signInWithOAuth(provider,{redirect_uri:window.location.origin}); if(result.error) toast.error(result.error.message);}catch{toast.error(`Não foi possível entrar com ${provider==='google'?'Google':'Microsoft'}.`);}finally{setBusy(false);}}
 async function logout(){await query.cancelQueries();query.clear();await supabase.auth.signOut();await router.navigate({to:'/',replace:true});}
 return user?<div className="flex min-w-0 items-center gap-1"><UserRound className="size-4 shrink-0"/><span className="max-w-32 truncate text-xs">{user.user_metadata['full_name']??user.user_metadata['name']??'Minha conta'}</span><Button variant="ghost" size="icon" title="Sair da conta" aria-label="Sair da conta" onClick={logout}><LogOut/></Button></div>:<div className="flex flex-wrap justify-center gap-2"><Button variant="outline" size="sm" className="google-sign-in h-9 w-56 gap-2.5 px-3 text-sm font-medium" disabled={!ready||busy} onClick={()=>login('google')}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] shrink-0"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Entrar com Google</Button><Button variant="outline" size="sm" className="h-9 w-56 text-sm font-medium" disabled={!ready||busy} onClick={()=>login('microsoft')}><Grid2X2/>Entrar com Microsoft</Button></div>;
}
