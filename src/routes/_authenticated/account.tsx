import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Sparkles, Truck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Workspace } from '@/components/store/Workspace';
import { StatusBadge } from '@/components/store/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatIDR } from '@/lib/format';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/account')({
  head: () => ({
    meta: [
      { title: 'My Account & Member | Seaport Official' },
      { name: 'description', content: 'Your Seaport official member profile, benefits, and order history.' },
      { property: 'og:title', content: 'My Account & Member | Seaport Official' },
      { property: 'og:description', content: 'Manage your Seaport member benefits and orders.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Account,
});

function Account() {
  const { user } = useAuth();
  const { data: profile, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: orders, isPending, error } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*,store:stores(name)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Workspace title="Seaport Member Account">
      {/* SEAPORT MEMBER BENEFITS HERO CARD */}
      <div className="mb-10 rounded-2xl bg-hero-gradient p-6 text-hero-foreground shadow-lg md:p-8 border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-hero-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Official Member
              </span>
              <Badge variant="outline" className="border-white/20 text-xs text-white">Active Status</Badge>
            </div>
            <h2 className="mt-2 text-2xl font-black uppercase md:text-3xl tracking-tight">
              {profile?.full_name || user?.email?.split('@')[0] || 'Seaport Member'}
            </h2>
            <p className="text-xs md:text-sm opacity-80 mt-1">
              Akun Seaport · {user?.email}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end text-xs opacity-75">
            <span>Member Email:</span>
            <span className="font-semibold text-white break-all">{user?.email}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-3 text-xs">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 shrink-0 text-white" />
            <span>Ongkir dihitung saat checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-white" />
            <span>Riwayat pesanan</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 shrink-0 text-white" />
            <span>Panduan ukuran EU 39–45 / 29–37</span>
          </div>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[300px_1fr]">
        <section>
          <h2 className="mb-5 text-2xl font-bold uppercase tracking-tight">Member Profile</h2>
          {profile && (
            <form
              key={profile.full_name}
              className="space-y-4 rounded-xl border bg-card p-5 shadow-xs"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!user) return;
                const f = new FormData(e.currentTarget);
                const { error } = await supabase
                  .from('profiles')
                  .update({ full_name: String(f.get('name')), phone: String(f.get('phone')) })
                  .eq('id', user.id);
                if (error) toast.error(error.message);
                else {
                  toast.success('Profil berhasil diperbarui');
                  refetch();
                }
              }}
            >
              <div>
                <Label htmlFor="profile-name">Nama Lengkap</Label>
                <Input id="profile-name" name="name" defaultValue={profile.full_name ?? ''} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="profile-phone">Nomor Telepon / WhatsApp</Label>
                <Input id="profile-phone" name="phone" defaultValue={profile.phone ?? ''} className="mt-1" />
              </div>
              <div>
                <Label>Email Akun</Label>
                <p className="mt-1 break-all text-xs text-muted-foreground bg-muted/50 p-2 rounded-md font-mono">{user?.email}</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <StatusBadge status={profile.status} />
                <Button size="sm">Simpan Profil</Button>
              </div>
            </form>
          )}
        </section>

        <section>
          <h2 className="mb-5 text-2xl font-bold uppercase tracking-tight">Riwayat Pesanan Resmi</h2>
          {isPending && <p className="text-sm text-muted-foreground">Memuat daftar pesanan…</p>}
          {error && <p className="text-destructive text-sm">Gagal memuat pesanan.</p>}
          {orders?.length === 0 && (
            <div className="rounded-xl border border-dashed py-12 text-center bg-card/40">
              <p className="text-base font-semibold">Belum ada riwayat pesanan.</p>
              <p className="text-xs text-muted-foreground mt-1">Jelajahi koleksi resmi Seaport dan nikmati produk original.</p>
              <Button asChild className="mt-4" size="sm">
                <Link to="/shop">Jelajahi Katalog Toko</Link>
              </Button>
            </div>
          )}
          {orders?.map((o) => (
            <Link
              key={o.id}
              to="/order/$id"
              params={{ id: o.checkout_id }}
              className="flex flex-wrap items-center justify-between gap-4 border-b py-5 hover:bg-muted/30 px-3 rounded-lg transition"
            >
              <div>
                <p className="font-bold">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  SEAPORT OFFICIAL · {new Date(o.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={o.status} />
                <span className="font-bold text-sm">{formatIDR(o.total)}</span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </Workspace>
  );
}
