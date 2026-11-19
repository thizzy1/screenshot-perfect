import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { checkoutSchema, shippingFees } from '@/lib/commerce';
import { placeOrder } from '@/lib/commerce.functions';
import { formatIDR, COURIERS, PAYMENT_METHODS, type Courier, type PaymentMethod, errorMessage } from '@/lib/format';
import { isUserBanned, bannedReason } from '@/lib/user-access';
import { productImageBlendClass, productImageFrameClass } from '@/lib/product-image';
import { ProductImage } from '@/components/store/ProductImage';
import { sizeLabel } from '@/lib/sizing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/_authenticated/checkout')({ head: () => ({ meta: [{ title: 'Checkout | Seaport' }, { name: 'description', content: 'Complete your Seaport order with Indonesian payment options.' }, { property: 'og:title', content: 'Checkout | Seaport' }, { property: 'og:description', content: 'Shipping and payment for your Seaport order.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }), component: Checkout });
function Checkout() {
 const cart = useCart(); const navigate = useNavigate(); const order = useServerFn(placeOrder);
 const { hasRole, user } = useAuth();
 const { data: profile } = useQuery({
   queryKey: ['profile-ban', user?.id],
   enabled: !!user,
   queryFn: async () => {
     if (!user) return null;
     const { data, error } = await supabase.from('profiles').select('status, is_banned, ban_reason').eq('id', user.id).maybeSingle() as { data: any; error: any };
     if (error) throw error;
     return data as any;
   },
 });
 const [step,setStep] = useState(0); const [courier,setCourier] = useState<Courier>('standard'); const [method,setMethod] = useState<PaymentMethod>('qris'); const [channel,setChannel] = useState('QRIS'); const [busy,setBusy] = useState(false);
 const [shipping,setShipping] = useState({name:'',phone:'',address:'',city:'',postal:''});
 const isAdmin = hasRole('admin');
 const isBanned = user ? isUserBanned(profile) : false;
 const storeCount = new Set(cart.items.map(i=>i.storeName)).size;
 if (!cart.items.length) return <div className="px-4 py-20 text-center"><h1 className="text-4xl font-bold">Your cart is empty</h1><Button asChild className="mt-6"><Link to="/shop">Shop now</Link></Button></div>;
 if (isAdmin || isBanned) {
   return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-4xl font-bold">Checkout blocked</h1><p className="mt-4 text-muted-foreground">{isAdmin ? 'Admin toko resmi tidak dapat melakukan pembelian atau checkout sendiri.' : bannedReason({ status: 'banned' })}</p><div className="mt-6 flex justify-center gap-3"><Button asChild variant="outline"><Link to={isAdmin ? '/seller' : '/account'}>{isAdmin ? 'Manage store' : 'My account'}</Link></Button></div></div>;
 }
 async function submit(e: React.FormEvent) {e.preventDefault(); if(step === 0) { const valid = checkoutSchema.shape.shipping.safeParse(shipping); if (!valid.success) {toast.error(valid.error.issues[0]?.message ?? 'Check shipping details');return;} setStep(1);return;} if(step === 1){setStep(2);return;} setBusy(true);try{const id=await order({data:{items:cart.items.map(i=>({variant_id:i.variantId,quantity:i.quantity})),shipping,courier,method,channel}}); cart.clear();navigate({to:'/order/$id',params:{id}});}catch(e){toast.error(errorMessage(e));}finally{setBusy(false);} }
 return <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-12"><h1 className="text-5xl font-bold uppercase">Checkout</h1><ol className="my-8 flex gap-6 text-sm font-semibold">{['Shipping address','Delivery','Payment'].map((s,i)=><li key={s} className={i===step?'text-brand':'text-muted-foreground'}>{i+1}. {s}</li>)}</ol><div className="grid min-w-0 gap-12 md:grid-cols-[1fr_340px]"><form onSubmit={submit} className="min-w-0 space-y-5">
 {step===0 && (Object.keys(shipping) as (keyof typeof shipping)[]).map(key=><div key={key}><Label htmlFor={key}>{({name:'Recipient name',phone:'Phone number',address:'Street address',city:'City',postal:'Postal code'})[key]}</Label><Input id={key} value={shipping[key]} onChange={e=>setShipping({...shipping,[key]:e.target.value})} required type={key==='phone'?'tel':'text'} autoComplete={key==='name'?'name':key==='phone'?'tel':key==='address'?'street-address':key==='city'?'address-level2':'postal-code'}/></div>)}
 {step===1 && <fieldset className="space-y-3"><legend className="mb-4 text-2xl font-semibold">Delivery option</legend>{(Object.keys(COURIERS) as Courier[]).map(c=><label key={c} className="flex items-center gap-3 rounded-md border bg-card p-4"><input type="radio" checked={courier===c} onChange={()=>setCourier(c)}/><span className="flex-1">{COURIERS[c].label}<span className="block text-sm text-muted-foreground">{COURIERS[c].eta}</span></span>{formatIDR(COURIERS[c].fee)}</label>)}<p className="text-sm text-muted-foreground">Shipping is charged separately for each store.</p></fieldset>}
 {step===2 && <><fieldset className="space-y-3"><legend className="mb-4 text-2xl font-semibold">Payment method</legend>{(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map(m=><label key={m} className="flex items-center gap-3 rounded-md border bg-card p-4"><input type="radio" checked={method===m} onChange={()=>{setMethod(m);setChannel(PAYMENT_METHODS[m].channels[0]);}}/>{PAYMENT_METHODS[m].label}</label>)}</fieldset><Label htmlFor="channel">Payment channel</Label><select id="channel" className="h-11 w-full rounded-md border bg-card px-3" value={channel} onChange={e=>setChannel(e.target.value)}>{PAYMENT_METHODS[method].channels.map(c=><option key={c}>{c}</option>)}</select><p className="rounded-md border border-warning p-3 text-sm">Demo checkout — no real money is charged. Payments are simulated.</p><div className="border-t pt-4 text-sm">{shipping.name} · {shipping.phone}<br/>{shipping.address}, {shipping.city} {shipping.postal}</div></>}
 <div className="flex gap-3">{step>0&&<Button type="button" variant="outline" onClick={()=>setStep(step-1)}>Back</Button>}<Button disabled={busy} size="lg">{busy?'Placing order…':step===2?'Place order':'Continue'}</Button></div></form><aside className="min-w-0 space-y-5 border-t pt-5 md:border-l md:border-t-0 md:pl-6"><h2 className="text-2xl font-bold">Order summary</h2>{cart.items.map(i=><div key={i.variantId} className="flex min-w-0 gap-3 overflow-hidden">{i.image&&<div className={`h-16 w-16 shrink-0 overflow-hidden rounded-md ${productImageFrameClass}`}><ProductImage src={i.image} alt={i.name} className={`h-full w-full rounded-md object-contain p-1 ${productImageBlendClass(i.image)}`}/></div>}<div className="min-w-0 flex-1"><p className="truncate font-semibold">{i.name}</p><p className="text-sm text-muted-foreground">{sizeLabel(i.size)} · Qty {i.quantity}</p>{formatIDR(i.price*i.quantity)}</div></div>)}<dl className="space-y-3 border-t pt-4"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatIDR(cart.subtotal)}</dd></div><div className="flex justify-between"><dt>Shipping ({storeCount} stores)</dt><dd>{formatIDR(shippingFees[courier]*storeCount)}</dd></div><div className="flex justify-between text-xl font-bold"><dt>Total</dt><dd>{formatIDR(cart.subtotal+shippingFees[courier]*storeCount)}</dd></div></dl></aside></div></div>;
}
