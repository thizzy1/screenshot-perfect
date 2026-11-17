import { Link } from "@tanstack/react-router";
import { ShieldCheck, Truck, RefreshCw, CreditCard, Sparkles } from "lucide-react";
import logo from "@/assets/Seaport.png.asset.json";
import { SizeGuideModal } from "@/components/store/SizeGuideModal";
import { Badge } from "@/components/ui/badge";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-hero-gradient text-hero-foreground">
      {/* VALUE PROPOSITION BAR */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4 md:px-7">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
              <ShieldCheck className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-sm">
                100% Authentic Sportswear
              </p>
              <p className="text-xs opacity-75">
                Jaminan keaslian original atau uang kembali 100%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Truck className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-sm">
                Pengiriman Seluruh Nusantara
              </p>
              <p className="text-xs opacity-75">
                Jangkauan ekspedisi cepat ke seluruh kota di Indonesia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Sparkles className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-sm">
                Verified Seller Network
              </p>
              <p className="text-xs opacity-75">
                Setiap toko dikurasi dan diverifikasi oleh admin Seaport
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
              <RefreshCw className="h-6 w-6 text-brand" />
            </div>
            <div>
              <p className="font-bold uppercase tracking-wider text-sm">
                Tukar Ukuran Fleksibel
              </p>
              <p className="text-xs opacity-75">
                Garansi penyesuaian ukuran bila sepatu tidak pas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FOOTER NAVIGATION */}
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-4 md:px-7">
        {/* BRAND IDENTITY */}
        <div className="space-y-4">
          <Link to="/" className="inline-block">
            <img src={logo.url} alt="Seaport" className="h-10 w-auto brightness-0 invert" />
          </Link>
          <p className="text-sm opacity-80 leading-relaxed">
            Marketplace sportswear premium terpercaya di Indonesia. Dapatkan sepatu basket ANTA KAI, PG7, running shoes, dan perlengkapan olahraga original dengan jaminan keaslian 100%.
          </p>
          <div className="pt-2">
            <Badge variant="outline" className="border-white/20 text-white/90 text-xs">
              Official Marketplace
            </Badge>
          </div>
        </div>

        {/* SHOP DIRECTORY */}
        <div className="space-y-3 text-sm">
          <p className="font-display font-bold uppercase tracking-wider text-base text-white">
            Katalog Belanja
          </p>
          <ul className="space-y-2 opacity-80">
            <li>
              <Link to="/shop" search={{ collection: "KAI" }} className="hover:text-white hover:underline transition">
                ANTA KAI Collection
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ collection: "PG7" }} className="hover:text-white hover:underline transition">
                PG7 Basketball Shoes
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "running" }} className="hover:text-white hover:underline transition">
                Sepatu Lari (Running)
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ category: "apparel" }} className="hover:text-white hover:underline transition">
                Apparel & Jersey
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ gender: "men" }} className="hover:text-white hover:underline transition">
                Pria (Men's Sportswear)
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ gender: "women" }} className="hover:text-white hover:underline transition">
                Wanita (Women's Gear)
              </Link>
            </li>
          </ul>
        </div>

        {/* BANTUAN & PANDUAN */}
        <div className="space-y-3 text-sm">
          <p className="font-display font-bold uppercase tracking-wider text-base text-white">
            Bantuan & Layanan
          </p>
          <ul className="space-y-2 opacity-80">
            <li>
              <SizeGuideModal
                trigger={
                  <button type="button" className="hover:text-white hover:underline transition text-left">
                    Panduan Ukuran (Size Guide)
                  </button>
                }
              />
            </li>
            <li>
              <Link to="/account" className="hover:text-white hover:underline transition">
                Lacak Pesanan Saya
              </Link>
            </li>
            <li>
              <Link to="/seller" className="hover:text-white hover:underline transition">
                Buka Toko / Menjadi Seller
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-white hover:underline transition">
                Keranjang Belanja
              </Link>
            </li>
          </ul>
        </div>

        {/* METODE PEMBAYARAN */}
        <div className="space-y-3 text-sm">
          <p className="font-display font-bold uppercase tracking-wider text-base text-white flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span>Metode Pembayaran</span>
          </p>
          <p className="text-xs opacity-75">
            Didukung pembayaran aman & instan melalui payment gateway resmi:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-bold tracking-wide">
              QRIS
            </span>
            <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold">
              BCA Virtual Account
            </span>
            <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold">
              Mandiri VA
            </span>
            <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold">
              BNI / BRI VA
            </span>
            <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold">
              GoPay
            </span>
            <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold">
              OVO
            </span>
            <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold">
              ShopeePay
            </span>
            <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold">
              COD (Bayar di Tempat)
            </span>
          </div>
        </div>
      </div>

      {/* COPYRIGHT & COMPLIANCE */}
      <div className="border-t border-white/10 py-6 text-center text-xs opacity-60">
        <p>© {new Date().getFullYear()} Seaport Marketplace. All rights reserved · 100% Authentic Sportswear Marketplace.</p>
      </div>
    </footer>
  );
}
