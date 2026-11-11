# Sports Gear Online Store

A full online shop for sports equipment and apparel: customers browse, add to cart, pay with real card payments, and track orders. Store owners manage products and orders from an admin area.

## Pages
- **Home** - bold hero, featured categories (Running, Football, Fitness, Cycling, Outdoor), best sellers, new arrivals
- **Shop** - product grid with filters (category, price, size, brand), search and sorting
- **Product page** - image gallery, size/color options, stock status, add to cart, related items
- **Cart** - edit quantities, remove items, order summary
- **Checkout** - secure card payment (Stripe), shipping address, tax calculated automatically
- **Order success** - confirmation with order number
- **Account** - sign up / sign in, order history, order details, saved address
- **Admin** (owner only) - dashboard with sales chart, product management (add/edit/delete, stock, images), order list with status updates (paid, shipped, delivered)

## Experience
- Energetic athletic look: dark charcoal with a vivid volt-green accent, condensed bold headings, light and dark mode
- Fully responsive with mobile menu and slide-out cart
- Loading skeletons, toast notifications, friendly empty states
- Starter catalog of ~16 sports products with generated photos so the store isn't empty

## Payments
- Built-in Stripe payments; a test mode is ready immediately so you can try checkout without real money. Going live requires claiming the Stripe account.
- Since these are physical goods, Stripe will calculate and collect sales tax at checkout (+0.5%); you handle tax filing.

## Technical details
- Lovable Cloud: tables for products, product_variants (size/color/stock), orders, order_items, profiles, user_roles (separate role table with has_role function); RLS so customers see only their own orders, admins manage everything; product images in storage
- Seeded products inserted in the migration
- Stripe Checkout session created server-side; webhook route marks orders paid and decrements stock
- Cart kept in the browser for guests, merged on sign-in
- Separate routes per page with their own titles/descriptions
