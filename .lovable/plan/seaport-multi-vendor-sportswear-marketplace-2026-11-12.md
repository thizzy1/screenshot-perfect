# Seaport - Multi-Vendor Sportswear Marketplace

A marketplace for premium basketball and sportswear (starting with the ANTA KAI line), branded **Seaport** using your logo, product photos and existing page design. Customers shop, sellers run their own stores, and an admin oversees the platform. Prices in Rupiah (IDR).

## Brand & look (from your Seaport files)
- Seaport anchor logo, deep purple hero (#1d1438 / #50357f) with red accent (#e50012), clean light-grey shop areas, glassy panels
- Hero "Kyrie: The Return" banner, "ANTA KAI FENG" feature section, Apparel & Accessories row, ANTA KAI Collection grid
- Your product photos used for KAI 1 Playoffs, KAI 2 Dallas, KAI 3 Magnetic Energy, KAI 3 Triple Black and the Anta banner; extra products (C202 GT, Zone 2, PG7 Float, KAI 2 Speed) get generated photos
- Navigation as in your design: Newest Drop, PG7, Men, Women, Member, search, cart counter
- Light and dark mode, fully responsive, loading skeletons, toasts, empty states, form validation

## Sign-in
- Email and password, Google sign-in
- Phone number login with SMS code
- Facebook login (needs your Facebook app ID/secret entered in Cloud auth settings - I'll guide you)
- On sign-up choose Customer or Seller; each role lands on its own dashboard; admin promotes users

## Customer
- Home / catalog: hero, category filters, search, product grid with price and stock badges
- Product page: gallery, specs, sizes, stock, Add to Cart / Buy Now
- Slide-out cart with quantity changes and remove
- Multi-step checkout: shipping address -> courier (Standard, Express, Pickup in store) -> payment
- Simulated payments, Midtrans/Xendit style: QRIS (shows QR code), bank transfer virtual account (generated VA number per bank), e-wallet (GoPay/OVO/DANA style), cash on delivery; "simulate payment" button marks it paid
- Order success page with invoice breakdown and status tracker; order history in account

## Seller dashboard
- Overview: total sales, active products, pending orders, revenue chart
- Products: add/edit/delete, prices, image upload, stock per size
- Orders: incoming orders for their store with status buttons (Processing, Shipped, Completed, Cancelled)
- Store profile (name, logo, description); stays "pending" until admin verifies

## Admin dashboard
- Platform stats: users, sellers, commission earned, transaction volume
- Users & sellers table: approve, suspend, ban, verify new sellers
- Settings: platform commission rate
- Transaction log across all stores

## Starter content
- Seaport as the first verified store with the ~8 products from your page, plus categories (Basketball Shoes, Running, Apparel, Accessories) so nothing starts empty

## Changes from the earlier plan
- Single store became multi-vendor marketplace with seller and admin dashboards
- Real Stripe payments replaced by simulated Indonesian payment methods (real Midtrans/Xendit can be connected later with your keys)

## Technical details
- Lovable Cloud tables: profiles, user_roles (customer/seller/admin, separate table + has_role), stores, categories, products, product_variants (size/stock), orders (per store), order_items, payments (method, VA number, status), platform_settings (commission), with RLS: buyers see own orders, sellers see own store data, admins everything
- Storage bucket for product and store images; your photos uploaded as assets
- Seed data in the migration
- Order placement and payment simulation via server functions that validate stock and compute commission
- Separate routes: /, /shop, /product/$slug, /cart, /checkout, /order/$id, /auth, /account, /seller/*, /admin/*, each with its own page title
