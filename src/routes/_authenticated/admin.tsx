import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Workspace } from '@/components/store/Workspace';
import { StatusBadge } from '@/components/store/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatIDR, errorMessage } from '@/lib/format';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => ({
    meta: [
      { title: 'Admin | Seaport' },
      { name: 'description', content: 'Seaport platform administration, sellers, users and transactions.' },
      { property: 'og:title', content: 'Admin | Seaport' },
      { property: 'og:description', content: 'Manage the Seaport marketplace.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { hasRole, user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isPending, error } = useQuery({
    queryKey: ['admin-data'],
    enabled: hasRole('admin'),
    queryFn: async () => {
      const [profiles, stores, orders, roles, settings] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('stores').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*,store:stores(name)').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
        supabase.from('platform_settings').select('*').eq('id', 1).single(),
      ]);

      for (const result of [profiles, stores, orders, roles, settings]) {
        if (result.error) throw result.error;
      }

      return {
        profiles: (profiles.data ?? []) as any[],
        stores: stores.data ?? [],
        orders: orders.data ?? [],
        roles: roles.data ?? [],
        settings: settings.data,
      };
    },
  });

  async function perform(fn: () => PromiseLike<{ error: unknown }>) {
    setBusy(true);
    try {
      const { error } = await fn();
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success('Updated');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function setUserBan(userId: string, shouldBan: boolean, reason: string) {
    const nextReason = shouldBan ? reason.trim() || 'Penyalahgunaan klaim garansi / penukaran barang berulang' : null;
    await perform(async () => {
      const payload: any = { status: shouldBan ? 'banned' : 'active', ban_reason: nextReason, is_banned: shouldBan };
      try {
        const result = await supabase.from('profiles').update(payload as any).eq('id', userId);
        if (result.error) throw result.error;
        return result;
      } catch {
        const fallback = await supabase.from('profiles').update({ status: shouldBan ? 'banned' : 'active', ban_reason: nextReason } as any).eq('id', userId);
        if (fallback.error) throw fallback.error;
        return fallback;
      }
    });
  }

  if (!hasRole('admin')) return <Workspace title="Admin" admin>{null}</Workspace>;
  if (isPending) return <Workspace title="Admin" admin>Loading platform…</Workspace>;
  if (error || !data) return <Workspace title="Admin" admin><p className="text-destructive">{errorMessage(error)}</p></Workspace>;

  const paid = data.orders.filter((o) => ['paid', 'processing', 'shipped', 'completed'].includes(o.status));

  return (
    <Workspace title="Platform administration" admin>
      <div className="mb-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[
          { label: 'Members', value: data.profiles.length },
          { label: 'Verified stores', value: data.stores.filter((s) => s.status === 'verified').length },
          { label: 'Transaction volume', value: formatIDR(paid.reduce((s, o) => s + o.total, 0)) },
          { label: 'Commission earned', value: formatIDR(paid.reduce((s, o) => s + o.commission, 0)) },
        ].map((s) => (
          <div key={s.label} className="rounded-md border bg-card p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 break-words text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="stores">
        <TabsList className="mb-6">
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="moderation">User Moderation</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="stores">
          <h2 className="mb-5 text-2xl font-bold">Seller verification</h2>
          {data.stores.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 border-b py-5">
              <div>
                <p className="font-bold">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
              <StatusBadge status={s.status} />
              <div className="flex gap-2">
                {s.status !== 'verified' && (
                  <Button disabled={busy} onClick={() => perform(() => supabase.from('stores').update({ status: 'verified' }).eq('id', s.id))}>Verify</Button>
                )}
                {s.status !== 'suspended' && (
                  <Button variant="outline" disabled={busy} onClick={() => perform(() => supabase.from('stores').update({ status: 'suspended' }).eq('id', s.id))}>Suspend</Button>
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="users">
          <Input aria-label="Search members" placeholder="Search members" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-5 max-w-sm" />
          {data.profiles.filter((p) => `${p.full_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 border-b py-5">
              <div className="min-w-0">
                <p className="font-bold">{p.full_name ?? 'Member'}</p>
                <p className="break-all text-sm text-muted-foreground">{p.email}</p>
                <p className="text-xs uppercase text-muted-foreground">{data.roles.filter((r) => r.user_id === p.id).map((r) => r.role).join(' · ')}</p>
              </div>
              <StatusBadge status={p.status} />
              <div className="flex flex-wrap gap-2">
                {['active', 'suspended', 'banned'].filter((s) => s !== p.status).map((s) => (
                  <Button key={s} variant="outline" disabled={busy || p.id === user?.id} onClick={() => perform(() => supabase.from('profiles').update({ status: s }).eq('id', p.id))} className="capitalize">
                    {s === 'active' ? 'Restore' : s === 'banned' ? 'Ban' : 'Suspend'}
                  </Button>
                ))}
                {!data.roles.some((r) => r.user_id === p.id && r.role === 'admin') && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm('Grant this member administrator access?')) {
                        perform(() => supabase.from('user_roles').insert({ user_id: p.id, role: 'admin' }));
                      }
                    }}
                  >
                    Make admin
                  </Button>
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="moderation">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">User Moderation</h2>
            <p className="text-sm text-muted-foreground">Ban atau unban pembeli untuk melindungi warranty dan mencegah penyalahgunaan akun.</p>
            {(data.profiles as any[]).filter((p: any) => p.status === 'active' || p.status === 'banned').map((p: any) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
                <div className="min-w-0">
                  <p className="font-bold">{p.full_name ?? 'Member'}</p>
                  <p className="break-all text-sm text-muted-foreground">{p.email}</p>
                  {(p.ban_reason ?? p['ban_reason']) && <p className="mt-1 text-xs text-destructive">Reason: {p.ban_reason ?? p['ban_reason']}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  {p.id !== user?.id && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        const reason = window.prompt('Masukkan alasan pemblokiran akun:', p.ban_reason ?? p['ban_reason'] ?? 'Penyalahgunaan klaim garansi / penukaran barang berulang');
                        if (reason !== null) {
                          void setUserBan(p.id, p.status !== 'banned', reason);
                        }
                      }}
                    >
                      {p.status === 'banned' ? 'Unban' : 'Ban'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <h2 className="mb-5 text-2xl font-bold">Transaction log</h2>
          {!data.orders.length && <p className="border-y py-10">No transactions yet.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-3 pr-4">Order</th>
                  <th className="pr-4">Store</th>
                  <th className="pr-4">Status</th>
                  <th className="pr-4">Total</th>
                  <th>Commission</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-b">
                    <td className="whitespace-nowrap py-4 pr-4">
                      {o.order_number}
                      <span className="block text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="pr-4">{o.store?.name}</td>
                    <td className="pr-4"><StatusBadge status={o.status} /></td>
                    <td className="whitespace-nowrap pr-4">{formatIDR(o.total)}</td>
                    <td className="whitespace-nowrap">{formatIDR(o.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <form
            className="max-w-sm space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const rate = Number(new FormData(e.currentTarget).get('rate'));
              perform(() => supabase.from('platform_settings').update({ commission_rate: rate }).eq('id', 1));
            }}
          >
            <h2 className="text-2xl font-bold">Platform commission</h2>
            <Label htmlFor="rate">Commission rate (%)</Label>
            <Input id="rate" name="rate" type="number" min="0" max="50" step="0.01" required defaultValue={data.settings?.commission_rate ?? 5} />
            <Button disabled={busy}>Save commission rate</Button>
          </form>
        </TabsContent>
      </Tabs>
    </Workspace>
  );
}
