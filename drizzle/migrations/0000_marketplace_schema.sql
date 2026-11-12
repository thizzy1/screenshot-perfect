
create type public.app_role as enum ('admin','seller','customer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  status text not null default 'active' check (status in ('active','suspended','banned')),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin roles insert" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin roles delete" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- prevent non-admins changing their own status
create or replace function public.protect_profile_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not public.has_role(auth.uid(),'admin') then
    new.status := old.status;
  end if;
  return new;
end $$;
create trigger profiles_protect_status before update on public.profiles for each row execute function public.protect_profile_status();

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  status text not null default 'pending' check (status in ('pending','verified','suspended')),
  created_at timestamptz not null default now()
);
grant select on public.stores to anon;
grant select, insert, update, delete on public.stores to authenticated;
grant all on public.stores to service_role;
alter table public.stores enable row level security;
create policy "verified stores public" on public.stores for select to anon, authenticated using (status = 'verified' or owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "seller creates own store" on public.stores for insert to authenticated with check (owner_id = auth.uid() and public.has_role(auth.uid(),'seller'));
create policy "owner or admin updates store" on public.stores for update to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin deletes store" on public.stores for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.protect_store_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.has_role(auth.uid(),'admin') then return new; end if;
  if tg_op = 'INSERT' then new.status := 'pending';
  elsif new.status is distinct from old.status then new.status := old.status; end if;
  return new;
end $$;
create trigger stores_protect_status before insert or update on public.stores for each row execute function public.protect_store_status();

create or replace function public.owns_store(_store uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.stores where id = _store and owner_id = auth.uid()) $$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public" on public.categories for select to anon, authenticated using (true);
create policy "admin manages categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  specs jsonb not null default '{}'::jsonb,
  price bigint not null check (price >= 0),
  gender text not null default 'unisex',
  collection text,
  images text[] not null default '{}',
  is_active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "active products public" on public.products for select to anon, authenticated using (
  (is_active and exists (select 1 from public.stores s where s.id = store_id and s.status = 'verified'))
  or public.owns_store(store_id) or public.has_role(auth.uid(),'admin'));
create policy "owner manages products" on public.products for all to authenticated
  using (public.owns_store(store_id) or public.has_role(auth.uid(),'admin'))
  with check (public.owns_store(store_id) or public.has_role(auth.uid(),'admin'));

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  stock integer not null default 0 check (stock >= 0),
  unique (product_id, size)
);
grant select on public.product_variants to anon;
grant select, insert, update, delete on public.product_variants to authenticated;
grant all on public.product_variants to service_role;
alter table public.product_variants enable row level security;
create policy "variants public" on public.product_variants for select to anon, authenticated using (
  exists (select 1 from public.products p where p.id = product_id));
create policy "owner manages variants" on public.product_variants for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (public.owns_store(p.store_id) or public.has_role(auth.uid(),'admin'))))
  with check (exists (select 1 from public.products p where p.id = product_id and (public.owns_store(p.store_id) or public.has_role(auth.uid(),'admin'))));

create table public.platform_settings (
  id integer primary key default 1 check (id = 1),
  commission_rate numeric(5,2) not null default 5.00 check (commission_rate >= 0 and commission_rate <= 50)
);
grant select on public.platform_settings to anon;
grant select, update on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "settings public" on public.platform_settings for select to anon, authenticated using (true);
create policy "admin updates settings" on public.platform_settings for update to authenticated using (public.has_role(auth.uid(),'admin'));
insert into public.platform_settings (id, commission_rate) values (1, 5.00);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  checkout_id uuid not null,
  customer_id uuid not null,
  store_id uuid not null references public.stores(id),
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','processing','shipped','completed','cancelled')),
  subtotal bigint not null,
  shipping_fee bigint not null default 0,
  total bigint not null,
  commission bigint not null default 0,
  shipping_name text not null,
  shipping_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_postal text not null,
  courier text not null,
  payment_method text not null,
  payment_channel text,
  payment_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders visible to parties" on public.orders for select to authenticated using (
  customer_id = auth.uid() or public.owns_store(store_id) or public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  size text,
  image text,
  price bigint not null,
  quantity integer not null check (quantity > 0)
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "items visible with order" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id));

-- signup trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _role text := coalesce(new.raw_user_meta_data->>'role','customer');
begin
  insert into public.profiles (id, full_name, phone, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.phone, new.email);
  if _role not in ('customer','seller') then _role := 'customer'; end if;
  insert into public.user_roles (user_id, role) values (new.id, _role::public.app_role);
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
    update public.stores set owner_id = new.id where slug = 'seaport' and owner_id is null;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- become a seller (customer upgrading)
create or replace function public.become_seller(_name text, _description text)
returns uuid language plpgsql security definer set search_path = public as $$
declare _id uuid; _slug text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if length(trim(coalesce(_name,''))) < 2 then raise exception 'Store name too short'; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'seller') on conflict do nothing;
  select id into _id from public.stores where owner_id = auth.uid() limit 1;
  if _id is not null then return _id; end if;
  _slug := regexp_replace(lower(trim(_name)), '[^a-z0-9]+', '-', 'g') || '-' || substr(md5(random()::text),1,4);
  insert into public.stores (owner_id, name, slug, description, status) values (auth.uid(), trim(_name), _slug, _description, 'pending') returning id into _id;
  return _id;
end $$;
grant execute on function public.become_seller(text, text) to authenticated;

-- place order: items = [{variant_id, quantity}], shipping = {...}
create or replace function public.place_order(_items jsonb, _shipping jsonb, _courier text, _payment_method text, _payment_channel text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _checkout uuid := gen_random_uuid();
  _rate numeric; _fee bigint; _store uuid; _order uuid; _sub bigint; _ref text; _item record; _status text;
begin
  if auth.uid() is null then raise exception 'Please sign in to checkout'; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and status <> 'active') then raise exception 'Your account is not active'; end if;
  if jsonb_array_length(coalesce(_items,'[]'::jsonb)) = 0 then raise exception 'Cart is empty'; end if;
  if _courier not in ('standard','express','pickup') then raise exception 'Invalid courier'; end if;
  if _payment_method not in ('qris','bank_transfer','ewallet','cod') then raise exception 'Invalid payment method'; end if;
  if coalesce(_shipping->>'name','') = '' or coalesce(_shipping->>'phone','') = '' or coalesce(_shipping->>'address','') = '' or coalesce(_shipping->>'city','') = '' or coalesce(_shipping->>'postal','') = '' then
    raise exception 'Shipping details are incomplete';
  end if;
  select commission_rate into _rate from public.platform_settings where id = 1;
  _fee := case _courier when 'standard' then 25000 when 'express' then 50000 else 0 end;
  _status := case when _payment_method = 'cod' then 'processing' else 'pending_payment' end;

  create temp table _lines on commit drop as
    select v.id as variant_id, v.product_id, v.size, v.stock, p.store_id, p.name, p.price, p.images[1] as image, (i->>'quantity')::int as qty
    from jsonb_array_elements(_items) i
    join public.product_variants v on v.id = (i->>'variant_id')::uuid
    join public.products p on p.id = v.product_id
    join public.stores s on s.id = p.store_id and s.status = 'verified'
    where p.is_active;
  if (select count(*) from _lines) <> jsonb_array_length(_items) then raise exception 'Some items are no longer available'; end if;
  if exists (select 1 from _lines where qty <= 0 or qty > stock) then raise exception 'Not enough stock for one of your items'; end if;

  for _store in select distinct store_id from _lines loop
    select sum(price * qty) into _sub from _lines where store_id = _store;
    _ref := case _payment_method
      when 'bank_transfer' then '8808' || lpad((floor(random()*1e12))::bigint::text, 12, '0')
      when 'qris' then 'QRIS-' || upper(substr(md5(random()::text),1,12))
      when 'ewallet' then 'EW-' || upper(substr(md5(random()::text),1,10))
      else null end;
    insert into public.orders (order_number, checkout_id, customer_id, store_id, status, subtotal, shipping_fee, total, commission,
      shipping_name, shipping_phone, shipping_address, shipping_city, shipping_postal, courier, payment_method, payment_channel, payment_ref)
    values ('SP-' || to_char(now(),'YYMMDD') || '-' || upper(substr(md5(random()::text),1,6)), _checkout, auth.uid(), _store, _status,
      _sub, _fee, _sub + _fee, round(_sub * _rate / 100), _shipping->>'name', _shipping->>'phone', _shipping->>'address', _shipping->>'city', _shipping->>'postal',
      _courier, _payment_method, _payment_channel, _ref)
    returning id into _order;
    insert into public.order_items (order_id, product_id, variant_id, name, size, image, price, quantity)
      select _order, product_id, variant_id, name, size, image, price, qty from _lines where store_id = _store;
  end loop;
  update public.product_variants v set stock = v.stock - l.qty from _lines l where v.id = l.variant_id;
  return _checkout;
end $$;
grant execute on function public.place_order(jsonb, jsonb, text, text, text) to authenticated;

create or replace function public.simulate_payment(_checkout uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.orders set status = 'paid', paid_at = now()
  where checkout_id = _checkout and customer_id = auth.uid() and status = 'pending_payment';
end $$;
grant execute on function public.simulate_payment(uuid) to authenticated;

create or replace function public.update_order_status(_order uuid, _status text)
returns void language plpgsql security definer set search_path = public as $$
declare _o public.orders;
begin
  select * into _o from public.orders where id = _order;
  if _o.id is null then raise exception 'Order not found'; end if;
  if not (public.owns_store(_o.store_id) or public.has_role(auth.uid(),'admin')) then raise exception 'Not allowed'; end if;
  if _status not in ('processing','shipped','completed','cancelled') then raise exception 'Invalid status'; end if;
  if _o.status in ('completed','cancelled') then raise exception 'Order is already closed'; end if;
  if _status = 'cancelled' then
    update public.product_variants v set stock = v.stock + i.quantity from public.order_items i where i.order_id = _order and v.id = i.variant_id;
  end if;
  update public.orders set status = _status where id = _order;
end $$;
grant execute on function public.update_order_status(uuid, text) to authenticated;

-- customer cancels unpaid order
create or replace function public.cancel_my_checkout(_checkout uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.product_variants v set stock = v.stock + i.quantity
    from public.order_items i join public.orders o on o.id = i.order_id
    where o.checkout_id = _checkout and o.customer_id = auth.uid() and o.status = 'pending_payment' and v.id = i.variant_id;
  update public.orders set status = 'cancelled' where checkout_id = _checkout and customer_id = auth.uid() and status = 'pending_payment';
end $$;
grant execute on function public.cancel_my_checkout(uuid) to authenticated;

-- seed
insert into public.categories (name, slug) values
 ('Basketball Shoes','basketball'),('Running','running'),('Apparel','apparel'),('Accessories','accessories');

insert into public.stores (name, slug, description, logo_url, status) values
 ('Seaport', 'seaport', 'Premium sportswear. Official home of the ANTA KAI collection.', '/__l5e/assets-v1/13e67e30-b866-4283-bcff-6e654192800c/Seaport.png', 'verified');

insert into public.products (store_id, category_id, name, slug, description, specs, price, gender, collection, images, featured)
select s.id, c.id, v.name, v.slug, v.descr, v.specs::jsonb, v.price, v.gender, v.coll, array[v.img], v.feat
from public.stores s, (values
 ('KAI 3 Magnetic Energy','kai-3-magnetic-energy','basketball','Kyrie''s third signature shoe in an electric colorway built for quick cuts and explosive first steps.','{"Upper":"Engineered mesh","Cushioning":"Nitroedge foam","Fit":"True to size","Use":"Indoor court"}',2599000,'men','KAI','/__l5e/assets-v1/dbb478d4-d7e1-4b17-ba13-2c7b066b0977/kai3-magnetic-energy.png',true),
 ('KAI 2 Dallas','kai-2-dallas','basketball','Dallas-inspired KAI 2 with a responsive midsole and grippy herringbone outsole.','{"Upper":"Synthetic + mesh","Cushioning":"A-Flashedge","Fit":"True to size","Use":"Indoor court"}',1839200,'men','KAI','/__l5e/assets-v1/56b260da-93f7-4c41-8039-aa09deb783f3/kai2-dallas.png',true),
 ('KAI 1 Playoffs','kai-1-playoffs','basketball','The original KAI in its playoff edition - low-profile, lockdown fit, made for big moments.','{"Upper":"Knit","Cushioning":"Nitroedge","Fit":"Snug","Use":"Indoor court"}',2599000,'men','KAI','/__l5e/assets-v1/4c2dbe93-0b1b-4f80-8929-7914a5a4bf86/kai1-playoffs.png',true),
 ('KAI 3 Triple Black','kai-3-triple-black','basketball','Stealthy all-black KAI 3 that goes from the court to the street.','{"Upper":"Engineered mesh","Cushioning":"Nitroedge foam","Fit":"True to size","Use":"Court & lifestyle"}',2599000,'unisex','KAI','/__l5e/assets-v1/e4c6d75e-eafb-4ac6-99b9-6c8e46b5f7f9/kai3-triple-black.png',true),
 ('C202 GT 2 Men','c202-gt-2-men','running','Super-cushioned daily trainer for long, fast miles.','{"Upper":"Breathable mesh","Cushioning":"Nitroedge","Drop":"8mm","Use":"Road running"}',2599000,'men',null,'/__l5e/assets-v1/15ff4606-36b7-4ecd-836a-6448bae17305/gen-c202.jpg',false),
 ('ZONE 2 80 Men','zone-2-80-men','running','Lightweight runner with a bouncy ride and a secure fit.','{"Upper":"Mesh","Cushioning":"EVA","Drop":"10mm","Use":"Road running"}',1439000,'men',null,'/__l5e/assets-v1/223fa31f-e7d8-48e8-a5a6-3c4dcdb1720a/gen-zone2.jpg',false),
 ('PG7 Float Women','pg7-float-women','running','Soft, floaty cushioning designed for women runners.','{"Upper":"Knit","Cushioning":"PG7 Float foam","Drop":"8mm","Use":"Everyday running"}',1599000,'women','PG7','/__l5e/assets-v1/fdc3ba37-e131-4d92-8db6-c7ff80eac6f5/gen-pg7.jpg',false),
 ('KAI 2 SPEED','kai-2-speed','basketball','Low-top, speed-focused version of the KAI 2 for guards.','{"Upper":"Synthetic","Cushioning":"A-Flashedge","Fit":"Snug","Use":"Indoor court"}',1999000,'unisex','KAI','/__l5e/assets-v1/8565f7ec-6ecc-4479-86b6-866aada6a74d/gen-kai2speed.jpg',false)
) as v(name, slug, cat, descr, specs, price, gender, coll, img, feat)
join public.categories c on c.slug = v.cat
where s.slug = 'seaport';

insert into public.product_variants (product_id, size, stock)
select p.id, sz, case when sz in ('40','45') then 4 else 12 end
from public.products p, unnest(array['39','40','41','42','43','44','45']) sz;
