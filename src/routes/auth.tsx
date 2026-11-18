import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, homeForRoles } from '@/hooks/useAuth';
import { safeDestination } from '@/lib/commerce';
import { isUserBanned, bannedReason } from '@/lib/user-access';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/auth')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s['redirect'] === 'string' ? safeDestination(s['redirect']) : undefined }),
  head: () => ({ meta: [{ title: 'Sign in | Seaport' }, { name: 'description', content: 'Sign in or join Seaport to shop premium sportswear.' }, { property: 'og:title', content: 'Sign in | Seaport' }, { property: 'og:description', content: 'Your Seaport membership.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();
  const { redirect: destination } = Route.useSearch();

  useEffect(() => {
    let active = true;
    if (!loading && user && !busy) {
      void ensureNotBanned().then(() => {
        if (!active) return;
        const path = safeDestination(destination ?? sessionStorage.getItem('seaport-return') ?? undefined) ?? homeForRoles(roles);
        sessionStorage.removeItem('seaport-return');
        navigate({ to: path, replace: true });
      }).catch((error) => { if (active) toast.error(error instanceof Error ? error.message : 'Account access failed'); });
    }
    return () => { active = false; };
  }, [user, loading, roles, destination, navigate, busy]);

  async function ensureNotBanned() {
    const { data: { user: signedInUser } } = await supabase.auth.getUser();
    if (!signedInUser) return;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', signedInUser.id)
      .maybeSingle();

    if (error || !profile) throw new Error('Unable to verify your account. Please try again.');

    if (profile && isUserBanned(profile as any)) {
      await supabase.auth.signOut();
      throw new Error(bannedReason(profile));
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice('');

    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')).trim();
    const password = String(f.get('password'));

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice('Check your email for a password reset link.');
        return;
      }

      if (mode === 'signup') {
        if (destination) sessionStorage.setItem('seaport-return', destination);
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: 'customer' },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) setNotice('Check your email to confirm your account, then sign in.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await ensureNotBanned();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="mb-3 text-sm font-semibold uppercase text-brand">Seaport membership</p>
      <h1 className="mb-8 text-5xl font-bold uppercase">{mode === 'signup' ? 'Join Seaport' : mode === 'reset' ? 'Reset password' : 'Welcome back'}</h1>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>

        {mode !== 'reset' && (
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </div>
        )}

        {notice && <p role="status" className="rounded-md border border-success p-3 text-sm">{notice}</p>}

        <Button className="w-full" size="lg" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap justify-between gap-2">
        <Button variant="link" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setNotice(''); }}>
          {mode === 'signup' ? 'Already a member? Sign in' : 'Create an account'}
        </Button>
        <Button variant="link" onClick={() => { setMode(mode === 'reset' ? 'signin' : 'reset'); setNotice(''); }}>
          {mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}
        </Button>
      </div>
    </div>
  );
}

