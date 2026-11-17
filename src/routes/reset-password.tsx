import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
export const Route = createFileRoute('/reset-password')({ head: () => ({ meta: [{ title: 'Reset password | Seaport' }, { name: 'description', content: 'Choose a new password for your Seaport account.' }, { property: 'og:title', content: 'Reset password | Seaport' }, { property: 'og:description', content: 'Secure your Seaport account.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: ResetPassword });
function ResetPassword() {
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const isRecovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery' || sessionStorage.getItem('seaport-recovery') === 'true';
    if (isRecovery) sessionStorage.setItem('seaport-recovery', 'true');
    void supabase.auth.getUser().then(({ data }) => setRecovery(isRecovery && !!data.user));
  }, []);
  return <form className="mx-auto max-w-md space-y-5 px-4 py-16" onSubmit={async e => {
    e.preventDefault(); if (!recovery) return; setBusy(true);
    const values = new FormData(e.currentTarget); const password = String(values.get('password'));
    if (password !== values.get('confirmation')) { toast.error('Passwords do not match'); setBusy(false); return; }
    try { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error;
      sessionStorage.removeItem('seaport-recovery'); toast.success('Password updated'); await navigate({ to: '/account' });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update password'); } finally { setBusy(false); }
  }}><h1 className="text-4xl font-bold">New password</h1>{recovery ? <><Label htmlFor="new-password">Password</Label><Input id="new-password" name="password" type="password" minLength={8} required autoComplete="new-password"/><Label htmlFor="confirmation">Confirm password</Label><Input id="confirmation" name="confirmation" type="password" minLength={8} required autoComplete="new-password"/><Button disabled={busy}>Update password</Button></> : <><p role="status">Open the password reset link from your email to continue.</p><Button type="button" variant="outline" onClick={() => navigate({ to: '/auth' })}>Back to sign in</Button></>}</form>;
}
