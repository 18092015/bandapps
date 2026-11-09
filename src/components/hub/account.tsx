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
 async function login(){setBusy(true);try{const result=await lovable.auth.signInWithOAuth('microsoft',{redirect_uri:window.location.origin}); if(result.error) toast.error(result.error.message);}catch{toast.error('Não foi possível entrar com Microsoft.');}finally{setBusy(false);}}
 async function logout(){await query.cancelQueries();query.clear();await supabase.auth.signOut();await router.navigate({to:'/',replace:true});}
 return user?<div className="flex min-w-0 items-center gap-1"><UserRound className="size-4 shrink-0"/><span className="max-w-32 truncate text-xs">{user.user_metadata['full_name']??user.user_metadata['name']??'Minha conta'}</span><Button variant="ghost" size="icon" title="Sair da conta" aria-label="Sair da conta" onClick={logout}><LogOut/></Button></div>:<Button variant="outline" size="sm" disabled={!ready||busy} onClick={login}><Grid2X2/>Entrar com Microsoft</Button>;
}
