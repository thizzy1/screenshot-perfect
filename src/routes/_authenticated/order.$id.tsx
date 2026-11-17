import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { payOrder } from '@/lib/commerce.functions';
import { formatIDR, errorMessage, TRACK_STEPS, ORDER_STATUS, trackIndex } from '@/lib/format';
import { productImageBlendClass, productImageFrameClass } from '@/lib/product-image';
import { sizeLabel } from '@/lib/sizing';
import { StatusBadge } from '@/components/store/StatusBadge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/order/$id')({
    head: () => ({
        meta: [
            { title: 'Order invoice | Seaport' },
            { name: 'description', content: 'Your Seaport invoice and order status.' },
            { property: 'og:title', content: 'Order invoice | Seaport' },
            { property: 'og:description', content: 'Track your Seaport purchase.' },
            { property: 'og:type', content: 'website' },
            { name: 'twitter:card', content: 'summary' },
        ],
    }),
    component: OrderPage,
});

function OrderPage() {
    const { id } = Route.useParams();
    const qc = useQueryClient();
    const pay = useServerFn(payOrder);
    const [busy, setBusy] = useState(false);
    const { data: orders, isPending, error } = useQuery({
        queryKey: ['checkout', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*,items:order_items(*),store:stores(name)')
                .eq('checkout_id', id)
                .order('created_at');
            if (error) throw error;
            return data;
        },
    });

    async function action(cancel = false) {
        setBusy(true);
        try {
            if (cancel) {
                const { error } = await supabase.rpc('cancel_my_checkout', { _checkout: id });
                if (error) throw error;
            } else {
                await pay({ data: id });
            }
            await qc.invalidateQueries();
            toast.success(cancel ? 'Order cancelled' : 'Demo payment confirmed');
        } catch (e) {
            toast.error(errorMessage(e));
        } finally {
            setBusy(false);
        }
    }

    if (isPending) return <div className="p-12">Loading order…</div>;
    if (error) return <div className="p-12 text-destructive">{errorMessage(error)}</div>;
    if (!orders?.length) return <div className="p-12">Order not found</div>;

    return (
        <div className="mx-auto max-w-5xl overflow-x-hidden px-4 py-12">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-brand">Seaport</p>
                    <h1 className="text-5xl font-bold uppercase">Your order</h1>
                </div>
                <Button variant="outline" onClick={() => window.print()}>Print invoice</Button>
            </div>
            {orders.map((order) => (
                <section key={order.id} className="mb-10 min-w-0 border-b pb-10">
                    <div className="mb-5 flex flex-wrap justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-bold">{order.order_number}</h2>
                            <p className="text-sm text-muted-foreground">
                                {order.store?.name} · {new Date(order.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <StatusBadge status={order.status} />
                    </div>
                    {order.status !== 'cancelled' && (
                        <ol className="mb-8 grid grid-cols-5 gap-2 text-xs">
                            {TRACK_STEPS.map((step, index) => (
                                <li
                                    key={step}
                                    className={`border-t-4 pt-2 ${index <= trackIndex(order.status) ? 'border-success' : 'border-border text-muted-foreground'}`}
                                >
                                    {ORDER_STATUS[step]?.label}
                                </li>
                            ))}
                        </ol>
                    )}
                    <div className="grid min-w-0 gap-8 md:grid-cols-[1fr_280px]">
                        <div className="min-w-0">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex min-w-0 items-center gap-4 overflow-hidden border-b py-4">
                                    {item.image && (
                                        <div className={`h-20 w-20 shrink-0 overflow-hidden rounded-md ${productImageFrameClass}`}>
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className={`h-full w-full rounded-md object-contain p-1 ${productImageBlendClass(item.image)}`}
                                            />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {sizeLabel(item.size)} · Qty {item.quantity}
                                        </p>
                                    </div>
                                    <p className="shrink-0">{formatIDR(item.price * item.quantity)}</p>
                                </div>
                            ))}
                            <div className="mt-6 min-w-0 text-sm">
                                <p className="font-semibold">Deliver to {order.shipping_name}</p>
                                <p>{order.shipping_address}, {order.shipping_city} {order.shipping_postal}</p>
                                <p>{order.shipping_phone} · {order.courier}</p>
                            </div>
                        </div>
                        <aside className="min-w-0 space-y-3">
                            <p className="flex justify-between">Subtotal <span>{formatIDR(order.subtotal)}</span></p>
                            <p className="flex justify-between">Shipping <span>{formatIDR(order.shipping_fee)}</span></p>
                            <p className="flex justify-between border-t pt-3 text-xl font-bold">
                                Total <span>{formatIDR(order.total)}</span>
                            </p>
                            <p className="break-words pt-3 text-sm uppercase">
                                {order.payment_method.replace('_', ' ')} · {order.payment_channel}
                            </p>
                            {order.payment_ref && <p className="break-all font-mono text-sm">{order.payment_ref}</p>}
                            {order.status === 'pending_payment' && order.payment_method === 'qris' && (
                                <QRCodeSVG value={`SEAPORT-DEMO:${order.payment_ref}:${order.total}`} size={180} className="bg-card p-3" />
                            )}
                            {order.status === 'pending_payment' && (
                                <p className="text-sm text-muted-foreground">Demo payment only. Do not transfer real funds.</p>
                            )}
                        </aside>
                    </div>
                </section>
            ))}
            {orders.some((order) => order.status === 'pending_payment') && (
                <div className="flex gap-3">
                    <Button disabled={busy} onClick={() => action()}>Simulate payment</Button>
                    <Button variant="outline" disabled={busy} onClick={() => action(true)}>Cancel unpaid order</Button>
                </div>
            )}
            <Button asChild variant="link" className="mt-5">
                <Link to="/account">View all orders</Link>
            </Button>
        </div>
    );
}
