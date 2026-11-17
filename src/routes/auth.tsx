import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useAuth, homeForRoles, fetchRoles } from '@/hooks/useAuth';
import { safeDestination } from '@/lib/commerce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export const Route = createFileRoute('/auth')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s['redirect'] === 'string' ? safeDestination(s['redirect']) : undefined }),
  head: () => ({ meta: [{ title: 'Sign in | Seaport' }, { name: 'description', content: 'Sign in or join Seaport to shop and sell premium sportswear.' }, { property: 'og:title', content: 'Sign in | Seaport' }, { property: 'og:description', content: 'Your Seaport membership.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: AuthPage,
});
function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [role, setRole] = useState('customer');
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();
  const { redirect: destination } = Route.useSearch();
  useEffect(() => { if (!loading && user) {
    const path = safeDestination(destination ?? sessionStorage.getItem('seaport-return') ?? undefined) ?? homeForRoles(roles);
    sessionStorage.removeItem('seaport-return');
    navigate({ to: path });
  } }, [user, loading, roles, destination, navigate]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setNotice('');
    const f = new FormData(e.currentTarget); const email = String(f.get('email')).trim(); const password = String(f.get('password'));
    try {
      if (mode === 'reset') { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw error; setNotice('Check your email for a password reset link.'); }
      else if (mode === 'signup') { if (destination) sessionStorage.setItem('seaport-return', destination); const { error, data } = await supabase.auth.signUp({ email, password, options: { data: { role }, emailRedirectTo: window.location.origin } }); if (error) throw error; if (!data.session) setNotice('Check your email to confirm your account, then sign in.'); }
      else { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; }
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Sign-in failed'); } finally { setBusy(false); }
  }
  async function social(provider: 'google' | 'lovable') {
    setBusy(true);
    if (destination) sessionStorage.setItem('seaport-return', destination);
    try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` }); if (result.error) throw result.error; } catch (e) { toast.error(e instanceof Error ? e.message : 'Sign-in failed'); } finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-md px-4 py-16"><p className="mb-3 text-sm font-semibold uppercase text-brand">Seaport membership</p><h1 className="mb-8 text-5xl font-bold uppercase">{mode === 'signup' ? 'Join Seaport' : mode === 'reset' ? 'Reset password' : 'Welcome back'}</h1>
    {mode !== 'reset' && <div className="mb-6 grid gap-3"><Button variant="outline" disabled={busy} onClick={() => social('google')}>Continue with Google</Button><Button variant="outline" disabled={busy} onClick={() => social('lovable')}>Sign in with Lovable</Button><div className="py-2 text-center text-xs text-muted-foreground">OR</div></div>}
    <form onSubmit={submit} className="space-y-5">
      <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required/></div>
      {mode !== 'reset' && <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}/></div>}
      {mode === 'signup' && <fieldset className="flex gap-6"><legend className="mb-2 text-sm font-medium">Account type</legend>{['customer','seller'].map(r => <label key={r} className="flex items-center gap-2 capitalize"><input type="radio" name="role" checked={role === r} onChange={() => setRole(r)}/>{r}</label>)}</fieldset>}
      {notice && <p role="status" className="rounded-md border border-success p-3 text-sm">{notice}</p>}
      <Button className="w-full" size="lg" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</Button>
    </form><div className="mt-4 flex flex-wrap justify-between gap-2"><Button variant="link" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setNotice(''); }}>{mode === 'signup' ? 'Already a member? Sign in' : 'Create an account'}</Button><Button variant="link" onClick={() => { setMode(mode === 'reset' ? 'signin' : 'reset'); setNotice(''); }}>{mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}</Button></div>
  </div>;
}
