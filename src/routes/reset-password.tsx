import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
export const Route = createFileRoute('/reset-password')({ head: () => ({ meta: [{ title: 'Reset password | Seaport' }, { name: 'description', content: 'Choose a new password for your Seaport account.' }, { property: 'og:title', content: 'Reset password | Seaport' }, { property: 'og:description', content: 'Secure your Seaport account.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: ResetPassword });
function ResetPassword() { const [busy,setBusy] = useState(false); const navigate = useNavigate(); return <form className="mx-auto max-w-md space-y-5 px-4 py-16" onSubmit={async e => { e.preventDefault(); setBusy(true); const password = String(new FormData(e.currentTarget).get('password')); const { error } = await supabase.auth.updateUser({ password }); setBusy(false); if (error) toast.error(error.message); else { toast.success('Password updated'); navigate({ to: '/account' }); } }}><h1 className="text-4xl font-bold">New password</h1><Label htmlFor="new-password">Password</Label><Input id="new-password" name="password" type="password" minLength={8} required autoComplete="new-password"/><Button disabled={busy}>Update password</Button></form>; }
